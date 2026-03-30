const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');

// Read DATABASE_URL from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);
const DATABASE_URL = dbUrlMatch ? dbUrlMatch[1].trim() : null;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function migrate() {
  try {
    console.log('Running migration: Rename organization_id to user_id...');

    await pool.query(`
      ALTER TABLE organization_profile
      RENAME COLUMN organization_id TO user_id;
    `);

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    if (error.message.includes('column "organization_id" does not exist')) {
      console.log('⚠️  Column already renamed or migration already applied');
    } else {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  } finally {
    await pool.end();
  }
}

migrate().catch(console.error);
