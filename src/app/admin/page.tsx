import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";
import { account } from "@/lib/db/schema";
import { businessProfiles } from "@/lib/db/schema/business-profiles";
import { desc, eq, sql } from "drizzle-orm";
import { AdminDashboardClient } from "./admin-client";
import { verifyAdminCookie } from "@/app/api/admin/_admin-auth";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  if (!token || !verifyAdminCookie(token)) {
    redirect("/admin/login");
  }

  const rows = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      emailVerified: userTable.emailVerified,
      createdAt: userTable.createdAt,
      // Signup method: 'google' if they used Google OAuth, 'credential' otherwise
      provider: sql<string>`(
        SELECT CASE WHEN EXISTS(
          SELECT 1 FROM account a
          WHERE a.user_id = ${userTable.id} AND a.provider_id = 'google'
        ) THEN 'google' ELSE 'credential' END
      )`.as("provider"),
      // Business info
      businessName: businessProfiles.businessName,
      ntnCnic: businessProfiles.ntnCnic,
      phone: businessProfiles.phone,
      province: businessProfiles.province,
      address: businessProfiles.address,
      city: businessProfiles.city,
      postalCode: businessProfiles.postalCode,
      fbrTokenHint: businessProfiles.fbrTokenHint,
      logoPath: businessProfiles.logoPath,
      planSlug: businessProfiles.planSlug,
      planActivatedAt: businessProfiles.planActivatedAt,
      billingCycleStart: businessProfiles.billingCycleStart,
      // Personal info
      fatherName: businessProfiles.fatherName,
      cnic: businessProfiles.cnic,
      dateOfBirth: businessProfiles.dateOfBirth,
      gender: businessProfiles.gender,
      emergencyContact: businessProfiles.emergencyContact,
      notes: businessProfiles.notes,
    })
    .from(userTable)
    .leftJoin(businessProfiles, eq(userTable.id, businessProfiles.userId))
    .orderBy(desc(userTable.createdAt));

  // adminKey is NOT passed to the client — cookie auth handles API calls
  return <AdminDashboardClient users={rows} />;
}
