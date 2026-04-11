// T043: FBR provinces reference service — cached 24h
// FBR API (spec section 5.1) returns a flat array:
// [{ "stateProvinceCode": 7, "stateProvinceDesc": "PUNJAB" }, ...]
import { fbrGet } from '../api-client';
import { getOrFetch } from './cache';

interface FBRProvince {
  stateProvinceCode: number;
  stateProvinceDesc: string;
}

export async function getFBRProvinces(userId?: string): Promise<string[]> {
  return getOrFetch(
    'fbr:provinces',
    'provinces',
    async () => {
      const raw = await fbrGet('/pdi/v1/provinces', userId);
      const data = raw as FBRProvince[];
      return data.map((p) => p.stateProvinceDesc).filter(Boolean);
    },
    24
  );
}
