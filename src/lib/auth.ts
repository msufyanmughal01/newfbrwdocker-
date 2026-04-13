import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "./db";
import * as schema from "./db/schema";
import { ac, owner, operator, accountant } from "./auth-permissions";
import { sendPasswordResetEmail, sendInvitationEmail } from "./email";
import { decryptData } from "./crypto/symmetric";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

// ── Password helpers (scrypt, one-way) ────────────────────────────────────────
// Format: "scrypt:<hex-salt>:<hex-key>"
// Migration: AES-encrypted and plain-text legacy rows still verify correctly
// and are re-hashed to scrypt the next time the user changes their password.

const SCRYPT_PREFIX = "scrypt:";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const key  = scryptSync(password.trim(), salt, 64).toString("hex");
  return `${SCRYPT_PREFIX}${salt}:${key}`;
}

function verifyPassword(hash: string, password: string): boolean {
  if (hash.startsWith(SCRYPT_PREFIX)) {
    const rest     = hash.slice(SCRYPT_PREFIX.length);
    const colonIdx = rest.indexOf(":");
    if (colonIdx === -1) return false;
    const salt      = rest.slice(0, colonIdx);
    const storedHex = rest.slice(colonIdx + 1);
    try {
      const derived   = scryptSync(password.trim(), salt, 64);
      const storedBuf = Buffer.from(storedHex, "hex");
      if (derived.length !== storedBuf.length) return false;
      return timingSafeEqual(derived, storedBuf);
    } catch { return false; }
  }
  // Legacy AES-encrypted — migration path, works until user resets password
  if (hash.startsWith("aes256gcm:")) {
    try { return decryptData(hash).trim() === password.trim(); }
    catch { return false; }
  }
  // Legacy plain-text (oldest rows)
  return hash === password;
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
    : [],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            const { upsertBusinessProfile } = await import('./settings/business-profile');
            await upsertBusinessProfile(user.id, {});
          } catch (err) {
            // Log but never block user creation — the profile can be created lazily on first login.
            console.error('[auth] Failed to create initial business profile for user', user.id, err);
          }
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    password: {
      hash:   async (password)         => hashPassword(password),
      verify: async ({ hash, password }) => verifyPassword(hash, password),
    },
    sendResetPassword: async ({ user, url }) => {
      void sendPasswordResetEmail({
        to: user.email,
        resetLink: url,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    organization({
      ac,
      roles: {
        owner,
        operator,
        accountant,
      },
      async sendInvitationEmail(data) {
        const inviteLink = `${process.env.BETTER_AUTH_URL}/accept-invitation/${data.id}`;
        void sendInvitationEmail({
          to: data.email,
          inviterName: data.inviter.user.name,
          inviterEmail: data.inviter.user.email,
          organizationName: data.organization.name,
          inviteLink,
        });
      },
    }),
  ],
});
