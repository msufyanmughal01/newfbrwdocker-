// T044: FBR UOM reference service — cached 24h
// FBR API (spec section 5.6) returns a flat array:
// [{ "uoM_ID": 77, "description": "Square Metre" }, ...]
import { fbrGet } from '../api-client';
import { getOrFetch } from './cache';

interface FBRUomEntry {
  uoM_ID: number;
  description: string;
}

export async function getAllUOMs(userId?: string): Promise<string[]> {
  return getOrFetch(
    'fbr:uom:all',
    'uom',
    async () => {
      const raw = await fbrGet('/pdi/v1/uom', userId);
      const data = raw as FBRUomEntry[];
      return data.map((u) => u.description).filter(Boolean);
    },
    24
  );
}
