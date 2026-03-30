import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, adminKey } = body as { userId: string; adminKey: string };
  const validKey = process.env.ADMIN_SECRET_KEY;
  if (!validKey || adminKey !== validKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  await db.delete(userTable).where(eq(userTable.id, userId));
  return NextResponse.json({ success: true });
}
