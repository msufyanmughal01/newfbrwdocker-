import { NextRequest, NextResponse } from "next/server";
import { validateAdminRequest } from "../_admin-auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  if (!validateAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { userId } = body as { userId: string };

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  await db.delete(userTable).where(eq(userTable.id, userId));
  return NextResponse.json({ success: true });
}
