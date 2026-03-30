// HS Code Master Service — CRUD for user-pinned HS codes
// All operations are scoped by userId (Constitution Principle: no cross-user access)

import { db } from '@/lib/db';
import { hsCodes } from '@/lib/db/schema/hs-code-master';
import { eq, and } from 'drizzle-orm';

export interface HSCodeEntry {
  id: string;
  userId: string;
  hsCode: string;
  description: string;
  uom: string | null;
  isActive: boolean;
  sortOrder: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Returns all active HS codes for a user, ordered by sort_order then created_at.
 */
export async function listUserHSCodes(userId: string): Promise<HSCodeEntry[]> {
  return db
    .select()
    .from(hsCodes)
    .where(and(eq(hsCodes.userId, userId), eq(hsCodes.isActive, true)))
    .orderBy(hsCodes.sortOrder, hsCodes.createdAt);
}

/**
 * Pins an HS code to the user's master list.
 * Returns the newly created record.
 */
export async function pinHSCode(
  userId: string,
  code: string,
  description: string,
  uom?: string
): Promise<HSCodeEntry> {
  const [record] = await db
    .insert(hsCodes)
    .values({
      userId,
      hsCode: code,
      description,
      uom: uom ?? null,
    })
    .returning();
  return record;
}

/**
 * Soft-deletes (deactivates) an HS code by id, scoped by userId.
 * Returns true if the record was found and updated, false otherwise.
 */
export async function unpinHSCode(userId: string, id: string): Promise<boolean> {
  const updated = await db
    .update(hsCodes)
    .set({ isActive: false, updatedAt: new Date() })
    .where(and(eq(hsCodes.id, id), eq(hsCodes.userId, userId), eq(hsCodes.isActive, true)))
    .returning({ id: hsCodes.id });
  return updated.length > 0;
}

/**
 * Returns true if the user already has this HS code pinned (active).
 */
export async function hsCodeExists(userId: string, code: string): Promise<boolean> {
  const rows = await db
    .select({ id: hsCodes.id })
    .from(hsCodes)
    .where(and(eq(hsCodes.userId, userId), eq(hsCodes.hsCode, code), eq(hsCodes.isActive, true)))
    .limit(1);
  return rows.length > 0;
}
