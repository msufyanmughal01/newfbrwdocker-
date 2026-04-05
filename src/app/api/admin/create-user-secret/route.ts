import { NextRequest, NextResponse } from "next/server";
import { validateAdminRequest } from "../_admin-auth";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { user as userTable } from "@/lib/db/schema/auth";
import { businessProfiles } from "@/lib/db/schema/business-profiles";

export async function POST(req: NextRequest) {
  if (!validateAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name, email, password,
    phone, businessName, ntnCnic,
    fatherName, cnic, province, address, city, postalCode,
    dateOfBirth, gender, emergencyContact, notes,
  } = body as {
    name: string;
    email: string;
    password: string;
    phone?: string;
    businessName?: string;
    ntnCnic?: string;
    fatherName?: string;
    cnic?: string;
    province?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    dateOfBirth?: string;
    gender?: string;
    emergencyContact?: string;
    notes?: string;
  };

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  let result;
  try {
    result = await auth.api.signUpEmail({
      body: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create user";
    const isExists = msg.toLowerCase().includes("already exists") || msg.toLowerCase().includes("already_exists");
    return NextResponse.json(
      { error: isExists ? "A user with this email already exists." : msg },
      { status: 422 }
    );
  }

  if (!result?.user) {
    return NextResponse.json({ error: "Failed to create user. Email may already exist." }, { status: 500 });
  }

  // Auto-verify email — admin-created accounts don't need email verification
  try {
    await db
      .update(userTable)
      .set({ emailVerified: true })
      .where(eq(userTable.id, result.user.id));
  } catch {
    // non-fatal
  }

  const profileData = {
    businessName: businessName?.trim() || null,
    ntnCnic: ntnCnic?.trim() || null,
    phone: phone?.trim() || null,
    fatherName: fatherName?.trim() || null,
    cnic: cnic?.trim() || null,
    province: province?.trim() || null,
    address: address?.trim() || null,
    city: city?.trim() || null,
    postalCode: postalCode?.trim() || null,
    dateOfBirth: dateOfBirth?.trim() || null,
    gender: gender?.trim() || null,
    emergencyContact: emergencyContact?.trim() || null,
    notes: notes?.trim() || null,
  };

  const hasData = Object.values(profileData).some((v) => v !== null);
  if (hasData) {
    try {
      await db
        .insert(businessProfiles)
        .values({ userId: result.user.id, ...profileData })
        .onConflictDoUpdate({
          target: businessProfiles.userId,
          set: { ...profileData, updatedAt: new Date() },
        });
    } catch {
      // non-fatal — user was created, just couldn't save extra details
    }
  }

  return NextResponse.json({
    success: true,
    credentials: {
      name: result.user.name,
      email: result.user.email,
      password,
    },
  });
}
