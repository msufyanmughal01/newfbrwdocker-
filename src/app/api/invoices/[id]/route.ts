// PATCH /api/invoices/[id] — update a draft invoice or mark as final
// DELETE /api/invoices/[id] — hard-delete a draft invoice

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { invoices } from '@/lib/db/schema/invoices';
import { eq, and } from 'drizzle-orm';
import { logAuditEvent, getRequestIp } from '@/lib/security/audit';

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
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.userId, session.user.id)))
    .limit(1);

  if (!existing[0]) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  // Immutability guard — issued/submitting invoices cannot be modified
  if (['issued', 'submitting'].includes(existing[0].status)) {
    return NextResponse.json(
      {
        error: 'Invoice is immutable',
        code: 'INVOICE_IMMUTABLE',
        status: existing[0].status,
      },
      { status: 409 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { status } = body;

  // Only allow draft → validated transition (not reverse)
  if (status === 'draft' && existing[0].status === 'validated') {
    return NextResponse.json(
      { error: 'Cannot downgrade validated invoice to draft' },
      { status: 409 }
    );
  }

  await db
    .update(invoices)
    .set({
      ...(status ? { status: status as 'draft' | 'validated' } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(invoices.id, id), eq(invoices.userId, session.user.id)));

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

  // Fetch the invoice to verify ownership and status
  const existing = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.userId, session.user.id)))
    .limit(1);

  if (!existing[0]) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  if (existing[0].status !== 'draft') {
    return NextResponse.json(
      { error: 'Only draft invoices can be deleted' },
      { status: 409 }
    );
  }

  await db
    .delete(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.userId, session.user.id)));

  logAuditEvent({
    action:    'invoice_deleted',
    userId:    session.user.id,
    ipAddress: getRequestIp(request),
    userAgent: request.headers.get('user-agent') ?? undefined,
    metadata:  { invoiceId: id },
  });

  return NextResponse.json({ success: true });
}
