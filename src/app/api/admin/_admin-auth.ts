import { NextRequest } from "next/server";
import { isValidSession } from "./_session-store";

/**
 * Validates an inbound admin request.
 *
 * Checks the httpOnly `admin_session` cookie set by POST /api/admin/auth.
 * The cookie holds an opaque random token — the raw ADMIN_SECRET_KEY is
 * never stored in the cookie or compared here.
 */
export function validateAdminRequest(req: NextRequest): boolean {
  const token = req.cookies.get("admin_session")?.value;
  if (!token) return false;
  return isValidSession(token);
}
