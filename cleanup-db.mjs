// Cleanup script to drop invoice tables
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function cleanup() {
  console.log('🧹 Dropping invoice tables...');

  try {
    // Drop tables in correct order (child tables first)
    await sql`DROP TABLE IF EXISTS line_items CASCADE`;
    console.log('✓ Dropped line_items table');

    await sql`DROP TABLE IF EXISTS invoices CASCADE`;
    console.log('✓ Dropped invoices table');

    await sql`DROP TABLE IF EXISTS invoice_drafts CASCADE`;
    console.log('✓ Dropped invoice_drafts table');

    // Drop enums
    await sql`DROP TYPE IF EXISTS invoice_type CASCADE`;
    console.log('✓ Dropped invoice_type enum');

    await sql`DROP TYPE IF EXISTS buyer_registration_type CASCADE`;
    console.log('✓ Dropped buyer_registration_type enum');

    await sql`DROP TYPE IF EXISTS invoice_status CASCADE`;
    console.log('✓ Dropped invoice_status enum');

    console.log('\n✅ Cleanup complete! Now run: npm run db:push');
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

cleanup();
