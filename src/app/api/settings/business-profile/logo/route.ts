// POST /api/settings/business-profile/logo
// Converts uploaded logo to base64 data URL and stores directly in DB

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { businessProfiles } from '@/lib/db/schema/business-profiles';
import { eq } from 'drizzle-orm';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg+xml',
};
const MAX_SIZE = 2 * 1024 * 1024; // 2MB (base64 inflates ~33%)

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('logo');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No logo file provided' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File exceeds 2MB limit' }, { status: 400 });
  }

  const mimeType = file.type;
  if (!ALLOWED_TYPES[mimeType]) {
    return NextResponse.json({ error: 'Invalid file type. Allowed: jpg, png, webp, svg' }, { status: 400 });
  }

  // Convert to base64 data URL
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64}`;

  // Upsert into business_profiles
  await db
    .insert(businessProfiles)
    .values({
      userId: session.user.id,
      logoPath: dataUrl,
    })
    .onConflictDoUpdate({
      target: businessProfiles.userId,
      set: { logoPath: dataUrl, updatedAt: new Date() },
    });

  return NextResponse.json({ success: true, logoPath: dataUrl });
}
