import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";
import { businessProfiles } from "@/lib/db/schema/business-profiles";
import { desc, eq } from "drizzle-orm";
import { AdminDashboardClient } from "./admin-client";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session");
  const adminKey = process.env.ADMIN_SECRET_KEY;

  if (!adminKey || adminSession?.value !== adminKey) {
    redirect("/admin/login");
  }

  const rows = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      emailVerified: userTable.emailVerified,
      createdAt: userTable.createdAt,
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
