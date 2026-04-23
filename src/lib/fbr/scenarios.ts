// FBR Sandbox Scenarios — official list from FBR Digital Invoice portal

export interface FBRScenarioTestBuyer {
  ntnCnic: string;
  businessName: string;
  province: string;
  address: string;
  registrationType: 'Registered' | 'Unregistered';
}

export interface FBRScenarioTestItem {
  hsCode: string;
  productDescription: string;
  rate: string;
  uom: string;
  quantity: number;
  valueSalesExcludingST: number;
  fixedNotifiedValueOrRetailPrice: number;
  salesTaxApplicable: number;
  salesTaxWithheldAtSource: number;
  extraTax: number;
  furtherTax: number;
  sroScheduleNo: string;
  fedPayable: number;
  discount: number;
  saleType: string;
  sroItemSerialNo: string;
  totalValues: number;
}

export interface FBRScenarioTestData {
  buyer: FBRScenarioTestBuyer;
  item: FBRScenarioTestItem;
  invoiceRefNo: string;
}

export interface FBRScenario {
  id: string;
  description: string;
  saleType: string;
  taxVariant: string;
  requiredFields: string[];
  notes?: string;
  testData: FBRScenarioTestData;
}

export const FBR_SCENARIOS: FBRScenario[] = [
  {
    id: 'SN001',
    description: 'Goods at Standard Rate to Registered Buyers',
    saleType: 'Goods at standard rate (default)',
    taxVariant: '18%',
    requiredFields: ['buyerNTNCNIC', 'hsCode', 'rate'],
    notes: 'Most common scenario. Buyer is registered for sales tax.',
    testData: {
      buyer: {
        ntnCnic: '4093455',
        businessName: 'UMMATI ENTERPRISES',
        province: 'Sindh',
        address: 'Karachi',
        registrationType: 'Registered',
      },
      item: {
        hsCode: '0101.2100',
        productDescription: 'hello world',
        rate: '18%',
        uom: 'Numbers, pieces, units',
        quantity: 200,
        valueSalesExcludingST: 1000,
        fixedNotifiedValueOrRetailPrice: 0,
        salesTaxApplicable: 180,
        salesTaxWithheldAtSource: 0,
        extraTax: 0,
        furtherTax: 0,
        sroScheduleNo: '',
        fedPayable: 0,
        discount: 0,
        saleType: 'Goods at standard rate (default)',
        sroItemSerialNo: '',
        totalValues: 1180,
      },
      invoiceRefNo: '',
    },
  },
  {
    id: 'SN002',
    description: 'Goods at Standard Rate to Unregistered Buyers',
    saleType: 'Goods at standard rate (default)',
    taxVariant: '18% + 2% further tax',
    requiredFields: ['hsCode', 'rate', 'furtherTax'],
    notes: 'Buyer is unregistered. 2% further tax applies on top of 18%.',
    testData: {
      buyer: {
        ntnCnic: '1234567',
        businessName: 'FERTILIZER MANUFAC IRS NEW',
        province: 'Sindh',
        address: 'Karachi',
        registrationType: 'Unregistered',
      },
      item: {
        hsCode: '0101.2100',
        productDescription: 'test',
        rate: '18%',
        uom: 'Numbers, pieces, units',
        quantity: 400,
        valueSalesExcludingST: 1000,
        fixedNotifiedValueOrRetailPrice: 0,
        salesTaxApplicable: 180,
        salesTaxWithheldAtSource: 0,
        extraTax: 0,
        furtherTax: 20,
        sroScheduleNo: '',
        fedPayable: 0,
        discount: 0,
        saleType: 'Goods at standard rate (default)',
        sroItemSerialNo: '',
        totalValues: 1200,
      },
      invoiceRefNo: '',
    },
  },
  {
    id: 'SN005',
    description: 'Reduced Rate Sale',
    saleType: 'Goods at Reduced Rate',
    taxVariant: '1%',
    requiredFields: ['hsCode', 'rate', 'sroScheduleNo'],
    notes: 'Goods attracting reduced ST rate under SRO exemption.',
    testData: {
      buyer: {
        ntnCnic: '1000000000000',
        businessName: 'FERTILIZER MANUFAC IRS NEW',
        province: 'Sindh',
        address: 'Karachi',
        registrationType: 'Unregistered',
      },
      item: {
        hsCode: '0102.2930',
        productDescription: 'product Description41',
        rate: '1%',
        uom: 'Numbers, pieces, units',
        quantity: 1,
        valueSalesExcludingST: 1000,
        fixedNotifiedValueOrRetailPrice: 0,
        salesTaxApplicable: 10,
        salesTaxWithheldAtSource: 50.23,
        extraTax: 0,
        furtherTax: 120,
        sroScheduleNo: 'EIGHTH SCHEDULE Table 1',
        fedPayable: 50.36,
        discount: 56.36,
        saleType: 'Goods at Reduced Rate',
        sroItemSerialNo: '82',
        totalValues: 0,
      },
      invoiceRefNo: '',
    },
  },
  {
    id: 'SN006',
    description: 'Exempt Goods Sale',
    saleType: 'Exempt goods',
    taxVariant: '0%',
    requiredFields: ['hsCode', 'saleType'],
    notes: 'Goods completely exempt from sales tax. Tax must be zero.',
    testData: {
      buyer: {
        ntnCnic: '2046004',
        businessName: 'FERTILIZER MANUFAC IRS NEW',
        province: 'Sindh',
        address: 'Karachi',
        registrationType: 'Registered',
      },
      item: {
        hsCode: '0102.2930',
        productDescription: 'product Description41',
        rate: '0%',
        uom: 'Numbers, pieces, units',
        quantity: 1,
        valueSalesExcludingST: 10,
        fixedNotifiedValueOrRetailPrice: 0,
        salesTaxApplicable: 0,
        salesTaxWithheldAtSource: 50.23,
        extraTax: 0,
        furtherTax: 120,
        sroScheduleNo: '6th Schd Table I',
        fedPayable: 50.36,
        discount: 56.36,
        saleType: 'Exempt goods',
        sroItemSerialNo: '100',
        totalValues: 0,
      },
      invoiceRefNo: 'SI-20250515-001',
    },
  },
  {
    id: 'SN007',
    description: 'Zero Rated Sale',
    saleType: 'Goods at zero-rate',
    taxVariant: '0%',
    requiredFields: ['hsCode', 'rate', 'saleType'],
    notes: 'Zero-rated goods — distinct from exempt, used for exports.',
    testData: {
      buyer: {
        ntnCnic: '3710505701479',
        businessName: 'FERTILIZER MANUFAC IRS NEW',
        province: 'Sindh',
        address: 'Karachi',
        registrationType: 'Unregistered',
      },
      item: {
        hsCode: '0101.2100',
        productDescription: 'test',
        rate: '0%',
        uom: 'Numbers, pieces, units',
        quantity: 100,
        valueSalesExcludingST: 100,
        fixedNotifiedValueOrRetailPrice: 0,
        salesTaxApplicable: 0,
        salesTaxWithheldAtSource: 0,
        extraTax: 0,
        furtherTax: 0,
        sroScheduleNo: '327(I)/2008',
        fedPayable: 0,
        discount: 0,
        saleType: 'Goods at zero-rate',
        sroItemSerialNo: '1',
        totalValues: 100,
      },
      invoiceRefNo: '',
    },
  },
  {
    id: 'SN009',
    description: 'Cotton Spinners Purchase from Cotton Ginners (Textile Sector)',
    saleType: 'Cotton ginners',
    taxVariant: '18%',
    requiredFields: ['hsCode', 'rate', 'saleType'],
    notes: 'Cotton ginning and associated agricultural processing.',
    testData: {
      buyer: {
        ntnCnic: '2046004',
        businessName: 'Textile Mills',
        province: 'Sindh',
        address: 'Karachi',
        registrationType: 'Registered',
      },
      item: {
        hsCode: '0101.2100',
        productDescription: 'Raw Cotton',
        rate: '18%',
        uom: 'Numbers, pieces, units',
        quantity: 1,
        valueSalesExcludingST: 2500,
        fixedNotifiedValueOrRetailPrice: 0,
        salesTaxApplicable: 450,
        salesTaxWithheldAtSource: 0,
        extraTax: 0,
        furtherTax: 0,
        sroScheduleNo: '',
        fedPayable: 0,
        discount: 0,
        saleType: 'Cotton ginners',
        sroItemSerialNo: '',
        totalValues: 2950,
      },
      invoiceRefNo: '',
    },
  },
  {
    id: 'SN016',
    description: 'Processing / Conversion of Goods',
    saleType: 'Processing/Conversion of Goods',
    taxVariant: '5%',
    requiredFields: ['hsCode', 'rate', 'saleType'],
    notes: 'Invoice raised for processing or conversion services on goods.',
    testData: {
      buyer: {
        ntnCnic: '1000000000078',
        businessName: 'Processing Client',
        province: 'Sindh',
        address: 'Karachi',
        registrationType: 'Unregistered',
      },
      item: {
        hsCode: '0101.2100',
        productDescription: 'Processing Service',
        rate: '5%',
        uom: 'Numbers, pieces, units',
        quantity: 1,
        valueSalesExcludingST: 100,
        fixedNotifiedValueOrRetailPrice: 0,
        salesTaxApplicable: 5,
        salesTaxWithheldAtSource: 0,
        extraTax: 0,
        furtherTax: 0,
        sroScheduleNo: '',
        fedPayable: 0,
        discount: 0,
        saleType: 'Processing/Conversion of Goods',
        sroItemSerialNo: '',
        totalValues: 105,
      },
      invoiceRefNo: '',
    },
  },
  {
    id: 'SN017',
    description: 'Sale of Goods where FED is Charged in ST Mode',
    saleType: 'Goods (FED in ST Mode)',
    taxVariant: '8%',
    requiredFields: ['hsCode', 'rate', 'fedPayable'],
    notes: 'Federal Excise Duty charged in Sales Tax mode alongside ST.',
    testData: {
      buyer: {
        ntnCnic: '7000009',
        businessName: 'FED Customer',
        province: 'Sindh',
        address: 'Karachi',
        registrationType: 'Unregistered',
      },
      item: {
        hsCode: '0101.2100',
        productDescription: 'FED Goods',
        rate: '8%',
        uom: 'Numbers, pieces, units',
        quantity: 1,
        valueSalesExcludingST: 100,
        fixedNotifiedValueOrRetailPrice: 0,
        salesTaxApplicable: 8,
        salesTaxWithheldAtSource: 0,
        extraTax: 0,
        furtherTax: 0,
        sroScheduleNo: '',
        fedPayable: 5,
        discount: 0,
        saleType: 'Goods (FED in ST Mode)',
        sroItemSerialNo: '',
        totalValues: 108,
      },
      invoiceRefNo: '',
    },
  },
  {
    id: 'SN024',
    description: 'Goods Sold that are Listed in SRO 297(I)/2023',
    saleType: 'Goods as per SRO.297(I)/2023',
    taxVariant: '25%',
    requiredFields: ['hsCode', 'rate', 'sroScheduleNo', 'sroItemSerialNo'],
    notes: 'Goods under SRO 297(I)/2023 — zero/reduced rate with SRO reference.',
    testData: {
      buyer: {
        ntnCnic: '1000000000000',
        businessName: 'SRO Buyer',
        province: 'Sindh',
        address: 'Karachi',
        registrationType: 'Unregistered',
      },
      item: {
        hsCode: '0101.2100',
        productDescription: 'SRO Product',
        rate: '25%',
        uom: 'Numbers, pieces, units',
        quantity: 123,
        valueSalesExcludingST: 1000,
        fixedNotifiedValueOrRetailPrice: 0,
        salesTaxApplicable: 250,
        salesTaxWithheldAtSource: 0,
        extraTax: 0,
        furtherTax: 0,
        sroScheduleNo: '297(I)/2023-Table-I',
        fedPayable: 0,
        discount: 0,
        saleType: 'Goods as per SRO.297(I)/2023',
        sroItemSerialNo: '12',
        totalValues: 1250,
      },
      invoiceRefNo: 'SI-20260421-001',
    },
  },
];

/** Look up a scenario by ID */
export function getScenario(id: string): FBRScenario | undefined {
  return FBR_SCENARIOS.find((s) => s.id === id);
}
