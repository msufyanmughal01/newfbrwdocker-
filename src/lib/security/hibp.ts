/**
 * HaveIBeenPwned Pwned Passwords — k-Anonymity API client
 *
 * Checks whether a plaintext password has appeared in known data breaches.
 * Uses the k-anonymity model so the full password NEVER leaves this server:
 *   1. Compute SHA-1 of the password.
 *   2. Send only the first 5 hex chars (prefix) to the HIBP API.
 *   3. HIBP returns all suffixes that share that prefix.
 *   4. Check locally whether our full hash suffix is in the response.
 *
 * API reference: https://haveibeenpwned.com/API/v3#PwnedPasswords
 *
 * Non-blocking: if the API is unreachable or times out the check returns
 * { breached: false } so registration / password-change is never blocked
 * by a third-party outage.  The error is logged as a warning only.
 */

import { createHash } from "node:crypto";

const HIBP_RANGE_URL = "https://api.pwnedpasswords.com/range/";
const TIMEOUT_MS     = 3_000; // 3 s — do not block the user for longer

export interface HIBPResult {
  /** true when the password hash was found in at least one breach */
  breached: boolean;
  /** Number of times this password appeared across all known breaches */
  count: number;
  /** Set only when the API call itself failed (network error, timeout, etc.) */
  error?: string;
}

/**
 * Check a plaintext password against HaveIBeenPwned Pwned Passwords.
 * Always resolves — never rejects.
 */
export async function checkPwnedPassword(password: string): Promise<HIBPResult> {
  const sha1   = createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${HIBP_RANGE_URL}${prefix}`, {
      headers: {
        // Requests HIBP to pad responses — prevents traffic analysis based on
        // response size.
        "Add-Padding": "true",
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      return { breached: false, count: 0, error: `HIBP API ${res.status}` };
    }

    const text  = await res.text();
    const lines = text.split("\r\n");

    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(":");
      if (hashSuffix?.trim() === suffix) {
        const count = parseInt(countStr ?? "0", 10);
        return { breached: count > 0, count };
      }
    }

    // Hash not found in any breach
    return { breached: false, count: 0 };

  } catch (err) {
    // Non-blocking: HIBP outage must not prevent users registering / changing passwords
    const msg = err instanceof Error ? err.message : "unknown";
    console.warn("[HIBP] Breach check unavailable (non-blocking):", msg);
    return { breached: false, count: 0, error: msg };

  } finally {
    clearTimeout(timer);
  }
}
