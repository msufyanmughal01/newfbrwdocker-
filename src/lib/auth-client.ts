import { createAuthClient } from "better-auth/client";
import { organizationClient } from "better-auth/client/plugins";

// No baseURL — uses relative paths so it works on any host
// (localhost in dev, LAN IP on mobile, production domain in prod).
// The browser automatically resolves /api/auth/* against the current origin.
export const authClient = createAuthClient({
  plugins: [organizationClient()],
});
