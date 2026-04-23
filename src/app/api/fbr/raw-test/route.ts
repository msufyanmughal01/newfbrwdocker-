// POST /api/fbr/raw-test
// Sends a raw payload directly to FBR validateinvoicedata_sb using the
// authenticated user's saved token. Bypasses Zod/mapping so we can
// diagnose exactly what FBR returns for a given sellerNTNCNIC value.
// ⚠️  DEV/DEBUG only — remove before production deploy.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { businessProfiles } from '@/lib/db/schema/business-profiles';
import { eq } from 'drizzle-orm';
import { decrypt } from '@/lib/settings/encryption';

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Load the user's raw (encrypted) FBR token and environment
  const rows = await db
    .select({
      fbrTokenEncrypted: businessProfiles.fbrTokenEncrypted,
      fbrEnvironment: businessProfiles.fbrEnvironment,
    })
    .from(businessProfiles)
    .where(eq(businessProfiles.userId, userId))
    .limit(1);

  const row = rows[0];
  if (!row?.fbrTokenEncrypted) {
    return NextResponse.json({ error: 'No FBR token saved in your business profile' }, { status: 400 });
  }

  let token: string;
  try {
    token = decrypt(row.fbrTokenEncrypted).trim();
  } catch {
    return NextResponse.json({ error: 'Failed to decrypt FBR token — re-save it in Settings' }, { status: 500 });
  }

  const isSandbox = (row.fbrEnvironment ?? 'sandbox') !== 'production';
  const suffix = isSandbox ? '_sb' : '';
  const url = `https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata${suffix}`;

  // Accept a raw payload from the request body, or use the minimal test payload
  let payload: unknown;
  try {
    const body = await request.json();
    payload = body.payload ?? body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  let fbrStatus: number | null = null;
  let fbrBody: unknown = null;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    fbrStatus = res.status;
    try {
      fbrBody = await res.json();
    } catch {
      fbrBody = await res.text();
    }

    return NextResponse.json({
      url,
      environment: isSandbox ? 'sandbox' : 'production',
      sentPayload: payload,
      fbrHttpStatus: fbrStatus,
      fbrResponse: fbrBody,
    });
  } catch (err) {
    return NextResponse.json({
      error: 'Network error calling FBR',
      detail: err instanceof Error ? err.message : String(err),
      url,
      sentPayload: payload,
    }, { status: 502 });
  }
}
