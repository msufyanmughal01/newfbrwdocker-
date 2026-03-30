// Script to create hs_code_master table directly
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = "postgresql://neondb_owner:npg_FnpEYQRd83iT@ep-holy-field-ag4zwb2e-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(DATABASE_URL);

async function main() {
  console.log('Creating hs_code_master table...');

  await sql`
    CREATE TABLE IF NOT EXISTS hs_code_master (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      hs_code VARCHAR(20) NOT NULL,
      description TEXT NOT NULL,
      uom VARCHAR(100),
      is_active BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS hs_master_user_code_idx ON hs_code_master(user_id, hs_code)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS hs_master_user_active_idx ON hs_code_master(user_id, is_active)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS hs_master_user_sort_idx ON hs_code_master(user_id, sort_order)
  `;

  console.log('✅ hs_code_master table created successfully');

  // Verify
  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'hs_code_master'
  `;
  console.log('Verification:', tables[0]?.table_name ? '✅ Table exists' : '❌ Table not found');
}

main().catch(console.error);
