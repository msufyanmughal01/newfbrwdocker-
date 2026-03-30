// GET /api/buyers?q={query}
// Searches buyer registry for autocomplete (min 2 chars, ordered by useCount)

import { NextRequest, NextResponse } from 'next/server';
import { ilike, eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { buyerRegistry } from '@/lib/db/schema/fbr';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get('q') ?? '';

  if (q.length < 2) {
    return NextResponse.json({ buyers: [] });
  }

  const userId = session.user.id;

  try {
    const buyers = await db
      .select()
      .from(buyerRegistry)
      .where(
        and(
          eq(buyerRegistry.userId, userId),
          ilike(buyerRegistry.businessName, `%${q}%`)
        )
      )
      .orderBy(desc(buyerRegistry.useCount))
      .limit(10);

    return NextResponse.json({ buyers });
  } catch (err) {
    console.error('Buyer search error:', err);
    return NextResponse.json(
      { error: 'Failed to search buyers', details: (err as Error).message },
      { status: 500 }
    );
  }
}
