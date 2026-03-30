// Verify that invoice tables were created
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function verifyTables() {
  console.log('🔍 Verifying invoice tables...\n');

  try {
    // Check tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('invoices', 'line_items', 'invoice_drafts')
      ORDER BY table_name
    `;

    console.log('📊 Tables created:');
    tables.forEach(t => console.log(`  ✓ ${t.table_name}`));

    // Check enums
    const enums = await sql`
      SELECT typname
      FROM pg_type
      WHERE typname IN ('invoice_type', 'buyer_registration_type', 'invoice_status')
      ORDER BY typname
    `;

    console.log('\n📋 Enums created:');
    enums.forEach(e => console.log(`  ✓ ${e.typname}`));

    // Count columns in invoices table
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'invoices'
      ORDER BY ordinal_position
    `;

    console.log(`\n✅ Invoice table has ${columns.length} columns`);
    console.log(`\n🎉 Database setup complete!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyTables();
