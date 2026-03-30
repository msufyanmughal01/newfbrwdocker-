// GET    /api/drafts/[id] — fetch a single form draft
// PATCH  /api/drafts/[id] — update draft data
// DELETE /api/drafts/[id] — delete a draft

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { invoiceDrafts } from '@/lib/db/schema/invoices';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const [draft] = await db
    .select()
    .from(invoiceDrafts)
    .where(and(eq(invoiceDrafts.id, id), eq(invoiceDrafts.userId, session.user.id)))
    .limit(1);

  if (!draft) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
  }

  return NextResponse.json({ draft });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db
    .select({ id: invoiceDrafts.id })
    .from(invoiceDrafts)
    .where(and(eq(invoiceDrafts.id, id), eq(invoiceDrafts.userId, session.user.id)))
    .limit(1);

  if (!existing[0]) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  await db
    .update(invoiceDrafts)
    .set({ draftData: body, lastSaved: new Date() })
    .where(and(eq(invoiceDrafts.id, id), eq(invoiceDrafts.userId, session.user.id)));

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  await db
    .delete(invoiceDrafts)
    .where(and(eq(invoiceDrafts.id, id), eq(invoiceDrafts.userId, session.user.id)));

  return NextResponse.json({ success: true });
}
