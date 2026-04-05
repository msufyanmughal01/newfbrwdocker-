// FBR Error Code Catalog
// Mapped verbatim from FBR Digital Invoicing API v1.12
// Section 7 (Sales errors 0001–0402) and Section 8 (Purchase errors 0156–0177)

export type FBRErrorSeverity = 'error' | 'warning';

export interface FBRErrorEntry {
  code: string;
  userMessage: string;
  fieldPath: string; // Form field path; 'items[n]' for line-item errors
  severity: FBRErrorSeverity;
}

export const FBR_ERROR_CODES: Record<string, FBRErrorEntry> = {

  // ─── Section 7: Sales Error Codes ─────────────────────────────────────────

  '0001': {
    code: '0001',
    userMessage: 'The seller is not registered for sales tax. Please verify your NTN/CNIC credentials.',
    fieldPath: 'sellerNTNCNIC',
    severity: 'error',
  },
  '0002': {
    code: '0002',
    userMessage: 'The buyer NTN/CNIC format is invalid. Must be 13 digits (CNIC) or 7/9 digits (NTN).',
    fieldPath: 'buyerNTNCNIC',
    severity: 'error',
  },
  '0003': {
    code: '0003',
    userMessage: 'The invoice type is not valid or is empty. Only "Sale Invoice" and "Debit Note" are accepted.',
    fieldPath: 'invoiceType',
    severity: 'error',
  },
  '0005': {
    code: '0005',
    userMessage: 'Invoice date format is invalid. Use YYYY-MM-DD (e.g. 2025-05-25).',
    fieldPath: 'invoiceDate',
    severity: 'error',
  },
  '0006': {
    code: '0006',
    userMessage: 'The referenced sales invoice does not exist in FBR records for STWH.',
    fieldPath: 'invoiceRefNo',
    severity: 'error',
  },
  '0007': {
    code: '0007',
    userMessage: 'The selected invoice type is not associated with the seller registration number.',
    fieldPath: 'invoiceType',
    severity: 'error',
  },
  '0008': {
    code: '0008',
    userMessage: 'Sales tax withheld at source must be zero or equal to the sales tax applicable.',
    fieldPath: 'items[n].salesTaxWithheldAtSource',
    severity: 'error',
  },
  '0009': {
    code: '0009',
    userMessage: 'Buyer registration number cannot be empty.',
    fieldPath: 'buyerNTNCNIC',
    severity: 'error',
  },
  '0010': {
    code: '0010',
    userMessage: 'Buyer name cannot be empty.',
    fieldPath: 'buyerBusinessName',
    severity: 'error',
  },
  '0011': {
    code: '0011',
    userMessage: 'Invoice type cannot be empty.',
    fieldPath: 'invoiceType',
    severity: 'error',
  },
  '0012': {
    code: '0012',
    userMessage: 'Buyer registration type cannot be empty.',
    fieldPath: 'buyerRegistrationType',
    severity: 'error',
  },
  '0013': {
    code: '0013',
    userMessage: 'Sale type cannot be empty or null.',
    fieldPath: 'items[n].saleType',
    severity: 'error',
  },
  '0018': {
    code: '0018',
    userMessage: 'Sales Tax / FED cannot be empty.',
    fieldPath: 'items[n].salesTaxApplicable',
    severity: 'error',
  },
  '0019': {
    code: '0019',
    userMessage: 'HS Code cannot be empty.',
    fieldPath: 'items[n].hsCode',
    severity: 'error',
  },
  '0020': {
    code: '0020',
    userMessage: 'Rate field cannot be empty. Please select a valid tax rate.',
    fieldPath: 'items[n].rate',
    severity: 'error',
  },
  '0021': {
    code: '0021',
    userMessage: 'Value of Sales (excluding ST) or Quantity cannot be empty.',
    fieldPath: 'items[n].valueSalesExcludingST',
    severity: 'error',
  },
  '0022': {
    code: '0022',
    userMessage: 'Sales Tax Withheld at Source cannot be empty.',
    fieldPath: 'items[n].salesTaxWithheldAtSource',
    severity: 'error',
  },
  '0023': {
    code: '0023',
    userMessage: 'Sales Tax cannot be empty.',
    fieldPath: 'items[n].salesTaxApplicable',
    severity: 'error',
  },
  '0024': {
    code: '0024',
    userMessage: 'Sales Tax Withheld cannot be empty.',
    fieldPath: 'items[n].salesTaxWithheldAtSource',
    severity: 'error',
  },
  '0026': {
    code: '0026',
    userMessage: 'Invoice Reference Number is mandatory for Debit Notes.',
    fieldPath: 'invoiceRefNo',
    severity: 'error',
  },
  '0027': {
    code: '0027',
    userMessage: 'A reason is mandatory for Debit/Credit Notes.',
    fieldPath: '',
    severity: 'error',
  },
  '0028': {
    code: '0028',
    userMessage: 'When reason is "Others", valid remarks are required.',
    fieldPath: '',
    severity: 'error',
  },
  '0029': {
    code: '0029',
    userMessage: 'Debit/Credit Note date must be on or after the original invoice date.',
    fieldPath: 'invoiceDate',
    severity: 'error',
  },
  '0030': {
    code: '0030',
    userMessage: 'Unregistered distributors are not allowed to submit invoices before the system cutoff date.',
    fieldPath: 'buyerRegistrationType',
    severity: 'error',
  },
  '0031': {
    code: '0031',
    userMessage: 'Sales Tax is not mentioned on this invoice.',
    fieldPath: 'items[n].salesTaxApplicable',
    severity: 'error',
  },
  '0032': {
    code: '0032',
    userMessage: 'Sales Tax Withheld at Source is only allowed for Government/FTN holders.',
    fieldPath: 'items[n].salesTaxWithheldAtSource',
    severity: 'error',
  },
  '0034': {
    code: '0034',
    userMessage: 'Debit/Credit Notes can only be submitted within 180 days of the original invoice.',
    fieldPath: 'invoiceRefNo',
    severity: 'error',
  },
  '0035': {
    code: '0035',
    userMessage: 'Note date must be on or after the original invoice date.',
    fieldPath: 'invoiceDate',
    severity: 'error',
  },
  '0036': {
    code: '0036',
    userMessage: 'Credit Note value of sales must not exceed the original invoice value.',
    fieldPath: 'items[n].valueSalesExcludingST',
    severity: 'error',
  },
  '0037': {
    code: '0037',
    userMessage: 'Credit Note value of ST Withheld must not exceed the original invoice ST Withheld.',
    fieldPath: 'items[n].salesTaxWithheldAtSource',
    severity: 'error',
  },
  '0039': {
    code: '0039',
    userMessage: 'For registered users, the STWH invoice fields must match the original sale invoice.',
    fieldPath: 'items[n].salesTaxWithheldAtSource',
    severity: 'error',
  },
  '0041': {
    code: '0041',
    userMessage: 'Invoice number cannot be empty.',
    fieldPath: 'invoiceRefNo',
    severity: 'error',
  },
  '0042': {
    code: '0042',
    userMessage: 'Invoice date cannot be empty.',
    fieldPath: 'invoiceDate',
    severity: 'error',
  },
  '0043': {
    code: '0043',
    userMessage: 'Invoice date is not valid.',
    fieldPath: 'invoiceDate',
    severity: 'error',
  },
  '0044': {
    code: '0044',
    userMessage: 'HS Code cannot be empty. Please enter a valid Harmonized System code.',
    fieldPath: 'items[n].hsCode',
    severity: 'error',
  },
  '0046': {
    code: '0046',
    userMessage: 'Rate cannot be empty. Please select a valid rate for the chosen sale type.',
    fieldPath: 'items[n].rate',
    severity: 'error',
  },
  '0050': {
    code: '0050',
    userMessage: 'For cotton ginners, Sales Tax Withheld must equal the Sales Tax Applicable or be zero.',
    fieldPath: 'items[n].salesTaxWithheldAtSource',
    severity: 'error',
  },
  '0051': {
    code: '0051',
    userMessage: 'The referenced sales invoice does not exist in FBR records.',
    fieldPath: 'invoiceRefNo',
    severity: 'error',
  },
  '0052': {
    code: '0052',
    userMessage: 'The HS Code does not match the provided sale type.',
    fieldPath: 'items[n].hsCode',
    severity: 'error',
  },
  '0053': {
    code: '0053',
    userMessage: 'The buyer registration type is invalid.',
    fieldPath: 'buyerRegistrationType',
    severity: 'error',
  },
  '0055': {
    code: '0055',
    userMessage: 'Sales Tax Withheld at Source cannot be empty or invalid (Withholding Agent).',
    fieldPath: 'items[n].salesTaxWithheldAtSource',
    severity: 'error',
  },
  '0056': {
    code: '0056',
    userMessage: 'The buyer does not exist in the steel sector registry.',
    fieldPath: 'buyerNTNCNIC',
    severity: 'error',
  },
  '0057': {
    code: '0057',
    userMessage: 'The referenced invoice for this Debit/Credit Note does not exist in FBR records.',
    fieldPath: 'invoiceRefNo',
    severity: 'error',
  },
  '0058': {
    code: '0058',
    userMessage: 'Self-invoicing is not allowed. Buyer and Seller registration numbers cannot be the same.',
    fieldPath: 'buyerNTNCNIC',
    severity: 'error',
  },
  '0064': {
    code: '0064',
    userMessage: 'A Credit Note has already been added against this invoice.',
    fieldPath: 'invoiceRefNo',
    severity: 'error',
  },
  '0067': {
    code: '0067',
    userMessage: 'The Sales Tax value on the Debit Note cannot exceed the original invoice Sales Tax.',
    fieldPath: 'items[n].salesTaxApplicable',
    severity: 'error',
  },
  '0068': {
    code: '0068',
    userMessage: 'The Sales Tax value on the Credit Note cannot be less than the original per rate.',
    fieldPath: 'items[n].salesTaxApplicable',
    severity: 'error',
  },
  '0070': {
    code: '0070',
    userMessage: 'Sales Tax Withheld at Source is only allowed for registered users.',
    fieldPath: 'items[n].salesTaxWithheldAtSource',
    severity: 'error',
  },
  '0071': {
    code: '0071',
    userMessage: 'Credit Notes are only allowed for specific user types.',
    fieldPath: 'invoiceRefNo',
    severity: 'error',
  },
  '0073': {
    code: '0073',
    userMessage: 'Sale Origination Province of Supplier cannot be empty.',
    fieldPath: 'sellerProvince',
    severity: 'error',
  },
  '0074': {
    code: '0074',
    userMessage: 'Destination of Supply cannot be empty.',
    fieldPath: 'buyerProvince',
    severity: 'error',
  },
  '0077': {
    code: '0077',
    userMessage: 'SRO/Schedule Number cannot be empty for this sale type.',
    fieldPath: 'items[n].sroScheduleNo',
    severity: 'error',
  },
  '0078': {
    code: '0078',
    userMessage: 'Item serial number in SRO cannot be empty for this sale type.',
    fieldPath: 'items[n].sroItemSerialNo',
    severity: 'error',
  },
  '0079': {
    code: '0079',
    userMessage: 'Rate 5% is not allowed when sales value exceeds Rs. 20,000.',
    fieldPath: 'items[n].rate',
    severity: 'error',
  },
  '0080': {
    code: '0080',
    userMessage: 'Further Tax cannot be empty for this sale type.',
    fieldPath: 'items[n].furtherTax',
    severity: 'error',
  },
  '0081': {
    code: '0081',
    userMessage: '"Input Credit Not Allowed" field cannot be empty.',
    fieldPath: '',
    severity: 'error',
  },
  '0082': {
    code: '0082',
    userMessage: 'The seller is not registered for sales tax.',
    fieldPath: 'sellerNTNCNIC',
    severity: 'error',
  },
  '0083': {
    code: '0083',
    userMessage: 'The seller registration number does not match FBR records.',
    fieldPath: 'sellerNTNCNIC',
    severity: 'error',
  },
  '0085': {
    code: '0085',
    userMessage: 'Total Value of Sales must be provided (required for PFAD).',
    fieldPath: 'items[n].totalValues',
    severity: 'error',
  },
  '0086': {
    code: '0086',
    userMessage: 'This seller is not an EFS license holder who imported Compressor Scrap in the last 12 months.',
    fieldPath: '',
    severity: 'error',
  },
  '0087': {
    code: '0087',
    userMessage: 'Petroleum Levy rates are not configured properly for this invoice.',
    fieldPath: '',
    severity: 'error',
  },
  '0088': {
    code: '0088',
    userMessage: 'Invalid invoice number format. Must be alphanumeric with hyphens only (e.g. Inv-001).',
    fieldPath: 'invoiceRefNo',
    severity: 'error',
  },
  '0089': {
    code: '0089',
    userMessage: 'FED Charged cannot be empty for this sale type.',
    fieldPath: 'items[n].fedPayable',
    severity: 'error',
  },
  '0090': {
    code: '0090',
    userMessage: 'Fixed/notified value or Retail Price cannot be empty for this sale type.',
    fieldPath: 'items[n].fixedNotifiedValueOrRetailPrice',
    severity: 'error',
  },
  '0091': {
    code: '0091',
    userMessage: 'Extra Tax must be empty for this sale type.',
    fieldPath: 'items[n].extraTax',
    severity: 'error',
  },
  '0092': {
    code: '0092',
    userMessage: 'Purchase type cannot be empty.',
    fieldPath: 'items[n].saleType',
    severity: 'error',
  },
  '0093': {
    code: '0093',
    userMessage: 'The selected sale type is not allowed for this manufacturer. Please select the correct sale type.',
    fieldPath: 'items[n].saleType',
    severity: 'error',
  },
  '0095': {
    code: '0095',
    userMessage: 'Extra Tax cannot be empty for this sale type.',
    fieldPath: 'items[n].extraTax',
    severity: 'error',
  },
  '0096': {
    code: '0096',
    userMessage: 'For the provided HS Code, only KWH unit of measurement is allowed.',
    fieldPath: 'items[n].uoM',
    severity: 'error',
  },
  '0097': {
    code: '0097',
    userMessage: 'Unit of measurement must be KG for this HS Code.',
    fieldPath: 'items[n].uoM',
    severity: 'error',
  },
  '0098': {
    code: '0098',
    userMessage: 'Quantity / Electricity Unit cannot be empty.',
    fieldPath: 'items[n].quantity',
    severity: 'error',
  },
  '0099': {
    code: '0099',
    userMessage: 'Unit of measurement is invalid. UOM must match the given HS Code.',
    fieldPath: 'items[n].uoM',
    severity: 'error',
  },
  '0100': {
    code: '0100',
    userMessage: 'Only cotton ginner sale type is allowed for registered users on this product.',
    fieldPath: 'items[n].saleType',
    severity: 'error',
  },
  '0101': {
    code: '0101',
    userMessage: 'Please use the Toll Manufacturing sale type for Steel Sector invoices.',
    fieldPath: 'items[n].saleType',
    severity: 'error',
  },
  '0102': {
    code: '0102',
    userMessage: 'The calculated sales tax does not match the 3rd Schedule formula.',
    fieldPath: 'items[n].salesTaxApplicable',
    severity: 'error',
  },
  '0103': {
    code: '0103',
    userMessage: 'The calculated value does not match the Potassium Chlorate formula.',
    fieldPath: 'items[n].salesTaxApplicable',
    severity: 'error',
  },
  '0104': {
    code: '0104',
    userMessage: 'The calculated percentage of sales tax does not match the applicable rate.',
    fieldPath: 'items[n].salesTaxApplicable',
    severity: 'error',
  },
  '0105': {
    code: '0105',
    userMessage: 'The calculated sales tax for the given quantity is incorrect.',
    fieldPath: 'items[n].salesTaxApplicable',
    severity: 'error',
  },
  '0106': {
    code: '0106',
    userMessage: 'The buyer is not registered for sales tax.',
    fieldPath: 'buyerNTNCNIC',
    severity: 'error',
  },
  '0107': {
    code: '0107',
    userMessage: 'The buyer registration number does not match FBR records.',
    fieldPath: 'buyerNTNCNIC',
    severity: 'error',
  },
  '0108': {
    code: '0108',
    userMessage: 'The seller registration number is not valid.',
    fieldPath: 'sellerNTNCNIC',
    severity: 'error',
  },
  '0109': {
    code: '0109',
    userMessage: 'The invoice type is not selected correctly.',
    fieldPath: 'invoiceType',
    severity: 'error',
  },
  '0111': {
    code: '0111',
    userMessage: 'The purchase type is not selected correctly.',
    fieldPath: 'items[n].saleType',
    severity: 'error',
  },
  '0113': {
    code: '0113',
    userMessage: 'Invoice date is not in the correct format. Use YYYY-MM-DD (e.g. 2025-05-25).',
    fieldPath: 'invoiceDate',
    severity: 'error',
  },
  '0300': {
    code: '0300',
    userMessage: 'One or more decimal values are invalid (Discount / TotalValue / FedPayable / ExtraTax / FurtherTax / SalesTaxWithheld / Quantity).',
    fieldPath: '',
    severity: 'error',
  },
  '0401': {
    code: '0401',
    userMessage: 'The seller FBR token is unauthorised or does not exist. Please update your FBR token in Business Settings.',
    fieldPath: 'sellerNTNCNIC',
    severity: 'error',
  },
  '0402': {
    code: '0402',
    userMessage: 'The buyer NTN/CNIC is not authorised. Must be a 13-digit CNIC or 7-digit NTN.',
    fieldPath: 'buyerNTNCNIC',
    severity: 'error',
  },

  // ─── Section 8: Purchase Error Codes ──────────────────────────────────────

  '0156': {
    code: '0156',
    userMessage: 'NTN/Registration Number is invalid or null.',
    fieldPath: 'sellerNTNCNIC',
    severity: 'error',
  },
  '0157': {
    code: '0157',
    userMessage: 'The buyer is not registered for sales tax (purchase invoice).',
    fieldPath: 'buyerNTNCNIC',
    severity: 'error',
  },
  '0158': {
    code: '0158',
    userMessage: 'The buyer registration number does not match FBR records (purchase invoice).',
    fieldPath: 'buyerNTNCNIC',
    severity: 'error',
  },
  '0159': {
    code: '0159',
    userMessage: 'FTN Holder as Seller is not allowed for purchase invoices.',
    fieldPath: 'sellerNTNCNIC',
    severity: 'error',
  },
  '0160': {
    code: '0160',
    userMessage: 'Buyer name cannot be empty (purchase invoice).',
    fieldPath: 'buyerBusinessName',
    severity: 'error',
  },
  '0161': {
    code: '0161',
    userMessage: 'Purchase invoice date must be on or after the original sale invoice date.',
    fieldPath: 'invoiceDate',
    severity: 'error',
  },
  '0162': {
    code: '0162',
    userMessage: 'Sale type cannot be empty or invalid (purchase invoice).',
    fieldPath: 'items[n].saleType',
    severity: 'error',
  },
  '0163': {
    code: '0163',
    userMessage: 'The selected sale type is not allowed for this manufacturer (purchase invoice).',
    fieldPath: 'items[n].saleType',
    severity: 'error',
  },
  '0164': {
    code: '0164',
    userMessage: 'For the provided HS Code, only KWH unit of measurement is allowed (purchase invoice).',
    fieldPath: 'items[n].uoM',
    severity: 'error',
  },
  '0165': {
    code: '0165',
    userMessage: 'Unit of measurement must be KG for this HS Code (purchase invoice).',
    fieldPath: 'items[n].uoM',
    severity: 'error',
  },
  '0166': {
    code: '0166',
    userMessage: 'Quantity / Electricity Unit cannot be empty (purchase invoice).',
    fieldPath: 'items[n].quantity',
    severity: 'error',
  },
  '0167': {
    code: '0167',
    userMessage: 'Value of Sales (excluding ST) cannot be empty or invalid (purchase invoice).',
    fieldPath: 'items[n].valueSalesExcludingST',
    severity: 'error',
  },
  '0168': {
    code: '0168',
    userMessage: 'Only cotton ginner purchase type is allowed for registered users (purchase invoice).',
    fieldPath: 'items[n].saleType',
    severity: 'error',
  },
  '0169': {
    code: '0169',
    userMessage: 'STWH is allowed only for Government/FTN Holders without a purchase invoice.',
    fieldPath: 'items[n].salesTaxWithheldAtSource',
    severity: 'error',
  },
  '0170': {
    code: '0170',
    userMessage: 'Rate 5% is not allowed when Value of Sales (excl. ST) exceeds Rs. 20,000 (purchase invoice).',
    fieldPath: 'items[n].rate',
    severity: 'error',
  },
  '0171': {
    code: '0171',
    userMessage: 'This seller is not an EFS license holder (purchase invoice).',
    fieldPath: '',
    severity: 'error',
  },
  '0172': {
    code: '0172',
    userMessage: 'Petroleum Levy rates are not configured properly (purchase invoice).',
    fieldPath: '',
    severity: 'error',
  },
  '0173': {
    code: '0173',
    userMessage: 'Invalid invoice number format. Must be alphanumeric with hyphens only (purchase invoice).',
    fieldPath: 'invoiceRefNo',
    severity: 'error',
  },
  '0174': {
    code: '0174',
    userMessage: 'Sales Tax cannot be empty (purchase invoice).',
    fieldPath: 'items[n].salesTaxApplicable',
    severity: 'error',
  },
  '0175': {
    code: '0175',
    userMessage: 'Fixed/notified value or Retail Price cannot be empty (purchase invoice).',
    fieldPath: 'items[n].fixedNotifiedValueOrRetailPrice',
    severity: 'error',
  },
  '0176': {
    code: '0176',
    userMessage: 'Sales Tax Withheld at Source cannot be empty (purchase invoice).',
    fieldPath: 'items[n].salesTaxWithheldAtSource',
    severity: 'error',
  },
  '0177': {
    code: '0177',
    userMessage: 'Further Tax cannot be empty (purchase invoice).',
    fieldPath: 'items[n].furtherTax',
    severity: 'error',
  },
};

/**
 * Look up a friendly error entry by code.
 * Returns a generic fallback if the code is not in the catalog.
 */
export function getErrorEntry(code: string): FBRErrorEntry {
  return FBR_ERROR_CODES[code] ?? {
    code,
    userMessage: `FBR validation error (code ${code}). Please review the invoice and contact support if this persists.`,
    fieldPath: '',
    severity: 'error',
  };
}
