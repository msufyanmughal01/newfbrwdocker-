import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Cached session lookup — deduplicates auth.api.getSession() calls within
 * a single server-render pass (layout + page both call this, but only one
 * DB round-trip occurs per request).
 */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});
