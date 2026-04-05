// GET /api/settings/business-profile — returns authenticated user's business profile
// PUT /api/settings/business-profile — partial update of business profile

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getBusinessProfile, upsertBusinessProfile } from '@/lib/settings/business-profile';
import { z } from 'zod';
import { withDecryption } from '@/lib/crypto/with-decryption';

const FBR_PROVINCES = [
  'Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan',
  'Gilgit Baltistan', 'Azad Kashmir', 'Islamabad',
];

const updateSchema = z.object({
  businessName: z.string().min(1).max(255).optional(),
  ntnCnic: z
    .string()
    .regex(/^\d{7}$|^\d{13}$/, 'Must be 7 digits (NTN) or 13 digits (CNIC)')
    .optional()
    .or(z.literal('')),
  province: z.enum(FBR_PROVINCES as [string, ...string[]]).optional().or(z.literal('')),
  address: z.string().max(1000).optional(),
  fbrToken: z.string().min(1).optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profile = await getBusinessProfile(session.user.id);

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

export const PUT = withDecryption(async (request: NextRequest, body: unknown) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const profile = await upsertBusinessProfile(session.user.id, parsed.data);
  return NextResponse.json({ success: true, profile });
});
