// GET /api/drafts  — list user's saved form drafts
// POST /api/drafts — create a new form draft (partial invoice data)

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { invoiceDrafts } from '@/lib/db/schema/invoices';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const drafts = await db
    .select({
      id: invoiceDrafts.id,
      draftData: invoiceDrafts.draftData,
      lastSaved: invoiceDrafts.lastSaved,
      createdAt: invoiceDrafts.createdAt,
    })
    .from(invoiceDrafts)
    .where(eq(invoiceDrafts.userId, session.user.id))
    .orderBy(desc(invoiceDrafts.lastSaved))
    .limit(50);

  return NextResponse.json({ drafts });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const [draft] = await db
    .insert(invoiceDrafts)
    .values({
      userId: session.user.id,
      draftData: body,
      lastSaved: new Date(),
    })
    .returning({ id: invoiceDrafts.id });

  return NextResponse.json({ draftId: draft.id }, { status: 201 });
}
