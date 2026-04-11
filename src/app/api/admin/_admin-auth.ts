import { NextRequest } from "next/server";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const COOKIE_NAME = "admin_session";
const HMAC_CONTEXT  = "admin-session-v2";
const SESSION_TTL   = 8 * 60 * 60 * 1000; // 8 hours in ms

// ─────────────────────────────────────────────────────────────────────────────
// Server-side token blocklist (in-process revocation store)
//
// Entries are keyed by the token's "<issuedAt>:<nonce>" payload so that we
// never store the HMAC signature itself.  Stale entries (older than TTL) are
// pruned every 30 minutes to bound memory growth.
//
// For multi-replica deployments replace this Map with a shared Redis SET whose
// EXPIRE is set to SESSION_TTL — the revokeAdminToken / isTokenRevoked
// interface remains unchanged.
// ─────────────────────────────────────────────────────────────────────────────

const revokedTokens = new Set<string>();

setInterval(() => {
  const now = Date.now();
  for (const entry of revokedTokens) {
    const issuedAt = parseInt(entry.split(":")[0], 10);
    if (!isNaN(issuedAt) && now - issuedAt > SESSION_TTL) {
      revokedTokens.delete(entry);
    }
  }
}, 30 * 60_000);

/** Revoke an active session token so it is rejected on subsequent requests. */
export function revokeAdminToken(token: string): void {
  // Store only the non-secret payload portion (issuedAt:nonce), not the sig.
  const parts = token.split(":");
  if (parts.length === 3) {
    revokedTokens.add(`${parts[0]}:${parts[1]}`);
  }
}

function isTokenRevoked(token: string): boolean {
  const parts = token.split(":");
  if (parts.length !== 3) return false;
  return revokedTokens.has(`${parts[0]}:${parts[1]}`);
}

/**
 * Creates a non-deterministic, time-limited session token.
 *
 * Format: "<issuedAt>:<hex-nonce>:<hmac-sig>"
 *   - issuedAt  — epoch ms; used for expiry check
 *   - nonce     — 16 random bytes; ensures tokens differ for every login
 *   - sig       — HMAC-SHA256(key, "admin-session-v2:<issuedAt>:<nonce>")
 *
 * Stateless (no server-side store) but non-replayable after TTL.
 */
export function makeSessionToken(adminKey: string): string {
  const issuedAt = Date.now();
  const nonce    = randomBytes(16).toString("hex");
  const payload  = `${issuedAt}:${nonce}`;
  const sig      = createHmac("sha256", adminKey)
    .update(`${HMAC_CONTEXT}:${payload}`)
    .digest("hex");
  return `${payload}:${sig}`;
}

/**
 * Verifies a session token cookie value.
 * Returns false if expired, tampered, or malformed.
 */
export function verifyAdminCookie(cookieValue: string): boolean {
  const adminKey = process.env.ADMIN_SECRET_KEY;
  if (!adminKey || !cookieValue) return false;
  try {
    const parts = cookieValue.split(":");
    if (parts.length !== 3) return false;
    const [issuedAtStr, nonce, sig] = parts;

    const issuedAt = parseInt(issuedAtStr, 10);
    if (isNaN(issuedAt)) return false;

    // Reject expired tokens (independent of cookie maxAge)
    if (Date.now() - issuedAt > SESSION_TTL) return false;

    // Reject revoked tokens (e.g. after explicit logout or forced invalidation)
    if (isTokenRevoked(cookieValue)) return false;

    const payload  = `${issuedAtStr}:${nonce}`;
    const expected = createHmac("sha256", adminKey)
      .update(`${HMAC_CONTEXT}:${payload}`)
      .digest("hex");

    // Constant-time comparison — both values are 64 hex chars
    const sigBuf = Buffer.from(sig.padEnd(64, "0").slice(0, 64), "hex");
    const expBuf = Buffer.from(expected,                           "hex");
    return sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

/**
 * Validates an inbound admin API request by reading the httpOnly cookie.
 */
export function validateAdminRequest(req: NextRequest): boolean {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyAdminCookie(token);
}
