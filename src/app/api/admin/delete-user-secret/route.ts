import { NextRequest, NextResponse } from "next/server";
import { validateAdminRequest } from "../_admin-auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logAuditEvent, getRequestIp } from "@/lib/security/audit";

export async function POST(req: NextRequest) {
  if (!validateAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { userId } = body as { userId: string };

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Confirm user exists before deleting (avoids silent no-ops)
  const existing = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  if (!existing.length) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Audit BEFORE deleting so the record is written even if deletion fails
  logAuditEvent({
    action:    "admin_delete_user",
    ipAddress: getRequestIp(req),
    metadata:  { targetUserId: userId },
  });

  await db.delete(userTable).where(eq(userTable.id, userId));
  return NextResponse.json({ success: true });
}
