// GET /api/drafts  — list user's saved form drafts
// POST /api/drafts — create a new form draft (partial invoice data)
//
// draftData contains NTN/CNIC and other sensitive invoice fields.
// It is encrypted at rest using AES-256-GCM and decrypted on read.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { invoiceDrafts } from '@/lib/db/schema/invoices';
import { eq, desc } from 'drizzle-orm';
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
      return stored; // legacy unencrypted row — pass through
    }
  }
  return stored; // legacy unencrypted row — pass through
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await db
    .select({
      id:        invoiceDrafts.id,
      draftData: invoiceDrafts.draftData,
      lastSaved: invoiceDrafts.lastSaved,
      createdAt: invoiceDrafts.createdAt,
    })
    .from(invoiceDrafts)
    .where(eq(invoiceDrafts.userId, session.user.id))
    .orderBy(desc(invoiceDrafts.lastSaved))
    .limit(50);

  const drafts = rows.map((r) => ({ ...r, draftData: decryptDraft(r.draftData) }));
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
      userId:    session.user.id,
      draftData: encryptDraft(body),
      lastSaved: new Date(),
    })
    .returning({ id: invoiceDrafts.id });

  logAuditEvent({
    action:    'draft_created',
    userId:    session.user.id,
    ipAddress: getRequestIp(request),
    userAgent: request.headers.get('user-agent') ?? undefined,
    metadata:  { draftId: draft.id },
  });

  return NextResponse.json({ draftId: draft.id }, { status: 201 });
}
