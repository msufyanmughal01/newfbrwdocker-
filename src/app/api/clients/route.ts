// GET /api/clients?q= — list clients (with optional search)
// POST /api/clients   — create a new client

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listClients, createClient } from '@/lib/clients/client-service';
import { z } from 'zod';
import { withDecryption } from '@/lib/crypto/with-decryption';
import { logAuditEvent, getRequestIp } from '@/lib/security/audit';

const createSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(255),
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

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get('q') ?? undefined;

  // Enforce minimum 2 chars for search
  if (q !== undefined && q.length < 2) {
    return NextResponse.json({ clients: [] });
  }

  const result = await listClients(session.user.id, q);
  return NextResponse.json({ clients: result });
}

export const POST = withDecryption(async (request: NextRequest, body: unknown) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const client = await createClient(session.user.id, parsed.data);

  logAuditEvent({
    action:    'client_created',
    userId:    session.user.id,
    ipAddress: getRequestIp(request),
    userAgent: request.headers.get('user-agent') ?? undefined,
    metadata:  { clientId: client.id },
  });

  return NextResponse.json({ success: true, client }, { status: 201 });
});
