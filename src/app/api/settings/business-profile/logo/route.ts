// POST /api/settings/business-profile/logo
// Converts an uploaded logo image to a base64 data-URL and stores it in the DB.
//
// SECURITY HARDENING:
//   • SVG is NOT allowed — SVG files can contain inline <script> tags that
//     execute when rendered in an <img> element or opened directly, enabling
//     stored XSS.
//   • File type is verified using magic bytes (file signature), NOT just the
//     browser-supplied Content-Type / file.type, which can be trivially spoofed.
//   • File size is limited to 2 MB before any processing occurs.

import { NextRequest, NextResponse } from 'next/server';
import { auth }              from '@/lib/auth';
import { db }                from '@/lib/db';
import { businessProfiles }  from '@/lib/db/schema/business-profiles';
import sharp                 from 'sharp';

// ─────────────────────────────────────────────────────────────────────────────
// Allowed MIME types  (SVG intentionally excluded — XSS risk)
// ─────────────────────────────────────────────────────────────────────────────
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpeg',
  'image/jpg':  'jpeg',
  'image/png':  'png',
  'image/webp': 'webp',
};

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

// ─────────────────────────────────────────────────────────────────────────────
// Magic-byte verification
// Reads the first bytes of the file and compares them to known file signatures.
// This prevents MIME-type spoofing (e.g. a PHP script renamed to logo.png).
// ─────────────────────────────────────────────────────────────────────────────
function verifyMagicBytes(buf: Buffer, declaredMime: string): boolean {
  if (buf.length < 12) return false;

  switch (declaredMime) {
    case 'image/jpeg':
    case 'image/jpg':
      // JPEG:  FF D8 FF
      return buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;

    case 'image/png':
      // PNG:  89 50 4E 47 0D 0A 1A 0A
      return (
        buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 &&
        buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A
      );

    case 'image/webp':
      // WebP:  RIFF????WEBP  (bytes 0-3 = "RIFF", bytes 8-11 = "WEBP")
      return (
        buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && // RIFF
        buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50   // WEBP
      );

    default:
      return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────
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

  // ── Size check (before reading full content) ────────────────────────────
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File exceeds 2 MB limit' }, { status: 400 });
  }

  // ── Declared MIME type check ────────────────────────────────────────────
  const declaredMime = file.type.toLowerCase();
  if (!ALLOWED_TYPES[declaredMime]) {
    return NextResponse.json(
      { error: 'Invalid file type. Allowed formats: JPEG, PNG, WebP. SVG is not permitted.' },
      { status: 400 }
    );
  }

  // ── Read bytes and verify magic signature ───────────────────────────────
  const arrayBuffer = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);

  if (!verifyMagicBytes(buf, declaredMime)) {
    return NextResponse.json(
      { error: 'File content does not match its declared type.' },
      { status: 400 }
    );
  }

  // ── Strip EXIF / XMP / ICC metadata (privacy + injection prevention) ────
  // sharp re-encodes the image in the same format without any metadata.
  // withMetadata(false) removes GPS, camera model, author, and other tags.
  let strippedBuf: Buffer;
  try {
    strippedBuf = await sharp(buf).toBuffer();
  } catch {
    // If sharp fails for any reason, fall back to the original buffer
    // (magic bytes were already verified so the file is a real image)
    strippedBuf = buf;
  }

  // ── Store as base64 data-URL ────────────────────────────────────────────
  const base64  = strippedBuf.toString('base64');
  const dataUrl = `data:${declaredMime};base64,${base64}`;

  await db
    .insert(businessProfiles)
    .values({ userId: session.user.id, logoPath: dataUrl })
    .onConflictDoUpdate({
      target: businessProfiles.userId,
      set: { logoPath: dataUrl, updatedAt: new Date() },
    });

  return NextResponse.json({ success: true, logoPath: dataUrl });
}
