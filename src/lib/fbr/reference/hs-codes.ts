// HS Code Reference Service
// Fetches and caches FBR HS code list, supports substring search

import { fbrGetHSCodes } from '../api-client';
import { getOrFetch } from './cache';

interface HSCodeEntry {
  hS_CODE: string;
  description: string;
}

/** Search HS codes by query string (code prefix or description substring). */
export async function searchHSCodes(query: string, userId?: string): Promise<{ results: HSCodeEntry[]; cached: boolean }> {
  let wasCached = true;
  const cacheKey = `hs_codes:${userId ?? 'default'}`;

  const all = await getOrFetch<HSCodeEntry[]>(
    cacheKey,
    'hs_codes',
    async () => {
      wasCached = false;
      return fbrGetHSCodes(userId) as Promise<HSCodeEntry[]>;
    },
    24 // 24-hour TTL
  );

  const q = query.toLowerCase();
  const results = all
    .filter(
      (entry) =>
        entry.hS_CODE.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q)
    )
    .slice(0, 20);

  return { results, cached: wasCached };
}
