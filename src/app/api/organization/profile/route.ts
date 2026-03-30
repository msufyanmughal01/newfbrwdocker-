import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizationProfile } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSessionWithRole, requireRole } from "@/lib/utils";

export async function GET() {
  try {
    const { user } = await getSessionWithRole();

    const [profile] = await db
      .select()
      .from(organizationProfile)
      .where(eq(organizationProfile.userId, user.id));

    if (!profile) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Profile fetch error:", error);
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Not authenticated" },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { user, role } = await getSessionWithRole();
    requireRole(role, "owner");

    const body = await request.json() as {
      taxIdentifier?: string;
      phone?: string;
      address?: string;
      city?: string;
    };

    const [updated] = await db
      .update(organizationProfile)
      .set({
        taxIdentifier: body.taxIdentifier,
        phone: body.phone,
        address: body.address,
        city: body.city,
        updatedAt: new Date(),
      })
      .where(eq(organizationProfile.userId, user.id))
      .returning();

    if (!updated) {
      // Create profile if it doesn't exist
      const [created] = await db
        .insert(organizationProfile)
        .values({
          userId: user.id,
          taxIdentifier: body.taxIdentifier,
          phone: body.phone,
          address: body.address,
          city: body.city,
        })
        .returning();

      return NextResponse.json(created);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Profile update error:", error);
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Not authenticated" },
        { status: 401 }
      );
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Owner role required" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Internal server error" },
      { status: 500 }
    );
  }
}
