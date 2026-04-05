import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "./db";
import * as schema from "./db/schema";
import { ac, owner, operator, accountant } from "./auth-permissions";
import { sendPasswordResetEmail, sendInvitationEmail } from "./email";
import { encryptData, decryptData } from "./crypto/symmetric";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const { upsertBusinessProfile } = await import('./settings/business-profile');
          await upsertBusinessProfile(user.id, {});
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Passwords stored as plain text so admin can retrieve them for users
    password: {
      /**
       * Encrypt the password with AES-256-GCM before storing.
       * This is reversible (admin can retrieve) unlike bcrypt.
       * Requires ENCRYPTION_KEY env var.
       */
      hash: async (password) => encryptData(password.trim()),
      /**
       * Decrypt the stored value and compare.
       * Legacy rows (no "aes256gcm:" prefix) are compared as plain text —
       * they will be re-encrypted the next time the user changes their password.
       */
      verify: async ({ hash, password }) => {
        try {
          const stored = decryptData(hash); // plain text passthrough for legacy rows
          return stored.trim() === password.trim();
        } catch {
          return false;
        }
      },
    },
    sendResetPassword: async ({ user, url }) => {
      void sendPasswordResetEmail({
        to: user.email,
        resetLink: url,
      });
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
