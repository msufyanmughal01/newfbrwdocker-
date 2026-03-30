// PostgreSQL Reference Data Cache
// TTL-based JSONB cache for FBR reference APIs (provinces, HS codes, UOM, etc.)
// Backed by fbr_reference_cache table — no Redis needed

import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { fbrReferenceCache } from '../../db/schema/fbr';
import type { FBRReferenceCache } from '../../db/schema/fbr';

type DataType = FBRReferenceCache['dataType'];

/**
 * Read from cache. Returns payload if not expired, null if missing or expired.
 */
export async function getCached(cacheKey: string): Promise<unknown | null> {
  const now = new Date();
  const rows = await db
    .select()
    .from(fbrReferenceCache)
    .where(eq(fbrReferenceCache.cacheKey, cacheKey))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  if (row.expiresAt <= now) return null; // expired

  return row.payload;
}

/**
 * Write to cache (upsert). ttlHours defaults to 24.
 */
export async function setCached(
  cacheKey: string,
  dataType: DataType,
  payload: unknown,
  ttlHours = 24
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

  await db
    .insert(fbrReferenceCache)
    .values({
      cacheKey,
      dataType,
      payload: payload as Record<string, unknown>,
      fetchedAt: now,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: fbrReferenceCache.cacheKey,
      set: {
        payload: payload as Record<string, unknown>,
        fetchedAt: now,
        expiresAt,
      },
    });
}

/**
 * Delete all cache entries for a given data type (manual refresh).
 */
export async function invalidateCache(dataType: DataType): Promise<void> {
  await db
    .delete(fbrReferenceCache)
    .where(eq(fbrReferenceCache.dataType, dataType));
}

/**
 * Read from cache or fetch fresh data.
 * @param cacheKey - unique cache key
 * @param dataType - enum value for grouping
 * @param fetcher - async function that returns fresh data from FBR
 * @param ttlHours - TTL in hours
 */
export async function getOrFetch<T>(
  cacheKey: string,
  dataType: DataType,
  fetcher: () => Promise<T>,
  ttlHours = 24
): Promise<T> {
  const cached = await getCached(cacheKey);
  if (cached !== null) return cached as T;

  const fresh = await fetcher();
  await setCached(cacheKey, dataType, fresh, ttlHours);
  return fresh;
}
