// GET /api/fbr/reference/hs-uom?hs_code={code}
// Returns approved UOM(s) for a given HS code

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllUOMsForHSCode } from '@/lib/fbr/reference/hs-uom';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const hsCode = request.nextUrl.searchParams.get('hs_code') ?? '';

  if (!hsCode) {
    return NextResponse.json({ error: 'hs_code parameter is required' }, { status: 400 });
  }

  try {
    const results = await getAllUOMsForHSCode(hsCode);
    if (results.length === 0) {
      return NextResponse.json({ error: 'No UOM found for HS code' }, { status: 404 });
    }
    return NextResponse.json(results);
  } catch (err) {
    console.error('HS UOM lookup error:', err);
    return NextResponse.json(
      { error: 'Failed to get UOM for HS code', details: (err as Error).message },
      { status: 500 }
    );
  }
}
