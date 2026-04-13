// Business Profile DB service
// Provides read/write helpers for the business_profiles table

import { cache } from 'react';
import { db } from '@/lib/db';
import { businessProfiles } from '@/lib/db/schema/business-profiles';
import { eq, sql } from 'drizzle-orm';
import { encrypt } from './encryption';
import { encryptData, decryptData } from '@/lib/crypto/symmetric';
import type { BusinessProfile } from '@/lib/db/schema/business-profiles';

/** Map legacy province names (saved before the rename) to canonical FBR values. */
const PROVINCE_ALIASES: Record<string, string> = {
  'Islamabad': 'Islamabad Capital Territory',
  'Gilgit Baltistan': 'Gilgit-Baltistan',
  'Azad Kashmir': 'Azad Jammu and Kashmir',
};

/** Decrypt sensitive fields before returning a profile to callers. */
function decryptProfile(profile: BusinessProfile): Omit<BusinessProfile, 'fbrTokenEncrypted'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { fbrTokenEncrypted: _omit, ...rest } = profile;
  const province = rest.province && PROVINCE_ALIASES[rest.province]
    ? PROVINCE_ALIASES[rest.province]
    : rest.province;
  return {
    ...rest,
    province,
    ntnCnic: rest.ntnCnic ? decryptData(rest.ntnCnic) : rest.ntnCnic,
    cnic: rest.cnic ? decryptData(rest.cnic) : rest.cnic,
  };
}

export interface PaymentDetails {
  bankName?: string;
  iban?: string;
  accountTitle?: string;
  branch?: string;
}

export interface BusinessCredential {
  type: string;
  value: string;
  includeInInvoice: boolean;
}

export interface BusinessProfileInput {
  businessName?: string;
  businessEmail?: string;
  ntnCnic?: string;
  cnic?: string;
  phone?: string;
  province?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  logoPath?: string;
  fbrToken?: string;           // plain text — encrypted before storage
  fbrEnvironment?: string;     // 'sandbox' | 'production'
  fbrPosid?: string | null;
  invoiceNote?: string | null;
  invoiceNoteMode?: string;    // 'always' | 'never' | 'ask'
  paymentDetails?: PaymentDetails | null;
  paymentDetailsMode?: string; // 'always' | 'never' | 'ask'
  businessCredentials?: BusinessCredential[] | null;
  invoiceAddressType?: string; // 'business' | 'fbr'
}

/**
 * Retrieve a user's business profile. Returns null if none exists.
 * Wrapped with React.cache() so multiple callers within the same server
 * render tree (layout + page) share one DB query per request.
 */
export const getBusinessProfile = cache(async (userId: string) => {
  const rows = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.userId, userId))
    .limit(1);

  const profile = rows[0] ?? null;

  if (!profile) return null;

  return decryptProfile(profile);
});

/**
 * Create or update a user's business profile (upsert by userId).
 * If fbrToken is provided in data, it is encrypted before storage.
 */
export async function upsertBusinessProfile(
  userId: string,
  data: BusinessProfileInput
) {
  const updatePayload: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.businessName !== undefined) updatePayload.businessName = data.businessName;
  if (data.businessEmail !== undefined) updatePayload.businessEmail = data.businessEmail;
  if (data.ntnCnic !== undefined) updatePayload.ntnCnic = data.ntnCnic ? encryptData(data.ntnCnic) : null;
  if (data.cnic !== undefined) updatePayload.cnic = data.cnic ? encryptData(data.cnic) : null;
  if (data.phone !== undefined) updatePayload.phone = data.phone;
  if (data.province !== undefined) updatePayload.province = data.province;
  if (data.address !== undefined) updatePayload.address = data.address;
  if (data.city !== undefined) updatePayload.city = data.city;
  if (data.postalCode !== undefined) updatePayload.postalCode = data.postalCode;
  if (data.logoPath !== undefined) updatePayload.logoPath = data.logoPath;
  if (data.fbrEnvironment !== undefined) updatePayload.fbrEnvironment = data.fbrEnvironment;
  if (data.fbrPosid !== undefined) updatePayload.fbrPosid = data.fbrPosid;
  if (data.invoiceNote !== undefined) updatePayload.invoiceNote = data.invoiceNote;
  if (data.invoiceNoteMode !== undefined) updatePayload.invoiceNoteMode = data.invoiceNoteMode;
  // For jsonb columns, use sql`null::jsonb` instead of JS null to avoid
  // pg driver serialising null as "" which breaks the jsonb type check.
  if (data.paymentDetails !== undefined) {
    updatePayload.paymentDetails = data.paymentDetails === null
      ? sql`null::jsonb`
      : data.paymentDetails;
  }
  if (data.paymentDetailsMode !== undefined) updatePayload.paymentDetailsMode = data.paymentDetailsMode;
  if (data.businessCredentials !== undefined) {
    updatePayload.businessCredentials = data.businessCredentials === null
      ? sql`null::jsonb`
      : data.businessCredentials;
  }
  if (data.invoiceAddressType !== undefined) updatePayload.invoiceAddressType = data.invoiceAddressType;

  if (data.fbrToken) {
    const token = data.fbrToken.trim();
    updatePayload.fbrTokenEncrypted = encrypt(token);
    updatePayload.fbrTokenHint = '••••' + token.slice(-4);
    updatePayload.fbrTokenUpdatedAt = new Date();
  }

  await db
    .insert(businessProfiles)
    .values({
      userId,
      ...updatePayload,
    })
    .onConflictDoUpdate({
      target: businessProfiles.userId,
      set: updatePayload,
    });

  return getBusinessProfile(userId);
}

/**
 * Update only the logo path after a successful file upload.
 */
export async function updateLogoPath(userId: string, logoPath: string) {
  await db
    .update(businessProfiles)
    .set({ logoPath, updatedAt: new Date() })
    .where(eq(businessProfiles.userId, userId));
}
