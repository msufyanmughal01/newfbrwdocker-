// Edge-compatible auth instance used only by middleware.
// Identical to auth.ts EXCEPT:
//   - No databaseHooks (they import business-profile.ts → encryption.ts → node:crypto)
//   - No email callbacks (not needed for session validation)
// This keeps node:crypto out of the Edge Runtime bundle.

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db } from "./db";
import * as schema from "./db/schema";
import { ac, owner, operator, accountant } from "./auth-permissions";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  plugins: [
    organization({
      ac,
      roles: {
        owner,
        operator,
        accountant,
      },
    }),
  ],
});
