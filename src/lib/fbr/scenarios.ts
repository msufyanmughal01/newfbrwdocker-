// FBR Sandbox Scenarios — official list from FBR Digital Invoice portal

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
    description: 'Goods at Standard Rate to Registered Buyers',
    saleType: 'Goods at standard rate (default)',
    taxVariant: '18%',
    requiredFields: ['buyerNTNCNIC', 'hsCode', 'rate'],
    notes: 'Most common scenario. Buyer is registered for sales tax.',
  },
  {
    id: 'SN002',
    description: 'Goods at Standard Rate to Unregistered Buyers',
    saleType: 'Goods at standard rate (default)',
    taxVariant: '18% + 2% further tax',
    requiredFields: ['hsCode', 'rate', 'furtherTax'],
    notes: 'Buyer is unregistered. 2% further tax applies on top of 18%.',
  },
  {
    id: 'SN005',
    description: 'Reduced Rate Sale',
    saleType: 'Goods at reduced rate',
    taxVariant: '5%',
    requiredFields: ['hsCode', 'rate', 'sroScheduleNo'],
    notes: 'Goods attracting reduced ST rate under SRO exemption.',
  },
  {
    id: 'SN006',
    description: 'Exempt Goods Sale',
    saleType: 'Exempt Goods',
    taxVariant: '0%',
    requiredFields: ['hsCode', 'saleType'],
    notes: 'Goods completely exempt from sales tax. Tax must be zero.',
  },
  {
    id: 'SN007',
    description: 'Zero Rated Sale',
    saleType: 'Zero-rated Goods',
    taxVariant: '0%',
    requiredFields: ['hsCode', 'rate', 'saleType'],
    notes: 'Zero-rated goods — distinct from exempt, used for exports.',
  },
  {
    id: 'SN009',
    description: 'Cotton Spinners Purchase from Cotton Ginners (Textile Sector)',
    saleType: 'Cotton Ginners',
    taxVariant: '7%',
    requiredFields: ['hsCode', 'rate', 'saleType'],
    notes: 'Cotton ginning and associated agricultural processing.',
  },
  {
    id: 'SN016',
    description: 'Processing / Conversion of Goods',
    saleType: 'Processing / Conversion',
    taxVariant: '18%',
    requiredFields: ['hsCode', 'rate', 'saleType'],
    notes: 'Invoice raised for processing or conversion services on goods.',
  },
  {
    id: 'SN017',
    description: 'Sale of Goods where FED is Charged in ST Mode',
    saleType: 'Goods at standard rate (default)',
    taxVariant: '18%',
    requiredFields: ['hsCode', 'rate', 'fedPayable'],
    notes: 'Federal Excise Duty charged in Sales Tax mode alongside ST.',
  },
  {
    id: 'SN024',
    description: 'Goods Sold that are Listed in SRO 297(I)/2023',
    saleType: 'Goods at reduced rate',
    taxVariant: '0%',
    requiredFields: ['hsCode', 'rate', 'sroScheduleNo', 'sroItemSerialNo'],
    notes: 'Goods under SRO 297(I)/2023 — zero/reduced rate with SRO reference.',
  },
];

/** Look up a scenario by ID */
export function getScenario(id: string): FBRScenario | undefined {
  return FBR_SCENARIOS.find((s) => s.id === id);
}
