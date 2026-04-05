// POST /api/admin/auth  — set admin session cookie
// DELETE /api/admin/auth — clear admin session cookie

import { NextRequest, NextResponse } from "next/server";
import { createSession, deleteSession } from "../_session-store";

const COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

// ── Rate limiter ─────────────────────────────────────────────────────────────
// Simple in-memory per-IP brute-force protection.
// Blocks after MAX_ATTEMPTS failed logins within WINDOW_MS.

interface RateRecord { count: number; resetAt: number }
const loginAttempts = new Map<string, RateRecord>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

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
  const ip = getClientIp(req);

  const { allowed, retryAfterSeconds } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds) },
      }
    );
  }

  const body = await req.json();
  const { key } = body as { key?: string };

  const validKey = process.env.ADMIN_SECRET_KEY;
  if (!validKey || key !== validKey) {
    recordFailure(ip);
    return NextResponse.json({ error: "Invalid key" }, { status: 401 });
  }

  // Successful login — clear failure counter and issue an opaque session token.
  // The raw ADMIN_SECRET_KEY is never stored in the cookie.
  clearAttempts(ip);
  const token = createSession(COOKIE_MAX_AGE);

  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (token) deleteSession(token);

  const res = NextResponse.json({ success: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
