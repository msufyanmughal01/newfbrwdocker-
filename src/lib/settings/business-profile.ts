// Business Profile DB service
// Provides read/write helpers for the business_profiles table

import { db } from '@/lib/db';
import { businessProfiles } from '@/lib/db/schema/business-profiles';
import { eq } from 'drizzle-orm';
import { encrypt } from './encryption';
import { encryptData, decryptData } from '@/lib/crypto/symmetric';
import type { BusinessProfile } from '@/lib/db/schema/business-profiles';

/** Decrypt sensitive fields before returning a profile to callers. */
function decryptProfile(profile: BusinessProfile): Omit<BusinessProfile, 'fbrTokenEncrypted'> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { fbrTokenEncrypted: _omit, ...rest } = profile;
  return {
    ...rest,
    ntnCnic: rest.ntnCnic ? decryptData(rest.ntnCnic) : rest.ntnCnic,
    cnic: rest.cnic ? decryptData(rest.cnic) : rest.cnic,
  };
}

export interface BusinessProfileInput {
  businessName?: string;
  ntnCnic?: string;
  province?: string;
  address?: string;
  logoPath?: string;
  fbrToken?: string; // plain text — encrypted before storage
}

/**
 * Retrieve a user's business profile. Returns null if none exists.
 */
export async function getBusinessProfile(userId: string) {
  const rows = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.userId, userId))
    .limit(1);

  const profile = rows[0] ?? null;

  if (!profile) return null;

  return decryptProfile(profile);
}

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
  if (data.ntnCnic !== undefined) updatePayload.ntnCnic = data.ntnCnic ? encryptData(data.ntnCnic) : null;
  if (data.province !== undefined) updatePayload.province = data.province;
  if (data.address !== undefined) updatePayload.address = data.address;
  if (data.logoPath !== undefined) updatePayload.logoPath = data.logoPath;

  if (data.fbrToken) {
    updatePayload.fbrTokenEncrypted = encrypt(data.fbrToken);
    updatePayload.fbrTokenHint = '••••' + data.fbrToken.slice(-4);
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
