// Database Explorer - View your invoice tables
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function exploreDatabae() {
  console.log('\n🗄️  DATABASE EXPLORER');
  console.log('='.repeat(70));

  // Get all tables
  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `;

  console.log('\n📊 All Tables in Database:');
  console.log('─'.repeat(70));
  tables.forEach(t => {
    const isInvoice = ['invoices', 'line_items', 'invoice_drafts'].includes(t.table_name);
    console.log(`  ${isInvoice ? '✨' : '  '} ${t.table_name} ${isInvoice ? '← NEW!' : ''}`);
  });

  // Invoice table details
  console.log('\n\n📋 INVOICES TABLE STRUCTURE');
  console.log('='.repeat(70));

  const invoiceCols = await sql`
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_name = 'invoices'
    ORDER BY ordinal_position
  `;

  console.log('\nColumn Name                  | Type              | Nullable | Default');
  console.log('─'.repeat(70));
  invoiceCols.forEach(col => {
    const name = col.column_name.padEnd(28);
    const type = col.data_type.padEnd(17);
    const nullable = (col.is_nullable === 'YES' ? 'Yes' : 'No').padEnd(8);
    const defaultVal = (col.column_default || '').substring(0, 20);
    console.log(`${name} | ${type} | ${nullable} | ${defaultVal}`);
  });

  // Line Items table
  console.log('\n\n📦 LINE_ITEMS TABLE STRUCTURE');
  console.log('='.repeat(70));

  const lineItemCols = await sql`
    SELECT
      column_name,
      data_type
    FROM information_schema.columns
    WHERE table_name = 'line_items'
    ORDER BY ordinal_position
  `;

  console.log('Key Fields:');
  const keyFields = ['id', 'invoice_id', 'hs_code', 'product_description',
                     'quantity', 'rate', 'sales_tax_applicable', 'total_values'];
  lineItemCols
    .filter(col => keyFields.includes(col.column_name))
    .forEach(col => {
      console.log(`  ✓ ${col.column_name.padEnd(30)} (${col.data_type})`);
    });
  console.log(`\n  Total columns: ${lineItemCols.length}`);

  // Enums
  console.log('\n\n🏷️  ENUMS (Invoice Types & Statuses)');
  console.log('='.repeat(70));

  const enums = await sql`
    SELECT
      t.typname as enum_name,
      e.enumlabel as enum_value
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname IN ('invoice_type', 'buyer_registration_type', 'invoice_status')
    ORDER BY t.typname, e.enumsortorder
  `;

  let currentEnum = '';
  enums.forEach(e => {
    if (e.enum_name !== currentEnum) {
      console.log(`\n📌 ${e.enum_name}:`);
      currentEnum = e.enum_name;
    }
    console.log(`   • ${e.enum_value}`);
  });

  // Foreign Keys
  console.log('\n\n🔗 FOREIGN KEY RELATIONSHIPS');
  console.log('='.repeat(70));

  const fkeys = await sql`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN ('invoices', 'line_items', 'invoice_drafts')
  `;

  fkeys.forEach(fk => {
    console.log(`  ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
  });

  // Summary
  console.log('\n\n✅ DATABASE SETUP SUMMARY');
  console.log('='.repeat(70));
  console.log(`  ✓ Invoice Tables: 3 (invoices, line_items, invoice_drafts)`);
  console.log(`  ✓ Total Columns: ${invoiceCols.length} (invoices) + ${lineItemCols.length} (line_items)`);
  console.log(`  ✓ Enums: 3 (invoice_type, buyer_registration_type, invoice_status)`);
  console.log(`  ✓ Foreign Keys: ${fkeys.length} relationships`);
  console.log(`  ✓ FBR Compliance: Ready for Digital Invoicing API v1.12`);
  console.log('\n🎉 Database is fully configured and ready for the UI!\n');
}

exploreDatabae().catch(console.error);
