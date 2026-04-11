// POST /api/account/change-password

import { NextRequest, NextResponse } from "next/server";
import { auth }                       from "@/lib/auth";
import { checkPwnedPassword }          from "@/lib/security/hibp";
import { logAuditEvent, getRequestIp } from "@/lib/security/audit";

// Keep in sync with src/lib/auth.ts  minPasswordLength
const MIN_PASSWORD_LENGTH = 12;

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Safe JSON parse ────────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { currentPassword, newPassword } = body as Record<string, unknown>;

  if (typeof currentPassword !== "string" || typeof newPassword !== "string" ||
      !currentPassword.trim() || !newPassword.trim()) {
    return NextResponse.json(
      { error: "Both current and new password are required" },
      { status: 400 }
    );
  }

  // ── Minimum length (synced with auth.ts) ───────────────────────────────────
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    );
  }

  // ── HaveIBeenPwned breach check ────────────────────────────────────────────
  const hibp = await checkPwnedPassword(newPassword);
  if (hibp.breached && !hibp.error) {
    logAuditEvent({
      action:    "hibp_breach_blocked",
      userId:    session.user.id,
      ipAddress: getRequestIp(req),
      userAgent: req.headers.get("user-agent") ?? undefined,
      metadata:  { context: "password_change", breachCount: hibp.count },
    });
    return NextResponse.json(
      {
        error: `This password has appeared in ${hibp.count.toLocaleString()} known data breaches. Please choose a different password.`,
        code:  "PASSWORD_BREACHED",
      },
      { status: 400 }
    );
  }

  // ── Delegate to Better-Auth ────────────────────────────────────────────────
  try {
    await auth.api.changePassword({
      body:    { currentPassword, newPassword, revokeOtherSessions: false },
      headers: req.headers,
    });

    logAuditEvent({
      action:    "password_change",
      userId:    session.user.id,
      ipAddress: getRequestIp(req),
      userAgent: req.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({ success: true });

  } catch (err: unknown) {
    // Log server-side only — NEVER expose Better-Auth's internal error to client
    console.error(
      "[change-password] Failed for user",
      session.user.id,
      "—",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "Password change failed. Check that your current password is correct." },
      { status: 400 }
    );
  }
}
