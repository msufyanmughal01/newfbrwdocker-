// GET /api/settings/business-profile — returns authenticated user's business profile
// PUT /api/settings/business-profile — partial update of business profile

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getBusinessProfile, upsertBusinessProfile } from '@/lib/settings/business-profile';
import { z } from 'zod';
import { withDecryption } from '@/lib/crypto/with-decryption';

const FBR_PROVINCES = [
  'Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan',
  'Islamabad Capital Territory', 'Gilgit-Baltistan', 'Azad Jammu and Kashmir',
];

const paymentDetailsSchema = z.object({
  bankName: z.string().max(255).optional(),
  iban: z.string().max(50).optional(),
  accountTitle: z.string().max(255).optional(),
  branch: z.string().max(255).optional(),
}).nullable().optional();

const businessCredentialSchema = z.object({
  type: z.string().max(100),
  value: z.string().max(500),
  includeInInvoice: z.boolean(),
});

const updateSchema = z.object({
  businessName: z.string().min(1).max(255).optional(),
  businessEmail: z.string().email().max(255).optional().or(z.literal('')),
  ntnCnic: z
    .string()
    .regex(/^\d{7}$/, 'NTN must be exactly 7 digits')
    .optional()
    .or(z.literal('')),
  cnic: z
    .string()
    .regex(/^\d{13}$/, 'CNIC must be exactly 13 digits')
    .optional()
    .or(z.literal('')),
  phone: z.string().max(20).optional(),
  province: z.enum(FBR_PROVINCES as [string, ...string[]]).optional().or(z.literal('')),
  address: z.string().max(1000).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  fbrToken: z.string().min(1).optional(),
  fbrEnvironment: z.enum(['sandbox', 'production']).optional(),
  fbrPosid: z.string().max(50).optional().nullable(),
  invoiceNote: z.string().max(2000).optional().nullable(),
  invoiceNoteMode: z.enum(['always', 'never', 'ask']).optional(),
  paymentDetails: paymentDetailsSchema,
  paymentDetailsMode: z.enum(['always', 'never', 'ask']).optional(),
  businessCredentials: z.array(businessCredentialSchema).nullable().optional(),
  invoiceAddressType: z.enum(['business', 'fbr']).optional(),
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

  try {
    const profile = await upsertBusinessProfile(session.user.id, parsed.data);
    return NextResponse.json({ success: true, profile });
  } catch (err) {
    console.error('Failed to update business profile:', err);
    const message = err instanceof Error ? err.message : 'Failed to save profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
