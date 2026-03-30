// PUT /api/clients/[id]    — update a client (partial)
// DELETE /api/clients/[id] — soft-delete a client

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateClient, softDeleteClient } from '@/lib/clients/client-service';
import { z } from 'zod';

const updateSchema = z.object({
  businessName: z.string().min(1).max(255).optional(),
  ntnCnic: z
    .string()
    .regex(/^(\d{7}|\d{13}|)$/, 'Must be 7 or 13 digits')
    .optional()
    .or(z.literal('')),
  province: z.string().max(100).optional(),
  address: z.string().max(1000).optional(),
  registrationType: z.enum(['Registered', 'Unregistered']).optional(),
  notes: z.string().max(2000).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const result = await updateClient(session.user.id, id, parsed.data);
  if ('error' in result) {
    if (result.error === 'not_found') return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    if (result.error === 'forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ success: true, client: (result as { client: unknown }).client });
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

  const result = await softDeleteClient(session.user.id, id);
  if ('error' in result) {
    if (result.error === 'not_found') return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    if (result.error === 'forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}
