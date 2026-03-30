// FBR JSON Mapping Functions
// Convert internal schema to FBR Digital Invoicing API v1.12 format

import { InvoiceFormData, LineItem } from './validation';

// =============================================================================
// FBR API Types
// =============================================================================

export interface FBRLineItem {
  hsCode: string;
  productDescription: string;
  rate: string;
  uom: string;
  quantity: number;
  totalValues: number;
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
}

export interface FBRInvoicePayload {
  invoiceType: string;
  invoiceDate: string;
  sellerNTNCNIC: string;
  sellerBusinessName: string;
  sellerProvince: string;
  sellerAddress: string;
  buyerNTNCNIC: string;
  buyerBusinessName: string;
  buyerProvince: string;
  buyerAddress: string;
  buyerRegistrationType: string;
  invoiceRefNo?: string;
  scenarioId?: string; // For sandbox testing only
  items: FBRLineItem[];
}

// =============================================================================
// Mapping Functions
// =============================================================================

/**
 * Convert internal line item to FBR API format
 *
 * @param item - Internal line item format
 * @param lineNumber - Line number (1-based index)
 * @returns FBR-formatted line item
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mapLineItemToFBR(item: LineItem, _lineNumber: number): FBRLineItem {
  return {
    hsCode: item.hsCode,
    productDescription: item.productDescription,
    rate: item.rate,
    uom: item.uom,
    quantity: item.quantity,
    totalValues: item.totalValues,
    valueSalesExcludingST: item.valueSalesExcludingST,
    fixedNotifiedValueOrRetailPrice: item.fixedNotifiedValueOrRetailPrice || 0,
    salesTaxApplicable: item.salesTaxApplicable,
    salesTaxWithheldAtSource: item.salesTaxWithheldAtSource || 0,
    extraTax: item.extraTax || 0,
    furtherTax: item.furtherTax || 0,
    sroScheduleNo: item.sroScheduleNo || '',
    fedPayable: item.fedPayable || 0,
    discount: item.discount || 0,
    saleType: item.saleType,
    sroItemSerialNo: item.sroItemSerialNo || '',
  };
}

/**
 * Convert internal invoice data to FBR API format
 *
 * This function maps our internal schema to the exact format required by
 * FBR Digital Invoicing API v1.12 specification
 *
 * @param invoice - Internal invoice format
 * @param options - Optional sandbox configuration
 * @returns FBR-compliant JSON payload
 */
export function mapToFBRFormat(
  invoice: InvoiceFormData,
  options?: { sandbox?: boolean; scenarioId?: string }
): FBRInvoicePayload {
  const payload: FBRInvoicePayload = {
    // Header fields
    invoiceType: invoice.invoiceType,
    invoiceDate: invoice.invoiceDate, // Already in YYYY-MM-DD format

    // Seller information
    sellerNTNCNIC: invoice.sellerNTNCNIC,
    sellerBusinessName: invoice.sellerBusinessName,
    sellerProvince: invoice.sellerProvince,
    sellerAddress: invoice.sellerAddress,

    // Buyer information
    buyerNTNCNIC: invoice.buyerNTNCNIC || '', // Empty string if unregistered
    buyerBusinessName: invoice.buyerBusinessName,
    buyerProvince: invoice.buyerProvince,
    buyerAddress: invoice.buyerAddress,
    buyerRegistrationType: invoice.buyerRegistrationType,

    // Line items (sorted by index for consistent ordering)
    items: invoice.items.map((item, index) => mapLineItemToFBR(item, index + 1)),
  };

  // Add optional fields
  if (invoice.invoiceRefNo) {
    payload.invoiceRefNo = invoice.invoiceRefNo;
  }

  // Add sandbox scenario ID if testing
  if (options?.sandbox && options.scenarioId) {
    payload.scenarioId = options.scenarioId;
  }

  return payload;
}

// =============================================================================
// Validation Functions
// =============================================================================

/**
 * Validate FBR payload against specification
 *
 * Performs additional validation beyond Zod schemas to catch
 * FBR-specific business rules
 *
 * @param payload - FBR invoice payload
 * @returns Validation result with errors if any
 */
export function validateFBRPayload(payload: FBRInvoicePayload): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Header validation
  if (!['Sale Invoice', 'Debit Note'].includes(payload.invoiceType)) {
    errors.push('Invalid invoice type');
  }

  if (payload.invoiceType === 'Debit Note' && !payload.invoiceRefNo) {
    errors.push('Debit Note requires invoice reference number');
  }

  if (payload.invoiceRefNo && ![22, 28].includes(payload.invoiceRefNo.length)) {
    errors.push('Invoice reference must be 22 (NTN) or 28 (CNIC) digits');
  }

  // NTN/CNIC validation
  if (![7, 13].includes(payload.sellerNTNCNIC.length)) {
    errors.push('Seller NTN/CNIC must be 7 or 13 digits');
  }

  if (
    payload.buyerRegistrationType === 'Registered' &&
    ![7, 13].includes(payload.buyerNTNCNIC.length)
  ) {
    errors.push('Registered buyer requires NTN (7 digits) or CNIC (13 digits)');
  }

  // Items validation
  if (payload.items.length === 0) {
    errors.push('At least one line item is required');
  }

  if (payload.items.length > 100) {
    errors.push('Maximum 100 line items allowed');
  }

  // Validate each line item
  payload.items.forEach((item, index) => {
    if (item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Quantity must be positive`);
    }

    if (item.valueSalesExcludingST < 0) {
      errors.push(`Item ${index + 1}: Sales value cannot be negative`);
    }

    if (!item.rate.match(/^\d+%$/)) {
      errors.push(`Item ${index + 1}: Tax rate must be in format "18%"`);
    }

    if (!item.hsCode || item.hsCode.trim() === '') {
      errors.push(`Item ${index + 1}: HS Code is required`);
    }

    if (!item.productDescription || item.productDescription.trim() === '') {
      errors.push(`Item ${index + 1}: Product description is required`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Serialize FBR payload to JSON string
 *
 * Ensures consistent formatting for API submission
 *
 * @param payload - FBR invoice payload
 * @returns JSON string ready for API submission
 */
export function serializeFBRPayload(payload: FBRInvoicePayload): string {
  return JSON.stringify(payload, null, 0); // No whitespace for API submission
}

/**
 * Pretty-print FBR payload for debugging
 *
 * @param payload - FBR invoice payload
 * @returns Formatted JSON string for human reading
 */
export function prettyPrintFBRPayload(payload: FBRInvoicePayload): string {
  return JSON.stringify(payload, null, 2);
}
