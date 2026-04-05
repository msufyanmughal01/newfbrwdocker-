// Client Registry service
// CRUD operations for the clients table; scoped to userId; soft-delete only

import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema/clients';
import { eq, and, ilike } from 'drizzle-orm';
import { encryptData, decryptData } from '@/lib/crypto/symmetric';
import type { Client } from '@/lib/db/schema/clients';

/** Decrypt ntnCnic in a client row before returning to callers. */
function decryptClient(row: Client): Client {
  return {
    ...row,
    ntnCnic: row.ntnCnic ? decryptData(row.ntnCnic) : row.ntnCnic,
  };
}

export interface ClientInput {
  businessName: string;
  ntnCnic?: string;
  province?: string;
  address?: string;
  registrationType?: string;
  notes?: string;
}

/**
 * List active (non-deleted) clients for a user.
 * If q is provided (min 2 chars), filters by business_name ILIKE.
 */
export async function listClients(userId: string, q?: string) {
  const baseCondition = and(
    eq(clients.userId, userId),
    eq(clients.isDeleted, false)
  );

  if (q && q.length >= 2) {
    const qRows = await db
      .select()
      .from(clients)
      .where(and(baseCondition, ilike(clients.businessName, `%${q}%`)))
      .orderBy(clients.businessName)
      .limit(50);
    return qRows.map(decryptClient);
  }

  const rows = await db
    .select()
    .from(clients)
    .where(baseCondition)
    .orderBy(clients.businessName)
    .limit(200);

  return rows.map(decryptClient);
}

/**
 * Create a new client record for a user.
 */
export async function createClient(userId: string, data: ClientInput) {
  const rows = await db
    .insert(clients)
    .values({
      userId,
      businessName: data.businessName,
      ntnCnic: data.ntnCnic ? encryptData(data.ntnCnic) : null,
      province: data.province ?? null,
      address: data.address ?? null,
      registrationType: data.registrationType ?? null,
      notes: data.notes ?? null,
    })
    .returning();

  return decryptClient(rows[0]);
}

/**
 * Update an existing client. Returns the updated client, or null if not found/forbidden.
 */
export async function updateClient(
  userId: string,
  clientId: string,
  data: Partial<ClientInput>
) {
  const existing = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.isDeleted, false)))
    .limit(1);

  if (!existing[0]) return { error: 'not_found' as const };
  if (existing[0].userId !== userId) return { error: 'forbidden' as const };

  const updatePayload: Record<string, unknown> = { updatedAt: new Date() };
  if (data.businessName !== undefined) updatePayload.businessName = data.businessName;
  if (data.ntnCnic !== undefined) updatePayload.ntnCnic = data.ntnCnic ? encryptData(data.ntnCnic) : null;
  if (data.province !== undefined) updatePayload.province = data.province;
  if (data.address !== undefined) updatePayload.address = data.address;
  if (data.registrationType !== undefined) updatePayload.registrationType = data.registrationType;
  if (data.notes !== undefined) updatePayload.notes = data.notes;

  const rows = await db
    .update(clients)
    .set(updatePayload)
    .where(eq(clients.id, clientId))
    .returning();

  return { client: decryptClient(rows[0]) };
}

/**
 * Soft-delete a client (sets is_deleted = true).
 */
export async function softDeleteClient(userId: string, clientId: string) {
  const existing = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.isDeleted, false)))
    .limit(1);

  if (!existing[0]) return { error: 'not_found' as const };
  if (existing[0].userId !== userId) return { error: 'forbidden' as const };

  await db
    .update(clients)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(eq(clients.id, clientId));

  return { success: true };
}
