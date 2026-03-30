// GET /api/fbr/reference/tax-rates — returns FBR tax rate options (cached 24h)

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getFBRTaxRates } from '@/lib/fbr/reference/tax-rates';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const date = request.nextUrl.searchParams.get('date') ?? undefined;

  try {
    const rates = await getFBRTaxRates(date, session.user.id);
    return NextResponse.json({ rates });
  } catch (err) {
    const code = (err as Error & { code?: string }).code;
    if (code === 'FBR_TOKEN_MISSING') {
      return NextResponse.json({ rates: [], tokenMissing: true });
    }
    console.error('Tax rates fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch tax rates', details: (err as Error).message },
      { status: 500 }
    );
  }
}
