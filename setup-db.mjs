import { readFileSync } from 'fs';
import { execSync } from 'child_process';

// Read .env.local file
const envContent = readFileSync('.env.local', 'utf-8');
const dbUrlMatch = envContent.match(/DATABASE_URL=(.+)/);

if (!dbUrlMatch) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

const dbUrl = dbUrlMatch[1].trim();
console.log('✓ Found DATABASE_URL');
console.log('✓ Pushing database schema...\n');

// Set environment variable and run drizzle push
process.env.DATABASE_URL = dbUrl;

try {
  execSync('npx drizzle-kit push', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: dbUrl }
  });
  console.log('\n✅ Database schema pushed successfully!');
} catch (error) {
  console.error('\n❌ Failed to push database schema');
  process.exit(1);
}
