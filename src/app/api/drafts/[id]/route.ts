// GET    /api/drafts/[id] — fetch a single form draft
// PATCH  /api/drafts/[id] — update draft data
// DELETE /api/drafts/[id] — delete a draft

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { invoiceDrafts } from '@/lib/db/schema/invoices';
import { eq, and } from 'drizzle-orm';
import { encryptData, decryptData } from '@/lib/crypto/symmetric';
import { logAuditEvent, getRequestIp } from '@/lib/security/audit';

function encryptDraft(data: unknown): Record<string, unknown> {
  return { _enc: encryptData(JSON.stringify(data)) };
}

function decryptDraft(stored: unknown): unknown {
  if (
    stored &&
    typeof stored === 'object' &&
    '_enc' in (stored as Record<string, unknown>) &&
    typeof (stored as Record<string, unknown>)._enc === 'string'
  ) {
    try {
      return JSON.parse(decryptData((stored as Record<string, string>)._enc));
    } catch {
      return stored;
    }
  }
  return stored; // legacy unencrypted row — pass through
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const [row] = await db
    .select()
    .from(invoiceDrafts)
    .where(and(eq(invoiceDrafts.id, id), eq(invoiceDrafts.userId, session.user.id)))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
  }

  return NextResponse.json({ draft: { ...row, draftData: decryptDraft(row.draftData) } });
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
    .set({ draftData: encryptDraft(body), lastSaved: new Date() })
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

  logAuditEvent({
    action:    'draft_deleted',
    userId:    session.user.id,
    ipAddress: getRequestIp(request),
    userAgent: request.headers.get('user-agent') ?? undefined,
    metadata:  { draftId: id },
  });

  return NextResponse.json({ success: true });
}
