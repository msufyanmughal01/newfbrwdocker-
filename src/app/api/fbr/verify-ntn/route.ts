// POST /api/fbr/verify-ntn
// Verifies buyer NTN/CNIC via STATL API. Results cached per NTN for 24 hours.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { verifyNTN } from '@/lib/fbr/reference/statl';

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ntnCnic } = body as { ntnCnic: string };

    if (!ntnCnic || ntnCnic.trim().length < 7) {
      return NextResponse.json(
        { error: 'ntnCnic must be at least 7 characters' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const result = await verifyNTN(ntnCnic.trim(), userId);

    return NextResponse.json({
      ntnCnic: result.ntnCnic,
      statlStatus: result.statlStatus,
      registrationType: result.registrationType,
      cached: result.cached,
      checkedAt: result.checkedAt.toISOString(),
      ...(result.warning ? { warning: result.warning } : {}),
    });
  } catch (err) {
    console.error('NTN verify error:', err);
    return NextResponse.json(
      {
        statlStatus: 'unknown',
        warning: 'Could not verify NTN — STATL API unavailable. Proceed manually.',
      },
      { status: 504 }
    );
  }
}
