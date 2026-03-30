// Direct migration script for FBR tables — bypasses drizzle-kit interactive prompts
// Run: node scripts/migrate-fbr.mjs

import { readFileSync } from 'fs';
import { neon } from '@neondatabase/serverless';

// Load env from .env.local
const envFile = readFileSync('.env.local', 'utf8');
const envVars = Object.fromEntries(
  envFile.split('\n')
    .filter(line => line.includes('=') && !line.startsWith('#'))
    .map(line => {
      const idx = line.indexOf('=');
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    })
);

const DATABASE_URL = envVars.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL not found in .env.local');

const sql = neon(DATABASE_URL);

const steps = [
  // 1. Add new values to invoice_status enum
  ['Add validating to invoice_status', () => sql`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'invoice_status'::regtype AND enumlabel = 'validating') THEN ALTER TYPE invoice_status ADD VALUE 'validating'; END IF; END $$`],
  ['Add validated to invoice_status', () => sql`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'invoice_status'::regtype AND enumlabel = 'validated') THEN ALTER TYPE invoice_status ADD VALUE 'validated'; END IF; END $$`],
  ['Add submitting to invoice_status', () => sql`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'invoice_status'::regtype AND enumlabel = 'submitting') THEN ALTER TYPE invoice_status ADD VALUE 'submitting'; END IF; END $$`],
  ['Add issued to invoice_status', () => sql`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'invoice_status'::regtype AND enumlabel = 'issued') THEN ALTER TYPE invoice_status ADD VALUE 'issued'; END IF; END $$`],
  ['Add failed to invoice_status', () => sql`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'invoice_status'::regtype AND enumlabel = 'failed') THEN ALTER TYPE invoice_status ADD VALUE 'failed'; END IF; END $$`],

  // 2. Add new columns to invoices table
  ['Add fbr_submission_id to invoices', () => sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS fbr_submission_id UUID`],
  ['Add issued_at to invoices', () => sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issued_at TIMESTAMP`],

  // 3. Create enums
  ['Create fbr_submission_status enum', () => sql`DO $$ BEGIN CREATE TYPE fbr_submission_status AS ENUM ('validating', 'validated', 'submitting', 'issued', 'failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`],
  ['Create fbr_environment enum', () => sql`DO $$ BEGIN CREATE TYPE fbr_environment AS ENUM ('sandbox', 'production'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`],
  ['Create fbr_reference_data_type enum', () => sql`DO $$ BEGIN CREATE TYPE fbr_reference_data_type AS ENUM ('provinces', 'hs_codes', 'uom', 'hs_uom', 'tax_rates', 'doc_types', 'trans_types', 'sro_schedule', 'sro_items'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`],
  ['Create statl_status enum', () => sql`DO $$ BEGIN CREATE TYPE statl_status AS ENUM ('active', 'inactive', 'unknown'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`],

  // 4. Create fbr_submissions table
  ['Create fbr_submissions table', () => sql`
    CREATE TABLE IF NOT EXISTS fbr_submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      status fbr_submission_status NOT NULL DEFAULT 'validating',
      validate_request JSONB,
      validate_response JSONB,
      post_request JSONB,
      post_response JSONB,
      fbr_invoice_number VARCHAR(50),
      fbr_error_codes JSONB,
      environment fbr_environment NOT NULL DEFAULT 'sandbox',
      scenario_id VARCHAR(10),
      attempted_at TIMESTAMP NOT NULL DEFAULT NOW(),
      issued_at TIMESTAMP
    )
  `],

  // 5. Create fbr_reference_cache table
  ['Create fbr_reference_cache table', () => sql`
    CREATE TABLE IF NOT EXISTS fbr_reference_cache (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      cache_key VARCHAR(255) NOT NULL UNIQUE,
      data_type fbr_reference_data_type NOT NULL,
      payload JSONB NOT NULL,
      etag VARCHAR(255),
      fetched_at TIMESTAMP NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL
    )
  `],

  // 6. Create buyer_registry table
  ['Create buyer_registry table', () => sql`
    CREATE TABLE IF NOT EXISTS buyer_registry (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id TEXT NOT NULL,
      ntn_cnic VARCHAR(13) NOT NULL,
      business_name VARCHAR(255) NOT NULL,
      province VARCHAR(100),
      address TEXT,
      registration_type VARCHAR(50),
      statl_status statl_status DEFAULT 'unknown',
      statl_status_code VARCHAR(10),
      statl_checked_at TIMESTAMP,
      last_used_at TIMESTAMP NOT NULL DEFAULT NOW(),
      use_count INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `],

  // 7. Create unique index on buyer_registry
  ['Create buyer_registry unique index', () => sql`CREATE UNIQUE INDEX IF NOT EXISTS buyer_registry_org_ntn_idx ON buyer_registry (organization_id, ntn_cnic)`],
];

console.log('Running FBR migration...\n');
let success = 0;
for (const [i, [label, fn]] of steps.entries()) {
  try {
    await fn();
    console.log(`  ✓ [${i + 1}/${steps.length}] ${label}`);
    success++;
  } catch (err) {
    console.error(`  ✗ [${i + 1}/${steps.length}] ${label}: ${err.message}`);
  }
}
console.log(`\nMigration complete: ${success}/${steps.length} steps succeeded`);
