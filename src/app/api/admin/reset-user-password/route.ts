// POST /api/admin/reset-user-password
// Sets a new password for any user (admin only).

import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '../_admin-auth';
import { db } from '@/lib/db';
import { account, user as userTable } from '@/lib/db/schema/auth';
import { eq, and } from 'drizzle-orm';
import { encryptData } from '@/lib/crypto/symmetric';

// Keep in sync with src/lib/auth.ts  minPasswordLength
const MIN_PASSWORD_LENGTH = 12;

export async function POST(req: NextRequest) {
  if (!validateAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse body safely — malformed JSON must not throw an unhandled 500
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { userId, newPassword } = body as {
    userId?: string;
    newPassword?: string;
  };

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  if (
    !newPassword ||
    typeof newPassword !== 'string' ||
    newPassword.length < MIN_PASSWORD_LENGTH
  ) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    );
  }

  const users = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  if (!users.length) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const updated = await db
    .update(account)
    .set({ password: encryptData(newPassword.trim()), updatedAt: new Date() })
    .where(and(eq(account.userId, userId), eq(account.providerId, 'credential')))
    .returning({ id: account.id });

  if (!updated.length) {
    return NextResponse.json(
      { error: 'No credential account found for this user' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
