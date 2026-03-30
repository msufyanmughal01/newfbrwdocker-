import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";
import { businessProfiles } from "@/lib/db/schema/business-profiles";
import { desc, eq } from "drizzle-orm";
import { AdminDashboardClient } from "./admin-client";

interface Props {
  searchParams: Promise<{ key?: string }>;
}

export default async function AdminPage({ searchParams }: Props) {
  const { key } = await searchParams;
  const adminKey = process.env.ADMIN_SECRET_KEY;

  if (!adminKey || key !== adminKey) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#000" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "72px", fontWeight: "bold", margin: 0, color: "#1a1a1a" }}>404</h1>
          <p style={{ color: "#333", marginTop: "8px" }}>Page not found</p>
        </div>
      </div>
    );
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

  return <AdminDashboardClient users={rows} adminKey={key} />;
}
