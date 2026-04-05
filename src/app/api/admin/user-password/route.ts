// GET /api/admin/user-password?userId=...
// Returns the plain-text password stored for a user (admin only)
// Auth: admin_session cookie (set by POST /api/admin/auth)

import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '../_admin-auth';
import { db } from '@/lib/db';
import { account } from '@/lib/db/schema/auth';
import { eq, and } from 'drizzle-orm';
import { decryptData } from '@/lib/crypto/symmetric';

export async function GET(request: NextRequest) {
  if (!validateAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

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

  // Decrypt before returning — legacy plain-text rows are passed through unchanged
  const plaintext = decryptData(rows[0].password);
  return NextResponse.json({ password: plaintext });
}
