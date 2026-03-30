// T043: FBR provinces reference service — cached 24h
import { fbrGet } from '../api-client';
import { getOrFetch } from './cache';

interface FBRProvince {
  provinceId: string;
  provinceName: string;
}

export async function getFBRProvinces(userId?: string): Promise<string[]> {
  return getOrFetch(
    'fbr:provinces',
    'provinces',
    async () => {
      const raw = await fbrGet('/pdi/v1/provinces', userId);
      const data = raw as { data?: FBRProvince[] };
      return (data.data ?? []).map((p) => p.provinceName).filter(Boolean);
    },
    24
  );
}
