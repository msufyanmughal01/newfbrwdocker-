import { FBREnv } from './api-client';
import { db } from '@/lib/db';
import { businessProfiles } from '@/lib/db/schema/business-profiles';
import { eq } from 'drizzle-orm';
import { decrypt } from '@/lib/settings/encryption';
import { getBusinessProfile } from '@/lib/settings/business-profile';

export class FBRContextError extends Error {
  constructor(message: string, public code: string, public status: number) {
    super(message);
    this.name = 'FBRContextError';
  }
}

type BusinessProfileRecord = NonNullable<Awaited<ReturnType<typeof getBusinessProfile>>>;

export interface FBRContext {
  userId: string;
  profile: BusinessProfileRecord;
  ntn: string;
  token: string;
  environment: FBREnv;
}

function normalizeEnv(env?: string): FBREnv {
  const normalized = env?.toLowerCase();
  return normalized === 'production' ? 'production' : 'sandbox';
}

function logContext(userId: string, ntn: string | null, tokenPresent: boolean) {
  console.log({ userId, ntn, tokenPresent });
}

function sanitizeSellerId(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D+/g, '');
  if (digits.length === 7 || digits.length === 13) {
    return digits;
  }
  return null;
}

function extractOwnerIdentifier(token: string): string | null {
  try {
    const parsed = JSON.parse(token);
    if (typeof parsed === 'object' && parsed !== null) {
      const candidate =
        (parsed.owner_ntn ?? parsed.ownerNtn ?? parsed.ownerNTN ?? parsed.owner_cnic ?? parsed.ownerCnic ?? null) as string | null;
      const normalized = sanitizeSellerId(candidate);
      if (normalized) {
        return normalized;
      }
    }
  } catch {
    // ignore non-JSON tokens
  }

  const match = token.match(/(?:owner_ntn|owner_cnic)=([0-9]+)/i);
  if (match) {
    return sanitizeSellerId(match[1]);
  }

  return null;
}

export async function validateFBRContext(userId: string): Promise<FBRContext> {
  const profile = await getBusinessProfile(userId);
  if (!profile) {
    throw new FBRContextError('Business profile not found', 'FBR_PROFILE_MISSING', 404);
  }

  // Candidates for seller identifier (NTN or CNIC)
  const ntnCandidate = profile.ntnCnic?.trim() ?? null;
  const cnicCandidate = profile.cnic?.trim() ?? null;

  if (!ntnCandidate && !cnicCandidate) {
    throw new FBRContextError('Your NTN or CNIC is required to call FBR APIs', 'FBR_NTN_MISSING', 400);
  }

  const rows = await db
    .select({
      fbrTokenEncrypted: businessProfiles.fbrTokenEncrypted,
      fbrTokenExpiresAt: businessProfiles.fbrTokenExpiresAt,
      fbrEnvironment: businessProfiles.fbrEnvironment,
    })
    .from(businessProfiles)
    .where(eq(businessProfiles.userId, userId))
    .limit(1);

  const record = rows[0];

  if (!record?.fbrTokenEncrypted) {
    logContext(userId, ntnCandidate || cnicCandidate, false);
    throw new FBRContextError('No FBR token configured for your account', 'FBR_TOKEN_MISSING', 400);
  }

  if (record.fbrTokenExpiresAt && record.fbrTokenExpiresAt < new Date()) {
    logContext(userId, ntnCandidate || cnicCandidate, false);
    throw new FBRContextError('Your FBR token has expired', 'FBR_TOKEN_EXPIRED', 400);
  }

  let token: string;
  try {
    token = decrypt(record.fbrTokenEncrypted).trim();
  } catch {
    logContext(userId, ntnCandidate || cnicCandidate, false);
    throw new FBRContextError(
      'Your saved FBR token could not be decrypted. Please re-save it in Settings → FBR Integration.',
      'FBR_TOKEN_DECRYPT_FAILED',
      400
    );
  }

  if (!token) {
    logContext(userId, ntnCandidate || cnicCandidate, false);
    throw new FBRContextError(
      'Your saved FBR token could not be decrypted. Please re-save it in Settings → FBR Integration.',
      'FBR_TOKEN_DECRYPT_FAILED',
      400
    );
  }

  // Determine which identifier to use as sellerNTNCNIC
  const tokenOwner = extractOwnerIdentifier(token);
  let finalId: string | null = null;

  if (tokenOwner) {
    // If token contains an owner ID, it MUST match one of ours
    if (tokenOwner === ntnCandidate) {
      finalId = ntnCandidate;
    } else if (tokenOwner === cnicCandidate) {
      finalId = cnicCandidate;
    } else {
      logContext(userId, tokenOwner, false);
      throw new FBRContextError(
        `FBR token belongs to ${tokenOwner}, which does not match your NTN (${ntnCandidate}) or CNIC (${cnicCandidate})`,
        'FBR_TOKEN_OWNER_MISMATCH',
        403
      );
    }
  } else {
    // If no owner in token, default to CNIC then NTN (per user request for CNIC preference)
    finalId = cnicCandidate || ntnCandidate;
  }

  if (!finalId) {
    // Should be unreachable given the check at top
    throw new FBRContextError('Could not determine seller identifier', 'FBR_ID_NOT_DETERMINED', 400);
  }

  logContext(userId, finalId, true);

  return {
    userId,
    profile,
    ntn: finalId,
    token,
    environment: normalizeEnv(record.fbrEnvironment ?? profile.fbrEnvironment),
  };
}
