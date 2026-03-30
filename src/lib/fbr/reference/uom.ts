// T044: FBR UOM reference service — cached 24h
import { fbrGet } from '../api-client';
import { getOrFetch } from './cache';

interface FBRUomEntry {
  uomId: string;
  uomDescription: string;
}

export async function getAllUOMs(userId?: string): Promise<string[]> {
  return getOrFetch(
    'fbr:uom:all',
    'uom',
    async () => {
      const raw = await fbrGet('/pdi/v1/uom', userId);
      const data = raw as { data?: FBRUomEntry[] };
      return (data.data ?? []).map((u) => u.uomDescription).filter(Boolean);
    },
    24
  );
}
