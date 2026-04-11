import { NextResponse } from "next/server";
import { db }           from "@/lib/db";
import { organizationProfile } from "@/lib/db/schema";
import { eq }           from "drizzle-orm";
import { getSessionWithRole, requireRole } from "@/lib/utils";

// Field length limits — prevent oversized payloads and log flooding
const MAX_LENGTHS = {
  taxIdentifier: 50,
  phone:         20,
  address:       500,
  city:          100,
} as const;

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
    console.error("Profile fetch error:", error instanceof Error ? error.message : error);
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

    // ── Safe JSON parse ──────────────────────────────────────────────────────
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "Invalid request body" },
        { status: 400 }
      );
    }

    if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "Invalid request body" },
        { status: 400 }
      );
    }

    const body = rawBody as Record<string, unknown>;

    // ── Type coercion + length validation ─────────────────────────────────────
    const taxIdentifier = typeof body.taxIdentifier === "string" ? body.taxIdentifier.trim() : undefined;
    const phone         = typeof body.phone         === "string" ? body.phone.trim()         : undefined;
    const address       = typeof body.address       === "string" ? body.address.trim()       : undefined;
    const city          = typeof body.city          === "string" ? body.city.trim()          : undefined;

    if (taxIdentifier !== undefined && taxIdentifier.length > MAX_LENGTHS.taxIdentifier)
      return NextResponse.json({ error: "BAD_REQUEST", message: "Tax identifier is too long"  }, { status: 400 });
    if (phone         !== undefined && phone.length         > MAX_LENGTHS.phone)
      return NextResponse.json({ error: "BAD_REQUEST", message: "Phone number is too long"    }, { status: 400 });
    if (address       !== undefined && address.length       > MAX_LENGTHS.address)
      return NextResponse.json({ error: "BAD_REQUEST", message: "Address is too long"         }, { status: 400 });
    if (city          !== undefined && city.length          > MAX_LENGTHS.city)
      return NextResponse.json({ error: "BAD_REQUEST", message: "City name is too long"       }, { status: 400 });

    const [updated] = await db
      .update(organizationProfile)
      .set({ taxIdentifier, phone, address, city, updatedAt: new Date() })
      .where(eq(organizationProfile.userId, user.id))
      .returning();

    if (!updated) {
      const [created] = await db
        .insert(organizationProfile)
        .values({ userId: user.id, taxIdentifier, phone, address, city })
        .returning();
      return NextResponse.json(created);
    }

    return NextResponse.json(updated);

  } catch (error) {
    console.error("Profile update error:", error instanceof Error ? error.message : error);
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
