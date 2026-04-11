// STATL NTN Verification Service
// Verifies buyer NTN active status via FBR STATL and Get_Reg_Type APIs
// Results cached in buyer_registry for 24 hours

import { eq, and } from 'drizzle-orm';
import { db } from '../../db';
import { buyerRegistry } from '../../db/schema/fbr';
import { fbrSTATL, fbrGetRegType } from '../api-client';

export interface NTNVerificationResult {
  ntnCnic: string;
  statlStatus: 'active' | 'inactive' | 'unknown';
  registrationType: string | null;
  cached: boolean;
  checkedAt: Date;
  warning?: string;
}

const CNIC_LENGTH = 13;
const CACHE_TTL_HOURS = 24;

/** Returns true if the value looks like a CNIC (13 digits = unregistered individual) */
function isCNIC(ntnCnic: string): boolean {
  return ntnCnic.replace(/[-\s]/g, '').length === CNIC_LENGTH;
}

/**
 * Verify NTN via FBR STATL API.
 * - Skips STATL for CNIC values (13 digits = unregistered individual).
 * - Caches result in buyer_registry for 24 hours.
 * - Returns graceful degradation on timeout.
 */
export async function verifyNTN(
  ntnCnic: string,
  userId: string
): Promise<NTNVerificationResult> {
  const now = new Date();

  // 1. Check cache in buyer_registry
  const existing = await db
    .select()
    .from(buyerRegistry)
    .where(
      and(
        eq(buyerRegistry.userId, userId),
        eq(buyerRegistry.ntnCnic, ntnCnic)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const record = existing[0];
    if (record.statlCheckedAt) {
      const cacheAge = now.getTime() - record.statlCheckedAt.getTime();
      const cacheMaxAge = CACHE_TTL_HOURS * 60 * 60 * 1000;
      if (cacheAge < cacheMaxAge) {
        return {
          ntnCnic,
          statlStatus: record.statlStatus ?? 'unknown',
          registrationType: record.registrationType,
          cached: true,
          checkedAt: record.statlCheckedAt,
        };
      }
    }
  }

  // 2. Skip STATL for CNIC (unregistered individual)
  if (isCNIC(ntnCnic)) {
    return {
      ntnCnic,
      statlStatus: 'unknown',
      registrationType: 'Unregistered',
      cached: false,
      checkedAt: now,
      warning: 'CNIC detected — STATL verification is only available for NTN (7 digits). Registration type set to Unregistered.',
    };
  }

  // 3. Call FBR STATL API
  try {
    const dateStr = now.toISOString().split('T')[0];
    // FBR STATL API (spec section 5.11) returns:
    // { "status code": "01", "status": "In-Active" }
    const statlResponse = (await fbrSTATL(ntnCnic, dateStr)) as {
      status?: string;
      Active?: boolean;
      statlStatus?: string;
      'status code'?: string;
    };

    const rawStatus = statlResponse?.status ?? statlResponse?.statlStatus ?? '';
    const rawStatusCode = statlResponse?.['status code'] ?? '';

    let statlStatus: 'active' | 'inactive' | 'unknown' = 'unknown';
    if (
      statlResponse?.Active === true ||
      (rawStatus.toLowerCase() === 'active' && !rawStatus.toLowerCase().includes('in-'))
    ) {
      statlStatus = 'active';
    } else if (
      statlResponse?.Active === false ||
      rawStatus.toLowerCase().includes('in-active') ||
      rawStatusCode === '01' ||
      rawStatusCode === '02'
    ) {
      statlStatus = 'inactive';
    }

    // 4. Call Get_Reg_Type for registration classification
    let registrationType: string | null = null;
    try {
      // FBR Get_Reg_Type API (spec section 5.12) returns:
      // { "statuscode": "00", "REGISTRATION_NO": "0788762", "REGISTRATION_TYPE": "Registered" }
      const regTypeResponse = (await fbrGetRegType(ntnCnic)) as {
        REGISTRATION_TYPE?: string;
        Registration_Type?: string;
        registrationType?: string;
        type?: string;
        statuscode?: string;
      };
      registrationType =
        regTypeResponse?.REGISTRATION_TYPE ??
        regTypeResponse?.Registration_Type ??
        regTypeResponse?.registrationType ??
        regTypeResponse?.type ??
        null;
      // If statuscode is "01" and no registration type was returned, treat as Unregistered
      if (!registrationType && regTypeResponse?.statuscode === '01') {
        registrationType = 'Unregistered';
      }
    } catch {
      // Get_Reg_Type failed — continue without it
    }

    // 5. Upsert into buyer_registry
    const upsertValues = {
      userId,
      ntnCnic,
      businessName: ntnCnic, // placeholder — will be updated when buyer saves invoice
      statlStatus,
      statlCheckedAt: now,
      registrationType,
      lastUsedAt: now,
    };

    if (existing.length > 0) {
      await db
        .update(buyerRegistry)
        .set(upsertValues)
        .where(eq(buyerRegistry.id, existing[0].id));
    } else {
      await db.insert(buyerRegistry).values({ ...upsertValues, useCount: 1 }).onConflictDoUpdate({
        target: [buyerRegistry.userId, buyerRegistry.ntnCnic],
        set: upsertValues,
      });
    }

    const result: NTNVerificationResult = {
      ntnCnic,
      statlStatus,
      registrationType,
      cached: false,
      checkedAt: now,
    };

    if (statlStatus === 'inactive') {
      result.warning = 'This NTN is marked inactive in FBR records. Verify before submitting.';
    }

    return result;
  } catch (err) {
    const isTimeout =
      err instanceof Error &&
      (err.name === 'FBRApiError' || err.message.includes('timeout'));

    return {
      ntnCnic,
      statlStatus: 'unknown',
      registrationType: null,
      cached: false,
      checkedAt: now,
      warning: isTimeout
        ? 'Could not verify NTN — STATL API unavailable. Proceed manually.'
        : 'NTN verification failed. Please try again or proceed manually.',
    };
  }
}
