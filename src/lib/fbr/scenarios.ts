// FBR Sandbox Scenarios Configuration
// 9 official FBR sandbox scenarios (SN001–SN009) as documented in FBR Digital Invoice API

export interface FBRScenario {
  id: string;
  description: string;
  saleType: string;
  taxVariant: string;
  requiredFields: string[];
  notes?: string;
}

export const FBR_SCENARIOS: FBRScenario[] = [
  {
    id: 'SN001',
    description: 'Standard Rate — Registered Buyer',
    saleType: 'Goods at standard rate (default)',
    taxVariant: '18%',
    requiredFields: ['buyerNTNCNIC', 'hsCode', 'rate'],
    notes: 'Most common scenario. Buyer is registered for sales tax.',
  },
  {
    id: 'SN002',
    description: 'Standard Rate — Unregistered Buyer',
    saleType: 'Goods at standard rate (default)',
    taxVariant: '18% + 2% further tax',
    requiredFields: ['hsCode', 'rate', 'furtherTax'],
    notes: 'Buyer is unregistered. 2% further tax applies on top of 18%.',
  },
  {
    id: 'SN003',
    description: 'Steel Melting / Re-rolled Products',
    saleType: 'Steel Melting and re-rolling',
    taxVariant: '17%',
    requiredFields: ['hsCode', 'rate', 'saleType'],
    notes: 'Special rate for melted/re-rolled steel products.',
  },
  {
    id: 'SN004',
    description: 'Ship Breakers',
    saleType: 'Ship breaking',
    taxVariant: '17%',
    requiredFields: ['hsCode', 'rate', 'saleType'],
    notes: 'Ship breaking and scrap steel from vessels.',
  },
  {
    id: 'SN005',
    description: 'Reduced Rate Goods',
    saleType: 'Goods at reduced rate',
    taxVariant: '5%',
    requiredFields: ['hsCode', 'rate', 'sroScheduleNo'],
    notes: 'Goods attracting reduced ST rate under SRO exemption.',
  },
  {
    id: 'SN006',
    description: 'Exempt Goods',
    saleType: 'Exempt Goods',
    taxVariant: '0%',
    requiredFields: ['hsCode', 'saleType'],
    notes: 'Goods completely exempt from sales tax. Tax must be zero.',
  },
  {
    id: 'SN007',
    description: 'Zero Rated Goods (Exports)',
    saleType: 'Zero-rated Goods',
    taxVariant: '0%',
    requiredFields: ['hsCode', 'rate', 'saleType'],
    notes: 'Zero-rated goods — distinct from exempt (used for exports).',
  },
  {
    id: 'SN008',
    description: '3rd Schedule Goods (Retail Price)',
    saleType: '3rd Schedule Goods',
    taxVariant: '18% on retail price',
    requiredFields: ['hsCode', 'rate', 'fixedNotifiedValueOrRetailPrice'],
    notes: 'Tax calculated on fixed/notified retail price, not transaction value.',
  },
  {
    id: 'SN009',
    description: 'Cotton Ginners',
    saleType: 'Cotton Ginners',
    taxVariant: '7%',
    requiredFields: ['hsCode', 'rate', 'saleType'],
    notes: 'Cotton ginning and associated agricultural processing.',
  },
];

/** Look up a scenario by ID */
export function getScenario(id: string): FBRScenario | undefined {
  return FBR_SCENARIOS.find((s) => s.id === id);
}
