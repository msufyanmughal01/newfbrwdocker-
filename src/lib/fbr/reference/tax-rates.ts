// T049: FBR tax rates reference service (SaleTypeToRate) — cached 24h
// FBR API (spec section 5.8) returns a flat array:
// [{ "ratE_ID": 734, "ratE_DESC": "18% along with rupees 60 per kilogram", "ratE_VALUE": 18 }, ...]
import { fbrGet } from '../api-client';
import { getOrFetch } from './cache';

interface FBRSaleTypeRate {
  ratE_ID: number;
  ratE_DESC: string;
  ratE_VALUE: number;
}

export interface TaxRateOption {
  id: string;
  label: string;
}

export async function getFBRTaxRates(
  date?: string,
  userId?: string,
  transTypeId?: number,
  provinceCode?: number
): Promise<TaxRateOption[]> {
  const cacheDate = date ?? new Date().toISOString().split('T')[0];
  const cacheKey = `fbr:tax-rates:${cacheDate}:${transTypeId ?? ''}:${provinceCode ?? ''}:${userId ?? 'default'}`;

  return getOrFetch(
    cacheKey,
    'tax_rates',
    async () => {
      const params = new URLSearchParams({ date: cacheDate });
      if (transTypeId !== undefined) params.set('transTypeId', String(transTypeId));
      if (provinceCode !== undefined) params.set('originationSupplier', String(provinceCode));
      const raw = await fbrGet(`/pdi/v2/SaleTypeToRate?${params.toString()}`, userId);
      const rates = (raw as FBRSaleTypeRate[]).map((r) => ({
        id: String(r.ratE_ID),
        label: r.ratE_DESC,
      }));
      if (rates.length === 0) {
        console.warn('[FBR] SaleTypeToRate returned empty array — falling back to default rates');
        return getDefaultRates();
      }
      return rates;
    },
    24
  );
}

function getDefaultRates(): TaxRateOption[] {
  return [
    { id: '18', label: '18%' },
    { id: '0', label: '0%' },
    { id: '5', label: '5%' },
    { id: '8', label: '8%' },
    { id: '10', label: '10%' },
    { id: '13', label: '13%' },
    { id: '16', label: '16%' },
    { id: '25', label: '25%' },
    { id: 'exempt', label: 'Exempt' },
  ];
}
