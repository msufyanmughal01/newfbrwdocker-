// GET /api/admin/user-password?userId=...&key=...
// Returns the plain-text password stored for a user (admin only)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { account } from '@/lib/db/schema/auth';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const key = searchParams.get('key');

  const validKey = process.env.ADMIN_SECRET_KEY;
  if (!validKey || key !== validKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const rows = await db
    .select({ password: account.password })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, 'credential')))
    .limit(1);

  if (!rows.length || !rows[0].password) {
    return NextResponse.json({ error: 'Password not found' }, { status: 404 });
  }

  return NextResponse.json({ password: rows[0].password });
}
