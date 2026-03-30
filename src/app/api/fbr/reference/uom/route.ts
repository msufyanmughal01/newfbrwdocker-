// GET /api/fbr/reference/uom — returns all FBR UOM entries (cached 24h)

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllUOMs } from '@/lib/fbr/reference/uom';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const uoms = await getAllUOMs(session.user.id);
    return NextResponse.json({ uoms });
  } catch (err) {
    const code = (err as Error & { code?: string }).code;
    if (code === 'FBR_TOKEN_MISSING') {
      return NextResponse.json({ uoms: [], tokenMissing: true });
    }
    console.error('UOM fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch UOMs', details: (err as Error).message },
      { status: 500 }
    );
  }
}
