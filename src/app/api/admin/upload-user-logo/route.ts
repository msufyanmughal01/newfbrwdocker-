// POST /api/admin/upload-user-logo
// Uploads a logo for any user (admin only).
// SVG is intentionally excluded — SVG can embed <script> tags (stored XSS).
// All accepted images are re-encoded to JPEG via sharp before storage.

import { NextRequest, NextResponse } from 'next/server';
import { validateAdminRequest } from '../_admin-auth';
import { db } from '@/lib/db';
import { businessProfiles } from '@/lib/db/schema/business-profiles';
import { user as userTable } from '@/lib/db/schema/auth';
import { eq } from 'drizzle-orm';
import sharp from 'sharp';
import { logAuditEvent, getRequestIp } from '@/lib/security/audit';

// SVG is excluded — it can contain <script> tags and cause stored XSS.
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_SIZE      = 2 * 1024 * 1024; // 2 MB
const MAX_DIMENSION = 1024;             // resize to fit within 1024×1024

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
  const file   = formData.get('logo');

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No logo file provided' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File exceeds 2 MB limit' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Allowed: jpg, png, webp (SVG is not accepted)' },
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

  const rawBuffer = Buffer.from(await file.arrayBuffer());

  // Re-encode with sharp: strips metadata, sanitises content, resizes if needed.
  // Output is always JPEG regardless of input format.
  let processedBuffer: Buffer;
  try {
    processedBuffer = await sharp(rawBuffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: 'Invalid or corrupt image file' }, { status: 400 });
  }

  const dataUrl = `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;

  await db
    .insert(businessProfiles)
    .values({ userId, logoPath: dataUrl })
    .onConflictDoUpdate({
      target: businessProfiles.userId,
      set: { logoPath: dataUrl, updatedAt: new Date() },
    });

  logAuditEvent({
    action:    'admin_upload_logo',
    ipAddress: getRequestIp(request),
    metadata:  { targetUserId: userId },
  });

  return NextResponse.json({ success: true, logoPath: dataUrl });
}
