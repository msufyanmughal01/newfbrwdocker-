/**
 * In-memory admin session store.
 *
 * Stores opaque random tokens mapped to their expiry timestamp.
 * The raw ADMIN_SECRET_KEY is never placed in a cookie or exposed to the browser.
 *
 * Works correctly for a single-container Docker deployment where module state
 * persists for the lifetime of the process. Tokens auto-expire; the store also
 * prunes stale entries on each write to avoid unbounded growth.
 */

import { randomBytes } from 'node:crypto';

interface SessionRecord {
  expiresAt: number; // Unix ms
}

const store = new Map<string, SessionRecord>();

/** Remove all expired entries (called on write to bound memory usage). */
function prune(): void {
  const now = Date.now();
  for (const [token, record] of store) {
    if (now >= record.expiresAt) store.delete(token);
  }
}

/**
 * Create a new session token valid for `maxAgeSeconds`.
 * Returns the opaque 64-hex-char token to place in the cookie.
 */
export function createSession(maxAgeSeconds: number): string {
  prune();
  const token = randomBytes(32).toString('hex'); // 256 bits of entropy
  store.set(token, { expiresAt: Date.now() + maxAgeSeconds * 1000 });
  return token;
}

/**
 * Returns true if the token exists and has not expired.
 * Constant-time lookup is not meaningful here because the token is opaque
 * (attacker cannot derive the secret from it); Map.has() timing is acceptable.
 */
export function isValidSession(token: string): boolean {
  const record = store.get(token);
  if (!record) return false;
  if (Date.now() >= record.expiresAt) {
    store.delete(token);
    return false;
  }
  return true;
}

/** Invalidate a session immediately (called on logout). */
export function deleteSession(token: string): void {
  store.delete(token);
}
