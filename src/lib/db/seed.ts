import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { organizationProfile } from "./schema";

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log("Seeding user profiles...");

  // Create user profiles for demo users
  // Note: Users are created via Better Auth API.
  // This seed script creates the extended profile data only.
  // Run Better Auth CLI or use the registration flow to create
  // users first, then populate their profiles here.

  await db
    .insert(organizationProfile)
    .values([
      {
        id: "profile-1",
        userId: "user-1",
        taxIdentifier: "1234567-8",
        phone: "+92-300-1234567",
        address: "123 Business Avenue",
        city: "Karachi",
        status: "active",
      },
      {
        id: "profile-2",
        userId: "user-2",
        taxIdentifier: "8765432-1",
        phone: "+92-321-7654321",
        address: "456 Commerce Street",
        city: "Lahore",
        status: "active",
      },
    ])
    .onConflictDoNothing();

  console.log("Seed complete.");
  await pool.end();
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
