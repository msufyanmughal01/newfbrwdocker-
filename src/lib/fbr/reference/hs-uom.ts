// HS Code → UOM Lookup Service
// Returns approved UOM(s) for a given HS code via FBR HS_UOM API

import { fbrGetHSUOM } from '../api-client';
import { getOrFetch } from './cache';

interface HSUOMEntry {
  uoM_ID: number;
  description: string;
}

/** Returns the first approved UOM description for a given HS code. */
export async function getUOMForHSCode(hsCode: string): Promise<string | null> {
  const cacheKey = `hs_uom:${hsCode}`;

  const results = await getOrFetch<HSUOMEntry[]>(
    cacheKey,
    'hs_uom',
    async () => {
      const data = await fbrGetHSUOM(hsCode);
      return (data as HSUOMEntry[]) ?? [];
    },
    24
  );

  if (!results || results.length === 0) return null;
  return results[0].description;
}

/** Returns all approved UOM entries for a given HS code. */
export async function getAllUOMsForHSCode(hsCode: string): Promise<HSUOMEntry[]> {
  const cacheKey = `hs_uom:${hsCode}`;

  const results = await getOrFetch<HSUOMEntry[]>(
    cacheKey,
    'hs_uom',
    async () => {
      const data = await fbrGetHSUOM(hsCode);
      return (data as HSUOMEntry[]) ?? [];
    },
    24
  );

  return results ?? [];
}
