// Pure Calculation Functions for Invoice Totals
// Optimized for performance with memoization in React components

import { LineItem } from './validation';

// =============================================================================
// Types
// =============================================================================

export interface LineItemCalculation {
  subtotal: number;
  salesTax: number;
  lineTotal: number;
}

export interface InvoiceCalculations {
  lineItemTotals: LineItemCalculation[];
  subtotal: number;
  totalTax: number;
  totalExtraTax: number;
  totalFurtherTax: number;
  grandTotal: number;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Parse tax rate from string format (e.g., "18%" -> 18)
 * @throws Error if format is invalid
 */
export function parseTaxRate(rate: string): number {
  const match = rate.match(/^(\d+)%$/);
  if (!match) {
    throw new Error(`Invalid tax rate format: ${rate}`);
  }
  return parseInt(match[1], 10);
}

/**
 * Round number to specified decimal places
 * Uses standard rounding (0.5 rounds up)
 */
function roundToDecimals(value: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

// =============================================================================
// Line Item Calculations
// =============================================================================

/**
 * Calculate totals for a single line item
 *
 * Formula:
 * - Subtotal = (quantity × unitPrice) - discount
 * - Sales Tax = subtotal × (taxRate / 100)
 * - Line Total = subtotal + salesTax + extraTax + furtherTax
 *
 * @param item - Line item data
 * @returns Calculated subtotal, sales tax, and line total
 */
export function calculateLineItem(item: LineItem): LineItemCalculation {
  // Base calculation: quantity * price - discount
  const subtotal = item.quantity * item.valueSalesExcludingST - (item.discount || 0);

  // Sales tax calculation based on rate
  const taxRate = parseTaxRate(item.rate);
  const salesTax = subtotal * (taxRate / 100);

  // Line total: subtotal + all taxes
  const lineTotal = subtotal + salesTax + (item.extraTax || 0) + (item.furtherTax || 0);

  return {
    subtotal: roundToDecimals(subtotal, 2),
    salesTax: roundToDecimals(salesTax, 2),
    lineTotal: roundToDecimals(lineTotal, 2),
  };
}

// =============================================================================
// Invoice Calculations
// =============================================================================

/**
 * Calculate invoice totals from all line items
 *
 * This is a pure function suitable for memoization with React.useMemo
 * Performance: ~10-30ms for 100 items (tested in research.md)
 *
 * @param items - Array of line items
 * @returns Complete invoice calculations including per-item and totals
 */
export function calculateInvoiceTotals(items: LineItem[]): InvoiceCalculations {
  // Calculate each line item
  const lineItemTotals = items.map((item) => calculateLineItem(item));

  // Sum all subtotals (excluding all taxes)
  const subtotal = lineItemTotals.reduce((sum, item) => sum + item.subtotal, 0);

  // Sum all sales tax
  const totalTax = lineItemTotals.reduce((sum, item) => sum + item.salesTax, 0);

  // Sum all extra tax
  const totalExtraTax = items.reduce((sum, item) => sum + (item.extraTax || 0), 0);

  // Sum all further tax
  const totalFurtherTax = items.reduce((sum, item) => sum + (item.furtherTax || 0), 0);

  // Grand total = subtotal + all taxes
  const grandTotal = subtotal + totalTax + totalExtraTax + totalFurtherTax;

  return {
    lineItemTotals,
    subtotal: roundToDecimals(subtotal, 2),
    totalTax: roundToDecimals(totalTax, 2),
    totalExtraTax: roundToDecimals(totalExtraTax, 2),
    totalFurtherTax: roundToDecimals(totalFurtherTax, 2),
    grandTotal: roundToDecimals(grandTotal, 2),
  };
}

/**
 * Calculate line item total value (for FBR field: totalValues)
 * This is the complete value including all taxes
 *
 * @param item - Line item data
 * @returns Total value for this line item
 */
export function calculateLineItemTotalValue(item: LineItem): number {
  const { lineTotal } = calculateLineItem(item);
  return lineTotal;
}

/**
 * Validate that calculated totals match expected precision
 * FBR requirements: 4 decimal places for quantities, 2 for amounts
 *
 * @param calculations - Invoice calculations to validate
 * @returns true if precision requirements are met
 */
export function validateCalculationPrecision(calculations: InvoiceCalculations): boolean {
  const values = [
    calculations.subtotal,
    calculations.totalTax,
    calculations.totalExtraTax,
    calculations.totalFurtherTax,
    calculations.grandTotal,
  ];

  // Check all amounts have max 2 decimal places
  return values.every((value) => {
    const decimalPlaces = (value.toString().split('.')[1] || '').length;
    return decimalPlaces <= 2;
  });
}
