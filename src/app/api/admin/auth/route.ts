// POST /api/admin/auth  — set admin session cookie
// DELETE /api/admin/auth — clear admin session cookie

import { NextRequest, NextResponse } from "next/server";
import { makeSessionToken, revokeAdminToken } from "../_admin-auth";
import { logAuditEvent, getRequestIp } from "@/lib/security/audit";

// getRequestIp (from audit) reads x-forwarded-for and x-real-ip and is used
// for both rate limiting and audit events so the IP source is consistent.

const COOKIE_NAME    = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

// ── Rate limiter ─────────────────────────────────────────────────────────────
interface RateRecord { count: number; resetAt: number }
const loginAttempts = new Map<string, RateRecord>();
const MAX_ATTEMPTS  = 5;
const WINDOW_MS     = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const rec = loginAttempts.get(ip);
  if (!rec || now >= rec.resetAt) return { allowed: true };
  if (rec.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSeconds: Math.ceil((rec.resetAt - now) / 1000) };
  }
  return { allowed: true };
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const rec = loginAttempts.get(ip);
  if (!rec || now >= rec.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    rec.count += 1;
  }
}

function clearAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

// ── Handlers ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = getRequestIp(req) ?? "unknown";

  const { allowed, retryAfterSeconds } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    recordFailure(ip);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { key } = body as { key?: string };

  const validKey = process.env.ADMIN_SECRET_KEY;
  if (!validKey || key !== validKey) {
    recordFailure(ip);
    logAuditEvent({ action: "admin_login_failure", ipAddress: getRequestIp(req) });
    return NextResponse.json({ error: "Invalid key" }, { status: 401 });
  }

  clearAttempts(ip);
  logAuditEvent({ action: "admin_login", ipAddress: getRequestIp(req) });

  const token = makeSessionToken(validKey);

  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    path:     "/",
    maxAge:   COOKIE_MAX_AGE,
  });
  return res;
}

export async function DELETE(req: NextRequest) {
  // Revoke the token server-side so it is rejected even if the cookie persists
  // (e.g. extracted from a log, replayed from another device).
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (token) {
    revokeAdminToken(token);
  }

  const res = NextResponse.json({ success: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
