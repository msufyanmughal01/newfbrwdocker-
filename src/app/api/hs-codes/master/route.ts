// GET /api/hs-codes/master — list user's pinned HS codes
// POST /api/hs-codes/master — pin a new HS code

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { listUserHSCodes, pinHSCode, hsCodeExists } from '@/lib/hs-codes/master-service';

const pinSchema = z.object({
  hsCode: z.string().min(1).max(20),
  description: z.string().min(1).max(500),
  uom: z.string().max(100).optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const codes = await listUserHSCodes(session.user.id);
  return NextResponse.json({ codes });
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

  const parsed = pinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
  }

  const { hsCode, description, uom } = parsed.data;

  const exists = await hsCodeExists(session.user.id, hsCode);
  if (exists) {
    return NextResponse.json(
      { error: 'HS code already pinned', code: 'DUPLICATE_HS_CODE' },
      { status: 409 }
    );
  }

  const record = await pinHSCode(session.user.id, hsCode, description, uom);
  return NextResponse.json({ code: record }, { status: 201 });
}
