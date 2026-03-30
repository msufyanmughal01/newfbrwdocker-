import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "./db";
import * as schema from "./db/schema";
import { ac, owner, operator, accountant } from "./auth-permissions";
import { sendPasswordResetEmail, sendInvitationEmail } from "./email";

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
      hash: async (password) => password,
      verify: async ({ hash, password }) => hash === password,
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
