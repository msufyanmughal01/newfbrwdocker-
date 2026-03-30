import { Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createTestUser() {
  try {
    console.log('Creating test user...');

    // Check if user already exists
    const existing = await pool.query(
      'SELECT email FROM "user" WHERE email = $1',
      ['test@example.com']
    );

    if (existing.rows.length > 0) {
      console.log('❌ Test user already exists: test@example.com');
      await pool.end();
      return;
    }

    // Note: Better Auth handles password hashing and user creation
    // You should use the registration API endpoint instead
    console.log('\n⚠️  Cannot create user directly in database.');
    console.log('Better Auth requires proper password hashing and session management.\n');
    console.log('Please register through the UI:');
    console.log('1. Go to http://localhost:3000/register');
    console.log('2. Create an account with email and password');
    console.log('3. Then log in at http://localhost:3000/login\n');

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

createTestUser();
