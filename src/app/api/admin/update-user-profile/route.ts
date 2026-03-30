import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { businessProfiles } from "@/lib/db/schema/business-profiles";
import { user as userTable } from "@/lib/db/schema/auth";
import { encrypt } from "@/lib/settings/encryption";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    userId, adminKey,
    businessName, ntnCnic, phone, province, address, city, postalCode,
    fatherName, cnic, dateOfBirth, gender, emergencyContact, notes,
    fbrToken,
  } = body as {
    userId: string;
    adminKey: string;
    businessName?: string;
    ntnCnic?: string;
    phone?: string;
    province?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    fatherName?: string;
    cnic?: string;
    dateOfBirth?: string;
    gender?: string;
    emergencyContact?: string;
    notes?: string;
    fbrToken?: string;
  };

  const validKey = process.env.ADMIN_SECRET_KEY;
  if (!validKey || adminKey !== validKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Verify user exists
  const users = await db.select({ id: userTable.id }).from(userTable).where(eq(userTable.id, userId)).limit(1);
  if (!users.length) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Build update payload
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (businessName !== undefined) update.businessName = businessName.trim() || null;
  if (ntnCnic !== undefined) update.ntnCnic = ntnCnic.trim() || null;
  if (phone !== undefined) update.phone = phone.trim() || null;
  if (province !== undefined) update.province = province.trim() || null;
  if (address !== undefined) update.address = address.trim() || null;
  if (city !== undefined) update.city = city.trim() || null;
  if (postalCode !== undefined) update.postalCode = postalCode.trim() || null;
  if (fatherName !== undefined) update.fatherName = fatherName.trim() || null;
  if (cnic !== undefined) update.cnic = cnic.trim() || null;
  if (dateOfBirth !== undefined) update.dateOfBirth = dateOfBirth.trim() || null;
  if (gender !== undefined) update.gender = gender.trim() || null;
  if (emergencyContact !== undefined) update.emergencyContact = emergencyContact.trim() || null;
  if (notes !== undefined) update.notes = notes.trim() || null;

  // Encrypt FBR token if provided
  if (fbrToken && fbrToken.trim()) {
    const token = fbrToken.trim();
    update.fbrTokenEncrypted = encrypt(token);
    update.fbrTokenHint = token.slice(-4);
    update.fbrTokenUpdatedAt = new Date();
  }

  await db
    .insert(businessProfiles)
    .values({ userId, ...update } as typeof businessProfiles.$inferInsert)
    .onConflictDoUpdate({
      target: businessProfiles.userId,
      set: update as Partial<typeof businessProfiles.$inferInsert>,
    });

  return NextResponse.json({ success: true });
}
