// POST /api/admin/reset-user-password
// Sets a new plain-text password for any user (admin only)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { account, user as userTable } from '@/lib/db/schema/auth';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { userId, adminKey, newPassword } = body as {
    userId: string;
    adminKey: string;
    newPassword: string;
  };

  const validKey = process.env.ADMIN_SECRET_KEY;
  if (!validKey || adminKey !== validKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  // Verify user exists
  const users = await db.select({ id: userTable.id }).from(userTable).where(eq(userTable.id, userId)).limit(1);
  if (!users.length) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Update the credential account's password directly (plain text)
  const updated = await db
    .update(account)
    .set({ password: newPassword, updatedAt: new Date() })
    .where(and(eq(account.userId, userId), eq(account.providerId, 'credential')))
    .returning({ id: account.id });

  if (!updated.length) {
    return NextResponse.json({ error: 'No credential account found for this user' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
