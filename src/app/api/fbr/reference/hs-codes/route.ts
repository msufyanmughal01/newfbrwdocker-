// GET /api/fbr/reference/hs-codes?q={query}
// Searches HS codes (minimum 3 chars). Returns cached data.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { searchHSCodes } from '@/lib/fbr/reference/hs-codes';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get('q') ?? '';

  if (q.length < 3) {
    return NextResponse.json(
      { error: 'Query must be at least 3 characters' },
      { status: 400 }
    );
  }

  try {
    const { results, cached } = await searchHSCodes(q, session.user.id);
    return NextResponse.json({ results, total: results.length, cached });
  } catch (err) {
    console.error('HS code search error:', err);
    return NextResponse.json(
      { error: 'Failed to search HS codes', details: (err as Error).message },
      { status: 500 }
    );
  }
}
