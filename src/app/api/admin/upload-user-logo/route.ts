// POST /api/admin/upload-user-logo
// Uploads a logo for any user (admin only)

import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '../_admin-auth';
import { db } from '@/lib/db';
import { businessProfiles } from '@/lib/db/schema/business-profiles';
import { user as userTable } from '@/lib/db/schema/auth';
import { eq } from 'drizzle-orm';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg+xml',
};
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: NextRequest) {
  if (!validateAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const userId = formData.get('userId');
  const file = formData.get('logo');

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No logo file provided' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File exceeds 2MB limit' }, { status: 400 });
  }

  if (!ALLOWED_TYPES[file.type]) {
    return NextResponse.json({ error: 'Invalid file type. Allowed: jpg, png, webp, svg' }, { status: 400 });
  }

  const users = await db.select({ id: userTable.id }).from(userTable).where(eq(userTable.id, userId)).limit(1);
  if (!users.length) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');
  const dataUrl = `data:${file.type};base64,${base64}`;

  await db
    .insert(businessProfiles)
    .values({ userId, logoPath: dataUrl })
    .onConflictDoUpdate({
      target: businessProfiles.userId,
      set: { logoPath: dataUrl, updatedAt: new Date() },
    });

  return NextResponse.json({ success: true, logoPath: dataUrl });
}
