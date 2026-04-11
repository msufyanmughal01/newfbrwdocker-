/**
 * Per-account (per-email) lockout tracker.
 *
 * Complements the IP-based rate limiter in middleware.ts.
 * IP-rate limiting alone is bypassable by rotating proxies; per-account
 * lockout protects specific accounts regardless of the source IP.
 *
 * Policy:
 *   10 consecutive failed login attempts within a 30-minute window
 *   → account is locked for 30 minutes.
 *   A successful login clears the counter immediately.
 *
 * Storage: in-memory (resets on process restart).
 * For HA / multi-replica deployments replace with a Redis-backed store.
 */

const MAX_FAILURES = 10;
const WINDOW_MS    = 30 * 60_000; // 30 minutes — counting window
const LOCKOUT_MS   = 30 * 60_000; // 30 minutes — lockout duration

interface LockRecord {
  failures:    number;
  windowStart: number;
  lockedUntil: number | null; // epoch ms, null = not locked
}

const store = new Map<string, LockRecord>();

// Prune stale entries every 15 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, rec] of store.entries()) {
    const lockExpired = rec.lockedUntil === null || now > rec.lockedUntil;
    const windowExpired = now - rec.windowStart > WINDOW_MS * 2;
    if (lockExpired && windowExpired) store.delete(key);
  }
}, 15 * 60_000);

export interface LockoutStatus {
  locked:             boolean;
  retryAfterSeconds:  number; // 0 when not locked
  failuresRemaining:  number; // attempts left before lockout triggers
}

/**
 * Read the current lockout status for an identifier (email, lowercase).
 * Does NOT mutate state.
 */
export function getLockoutStatus(identifier: string): LockoutStatus {
  const id  = identifier.toLowerCase().trim();
  const now = Date.now();
  const rec = store.get(id);

  if (!rec) {
    return { locked: false, retryAfterSeconds: 0, failuresRemaining: MAX_FAILURES };
  }

  // Active lockout?
  if (rec.lockedUntil && now < rec.lockedUntil) {
    return {
      locked:            true,
      retryAfterSeconds: Math.ceil((rec.lockedUntil - now) / 1000),
      failuresRemaining: 0,
    };
  }

  // Window expired — treat as fresh
  if (now - rec.windowStart >= WINDOW_MS) {
    store.delete(id);
    return { locked: false, retryAfterSeconds: 0, failuresRemaining: MAX_FAILURES };
  }

  return {
    locked:            false,
    retryAfterSeconds: 0,
    failuresRemaining: Math.max(0, MAX_FAILURES - rec.failures),
  };
}

/**
 * Record a failed login attempt for an identifier.
 * Returns the updated lockout status (may transition to locked).
 */
export function recordLoginFailure(identifier: string): LockoutStatus {
  const id  = identifier.toLowerCase().trim();
  const now = Date.now();
  const rec = store.get(id);

  if (!rec || now - rec.windowStart >= WINDOW_MS) {
    // Start a fresh window
    store.set(id, { failures: 1, windowStart: now, lockedUntil: null });
    return { locked: false, retryAfterSeconds: 0, failuresRemaining: MAX_FAILURES - 1 };
  }

  rec.failures += 1;

  if (rec.failures >= MAX_FAILURES) {
    rec.lockedUntil = now + LOCKOUT_MS;
    return {
      locked:            true,
      retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000),
      failuresRemaining: 0,
    };
  }

  return {
    locked:            false,
    retryAfterSeconds: 0,
    failuresRemaining: MAX_FAILURES - rec.failures,
  };
}

/**
 * Clear the lockout counter for an identifier.
 * Call this on a successful login.
 */
export function clearLoginFailures(identifier: string): void {
  store.delete(identifier.toLowerCase().trim());
}
