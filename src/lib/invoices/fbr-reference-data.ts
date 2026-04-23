// FBR Reference Data
// Static reference data for provinces, tax rates, HS codes, UOMs, and sale types
// Phase 1: Static data | Phase 2: Will be replaced with dynamic API fetch + PostgreSQL cache

export const FBR_PROVINCES = [
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Gilgit-Baltistan',
  'Azad Jammu and Kashmir',
] as const;

export type FBRProvince = typeof FBR_PROVINCES[number];

export const FBR_TAX_RATES = [
  { id: '1',  label: '0%',  value: 0  },
  { id: '2',  label: '1%',  value: 1  },
  { id: '3',  label: '5%',  value: 5  },
  { id: '4',  label: '7%',  value: 7  },
  { id: '5',  label: '8%',  value: 8  },
  { id: '6',  label: '10%', value: 10 },
  { id: '7',  label: '12%', value: 12 },
  { id: '8',  label: '15%', value: 15 },
  { id: '9',  label: '17%', value: 17 },
  { id: '10', label: '18%', value: 18 },
  { id: '11', label: '25%', value: 25 },
] as const;

export type FBRTaxRate = typeof FBR_TAX_RATES[number];

export const FBR_COMMON_HS_CODES = [
  { code: '0101.2100', description: 'Live horses - Pure-bred breeding animals' },
  { code: '8517.6200', description: 'Machines for reception, conversion and transmission' },
  { code: '8471.3000', description: 'Portable digital automatic data processing machines' },
  { code: '8471.4100', description: 'Data processing machines (CPU + input/output)' },
  { code: '8471.5000', description: 'Processing units (excluding CPU)' },
  { code: '8471.6000', description: 'Input or output units' },
  { code: '8471.7000', description: 'Storage units' },
  { code: '8528.4200', description: 'Colour monitors with digital interface' },
  { code: '8528.5200', description: 'Colour monitors other than CRT' },
  { code: '9018.1100', description: 'Electrocardiographs' },
  { code: '9018.1200', description: 'Ultrasonic scanning apparatus' },
  { code: '9018.1300', description: 'Magnetic resonance imaging apparatus' },
  { code: '9018.1400', description: 'Scintigraphic apparatus' },
  { code: '3004.9000', description: 'Other medicaments' },
  { code: '2710.1900', description: 'Petroleum oils (other than crude)' },
] as const;

export type FBRHSCode = typeof FBR_COMMON_HS_CODES[number];

export const FBR_UNITS_OF_MEASUREMENT = [
  'Numbers, pieces, units',
  'Kilograms',
  'Liters',
  'Meters',
  'Square meters',
  'Cubic meters',
  'Dozens',
  'Cartons',
  'Boxes',
  'Bags',
  'Barrels',
  'Tons',
] as const;

// Alias for component usage
export const FBR_UOM_OPTIONS = FBR_UNITS_OF_MEASUREMENT;

export type FBRUOM = typeof FBR_UNITS_OF_MEASUREMENT[number];

export const FBR_SALE_TYPES = [
  'Goods at standard rate (default)',
  'Goods at Reduced Rate',
  'Goods at zero-rate',
  'Exempt goods',
  'Cotton ginners',
  'Processing/Conversion of Goods',
  'Goods (FED in ST Mode)',
  'Goods as per SRO.297(I)/2023',
  'Services at standard rate',
] as const;

export type FBRSaleType = typeof FBR_SALE_TYPES[number];

/**
 * Helper function to format tax rate for display
 */
export function formatTaxRate(value: number): string {
  return `${value}%`;
}

/**
 * Helper function to parse tax rate from string
 */
export function parseTaxRate(rate: string): number {
  const match = rate.match(/^(\d+)%$/);
  if (!match) {
    throw new Error(`Invalid tax rate format: ${rate}`);
  }
  return parseInt(match[1], 10);
}
