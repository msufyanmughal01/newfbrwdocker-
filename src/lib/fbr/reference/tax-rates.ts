// T049: FBR tax rates reference service (SaleTypeToRate) — cached 24h
import { fbrGet } from '../api-client';
import { getOrFetch } from './cache';

interface FBRSaleTypeRate {
  rate_id: string;
  rate_label: string;
  tax_rate: number | null;
}

export interface TaxRateOption {
  id: string;
  label: string;
}

export async function getFBRTaxRates(date?: string, userId?: string): Promise<TaxRateOption[]> {
  const cacheDate = date ?? new Date().toISOString().split('T')[0];
  const cacheKey = `fbr:tax-rates:${cacheDate}:${userId ?? 'default'}`;

  return getOrFetch(
    cacheKey,
    'tax_rates',
    async () => {
      const raw = await fbrGet(
        `/pdi/v2/SaleTypeToRate?date=${cacheDate}&transTypeId=&originationSupplier=`,
        userId
      );
      const data = raw as { data?: FBRSaleTypeRate[] };
      const rates = (data.data ?? []).map((r) => ({
        id: r.rate_id,
        label: r.rate_label,
      }));
      return rates.length > 0 ? rates : getDefaultRates();
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
