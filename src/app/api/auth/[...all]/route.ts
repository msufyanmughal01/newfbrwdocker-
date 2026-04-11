/**
 * Better-Auth catch-all route — wraps the default handler with:
 *
 *  1. Account lockout (per email)
 *     • On sign-in: reject immediately if account is locked.
 *     • On sign-in failure (401/400): record a failure; lock after 10 attempts.
 *     • On sign-in success: clear failure counter.
 *
 *  2. HaveIBeenPwned breach check (registration only)
 *     • Before creating the account, check the chosen password against HIBP.
 *     • If found in breaches, reject with a 400 and a clear message.
 *     • Non-blocking: if HIBP is unreachable, registration proceeds normally.
 *
 *  3. Audit logging
 *     • login_success / login_failure / account_locked events written to DB.
 */

import { auth }         from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

import { getLockoutStatus, recordLoginFailure, clearLoginFailures } from "@/lib/security/account-lockout";
import { checkPwnedPassword }                                        from "@/lib/security/hibp";
import { logAuditEvent, getRequestIp }                               from "@/lib/security/audit";

// ── Better-Auth base handlers ──────────────────────────────────────────────
const { POST: authPost, GET: authGet } = toNextJsHandler(auth);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Safely parse the JSON body of a cloned request without throwing */
async function tryParseBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const clone = req.clone();
    return (await clone.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<Response> {
  const { pathname } = req.nextUrl;
  const ip           = getRequestIp(req);
  const ua           = req.headers.get("user-agent") ?? undefined;

  // ── 1. Sign-in: account lockout pre-check ─────────────────────────────────
  if (pathname.includes("/sign-in/email")) {
    const body  = await tryParseBody(req);
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : null;

    if (email) {
      const status = getLockoutStatus(email);

      if (status.locked) {
        logAuditEvent({ action: "login_failure", ipAddress: ip, userAgent: ua,
          metadata: { reason: "account_locked", minutesRemaining: Math.ceil(status.retryAfterSeconds / 60) } });
        return NextResponse.json(
          { error: `Account is temporarily locked. Try again in ${Math.ceil(status.retryAfterSeconds / 60)} minute(s).` },
          { status: 429, headers: { "Retry-After": String(status.retryAfterSeconds) } }
        );
      }
    }

    // Pass to Better-Auth and observe the outcome
    const response = await authPost(req);

    if (email) {
      if (response.status === 401 || response.status === 400) {
        const lockStatus = recordLoginFailure(email);
        logAuditEvent({ action: "login_failure", ipAddress: ip, userAgent: ua,
          metadata: { failuresRemaining: lockStatus.failuresRemaining } });

        if (lockStatus.locked) {
          logAuditEvent({ action: "account_locked", ipAddress: ip, userAgent: ua,
            metadata: { lockedForSeconds: lockStatus.retryAfterSeconds } });
        }
      } else if (response.status === 200 || response.status === 201) {
        clearLoginFailures(email);
        logAuditEvent({ action: "login_success", ipAddress: ip, userAgent: ua });
      }
    }

    return response;
  }

  // ── 2. Sign-up: HaveIBeenPwned breach check ────────────────────────────────
  if (pathname.includes("/sign-up/email")) {
    const body     = await tryParseBody(req);
    const password = typeof body?.password === "string" ? body.password : null;

    if (password) {
      const hibp = await checkPwnedPassword(password);

      if (hibp.breached && !hibp.error) {
        // Password is known-breached — reject before account creation
        logAuditEvent({ action: "hibp_breach_blocked", ipAddress: ip, userAgent: ua,
          metadata: { breachCount: hibp.count } });

        return NextResponse.json(
          {
            error: `This password has appeared in ${hibp.count.toLocaleString()} known data breaches and cannot be used. Please choose a unique password.`,
            code:  "PASSWORD_BREACHED",
          },
          { status: 400 }
        );
      }
    }
  }

  // ── 3. All other auth routes: pass through ────────────────────────────────
  return authPost(req);
}

export const GET = authGet;
