// GET /api/fbr/reference/provinces — returns FBR province list (cached 24h)

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getFBRProvinces } from '@/lib/fbr/reference/provinces';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const provinces = await getFBRProvinces(session.user.id);
    return NextResponse.json({ provinces });
  } catch (err) {
    const code = (err as Error & { code?: string }).code;
    if (code === 'FBR_TOKEN_MISSING') {
      return NextResponse.json({ provinces: [], tokenMissing: true });
    }
    console.error('Provinces fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch provinces', details: (err as Error).message },
      { status: 500 }
    );
  }
}
