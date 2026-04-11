import { NextRequest, NextResponse }   from "next/server";
import { validateAdminRequest }         from "../_admin-auth";
import { db }                           from "@/lib/db";
import { eq }                           from "drizzle-orm";
import { businessProfiles }             from "@/lib/db/schema/business-profiles";
import { user as userTable }            from "@/lib/db/schema/auth";
import { encrypt }                      from "@/lib/settings/encryption";
import { encryptData }                  from "@/lib/crypto/symmetric";
import { logAuditEvent, getRequestIp }  from "@/lib/security/audit";

export async function POST(req: NextRequest) {
  if (!validateAdminRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Safe JSON parse ────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    userId,
    businessName, ntnCnic, phone, province, address, city, postalCode,
    fatherName, cnic, dateOfBirth, gender, emergencyContact, notes,
    fbrToken, planSlug, billingCycleStart,
  } = body as {
    userId?: string;
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
    planSlug?: string;
    billingCycleStart?: string;
  };

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // ── Format validation for sensitive fields ─────────────────────────────────
  // NTN: 7 digits  |  CNIC: 13 digits (no dashes)
  const NTN_CNIC_RE = /^(\d{7}|\d{13})$/;
  if (ntnCnic !== undefined && ntnCnic.trim() && !NTN_CNIC_RE.test(ntnCnic.trim())) {
    return NextResponse.json(
      { error: "ntnCnic must be a 7-digit NTN or 13-digit CNIC (digits only, no dashes)" },
      { status: 400 }
    );
  }
  if (cnic !== undefined && cnic.trim() && !/^\d{13}$/.test(cnic.trim())) {
    return NextResponse.json(
      { error: "cnic must be exactly 13 digits (no dashes)" },
      { status: 400 }
    );
  }
  if (dateOfBirth !== undefined && dateOfBirth.trim()) {
    const parsed = new Date(dateOfBirth.trim());
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "dateOfBirth must be a valid date" }, { status: 400 });
    }
  }

  const users = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  if (!users.length) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (businessName     !== undefined) update.businessName     = businessName.trim()     || null;
  if (ntnCnic          !== undefined) update.ntnCnic          = ntnCnic.trim()          ? encryptData(ntnCnic.trim())    : null;
  if (phone            !== undefined) update.phone            = phone.trim()            || null;
  if (province         !== undefined) update.province         = province.trim()         || null;
  if (address          !== undefined) update.address          = address.trim()          || null;
  if (city             !== undefined) update.city             = city.trim()             || null;
  if (postalCode       !== undefined) update.postalCode       = postalCode.trim()       || null;
  if (fatherName       !== undefined) update.fatherName       = fatherName.trim()       || null;
  if (cnic             !== undefined) update.cnic             = cnic.trim()             ? encryptData(cnic.trim())       : null;
  if (dateOfBirth      !== undefined) update.dateOfBirth      = dateOfBirth.trim()      || null;
  if (gender           !== undefined) update.gender           = gender.trim()           || null;
  if (emergencyContact !== undefined) update.emergencyContact = emergencyContact.trim() || null;
  if (notes            !== undefined) update.notes            = notes.trim()            || null;

  if (planSlug !== undefined) {
    const validSlugs = ["standard", "growth", "pro", "unlimited"];
    if (validSlugs.includes(planSlug)) {
      update.planSlug        = planSlug;
      update.planActivatedAt = new Date();
    }
  }

  if (billingCycleStart !== undefined) {
    if (!billingCycleStart) {
      update.billingCycleStart = null;
    } else {
      const parsed = new Date(billingCycleStart);
      if (!isNaN(parsed.getTime())) update.billingCycleStart = parsed;
    }
  }

  if (fbrToken && fbrToken.trim()) {
    const token              = fbrToken.trim();
    update.fbrTokenEncrypted = encrypt(token);
    update.fbrTokenHint      = token.slice(-4);
    update.fbrTokenUpdatedAt = new Date();
  }

  await db
    .insert(businessProfiles)
    .values({ userId, ...update } as typeof businessProfiles.$inferInsert)
    .onConflictDoUpdate({
      target: businessProfiles.userId,
      set:    update as Partial<typeof businessProfiles.$inferInsert>,
    });

  // Audit — record which fields changed without logging PII values
  logAuditEvent({
    action:    "admin_update_profile",
    ipAddress: getRequestIp(req),
    metadata:  {
      targetUserId:  userId,
      fieldsUpdated: Object.keys(update).filter((k) => k !== "updatedAt"),
    },
  });

  return NextResponse.json({ success: true });
}
