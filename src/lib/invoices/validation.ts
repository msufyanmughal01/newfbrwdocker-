// Zod Validation Schemas for Invoice Creation
// Single source of truth for validation - used on both client and server

import { z } from 'zod';

// =============================================================================
// Base Schemas
// =============================================================================

/**
 * NTN validation (National Tax Number - 7 digits)
 */
export const ntnSchema = z.string().regex(/^\d{7}$/, {
  message: 'NTN must be exactly 7 digits',
});

/**
 * CNIC validation (Computerized National Identity Card - 13 digits)
 */
export const cnicSchema = z.string().regex(/^\d{13}$/, {
  message: 'CNIC must be exactly 13 digits',
});

/**
 * NTN or CNIC validation (union type)
 */
export const ntnOrCnicSchema = z.union([ntnSchema, cnicSchema], {
  message: 'Must be a valid NTN (7 digits) or CNIC (13 digits)',
});

/**
 * Optional NTN/CNIC for unregistered buyers
 */
export const optionalNtnOrCnicSchema = z.union([
  ntnOrCnicSchema,
  z.literal(''),
]);

/**
 * Date validation (YYYY-MM-DD format)
 */
export const invoiceDateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in format YYYY-MM-DD',
  })
  .refine(
    (date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    },
    { message: 'Invalid date' }
  );

/**
 * Tax rate validation (format: "18%")
 */
export const taxRateSchema = z.string().regex(/^\d+%$/, {
  message: 'Tax rate must be in format "18%"',
});

/**
 * Invoice reference number validation (for Debit Notes)
 * 22 digits (NTN-based) or 28 digits (CNIC-based)
 */
export const invoiceRefSchema = z.string().regex(/^\d{22}$|^\d{28}$/, {
  message: 'Invoice reference must be 22 digits (NTN-based) or 28 digits (CNIC-based)',
});

/**
 * Province validation
 */
export const provinceSchema = z.enum([
  'Punjab',
  'Sindh',
  'Khyber Pakhtunkhwa',
  'Balochistan',
  'Islamabad Capital Territory',
  'Gilgit-Baltistan',
  'Azad Jammu and Kashmir',
], {
  message: 'Invalid province',
});

// =============================================================================
// Line Item Schema
// =============================================================================

export const lineItemSchema = z.object({
  // Product identification
  hsCode: z.string()
    .min(1, 'HS Code is required')
    .max(20, 'HS Code cannot exceed 20 characters'),

  productDescription: z.string()
    .min(1, 'Product description is required')
    .max(500, 'Product description cannot exceed 500 characters'),

  // Quantity and measurement
  quantity: z.number()
    .positive('Quantity must be positive')
    .refine(
      (val) => {
        const decimalPlaces = (val.toString().split('.')[1] || '').length;
        return decimalPlaces <= 4;
      },
      { message: 'Quantity supports up to 4 decimal places' }
    ),

  uom: z.string()
    .min(1, 'Unit of measurement is required')
    .max(100, 'UOM cannot exceed 100 characters'),

  // Pricing
  valueSalesExcludingST: z.number()
    .nonnegative('Sales value cannot be negative')
    .refine(
      (val) => {
        const decimalPlaces = (val.toString().split('.')[1] || '').length;
        return decimalPlaces <= 2;
      },
      { message: 'Amount supports up to 2 decimal places' }
    ),

  fixedNotifiedValueOrRetailPrice: z.number()
    .nonnegative('Fixed value cannot be negative')
    .default(0),

  discount: z.number()
    .nonnegative('Discount cannot be negative')
    .default(0),

  // Tax fields
  rate: taxRateSchema,

  salesTaxApplicable: z.number()
    .nonnegative('Sales tax cannot be negative'),

  salesTaxWithheldAtSource: z.number()
    .nonnegative('Withheld tax cannot be negative')
    .default(0),

  extraTax: z.number()
    .nonnegative('Extra tax cannot be negative')
    .default(0),

  furtherTax: z.number()
    .nonnegative('Further tax cannot be negative')
    .default(0),

  // Classification
  saleType: z.string()
    .min(1, 'Sale type is required'),

  // Optional FBR fields
  sroScheduleNo: z.string()
    .max(50, 'SRO Schedule cannot exceed 50 characters')
    .default(''),

  fedPayable: z.number()
    .nonnegative('FED payable cannot be negative')
    .default(0),

  sroItemSerialNo: z.string()
    .max(50, 'SRO Item Serial cannot exceed 50 characters')
    .default(''),

  // Calculated field
  totalValues: z.number()
    .nonnegative('Total value cannot be negative'),
});

export type LineItem = z.infer<typeof lineItemSchema>;

// =============================================================================
// Invoice Schema
// =============================================================================

// Base schema without refinements (can be used with .partial())
const invoiceBaseSchema = z.object({
  // Invoice header
  invoiceType: z.enum(['Sale Invoice', 'Debit Note'], {
    message: 'Invoice type must be "Sale Invoice" or "Debit Note"',
  }),

  invoiceDate: invoiceDateSchema,

  // Seller information
  sellerNTNCNIC: ntnOrCnicSchema,
  sellerBusinessName: z.string()
    .min(1, 'Seller business name is required')
    .max(255, 'Seller name cannot exceed 255 characters'),
  sellerProvince: provinceSchema,
  sellerAddress: z.string()
    .min(1, 'Seller address is required')
    .max(1000, 'Seller address cannot exceed 1000 characters'),

  // Buyer information
  buyerNTNCNIC: optionalNtnOrCnicSchema,
  buyerBusinessName: z.string()
    .min(1, 'Buyer business name is required')
    .max(255, 'Buyer name cannot exceed 255 characters'),
  buyerProvince: provinceSchema,
  buyerAddress: z.string()
    .min(1, 'Buyer address is required')
    .max(1000, 'Buyer address cannot exceed 1000 characters'),
  buyerRegistrationType: z.enum(['Registered', 'Unregistered']),

  // Invoice reference (for Debit Notes)
  invoiceRefNo: z.string().optional(),

  // Line items
  items: z.array(lineItemSchema)
    .min(1, 'At least one line item is required')
    .max(100, 'Maximum 100 line items allowed'),
});

// Full schema with cross-field validations (refinements)
export const invoiceSchema = invoiceBaseSchema
  // Cross-field validation: Debit Note requirements
  .refine(
    (data) => {
      if (data.invoiceType === 'Debit Note') {
        return !!data.invoiceRefNo && /^\d{22}$|^\d{28}$/.test(data.invoiceRefNo);
      }
      return true;
    },
    {
      message: 'Debit Note requires invoice reference (22 or 28 digits)',
      path: ['invoiceRefNo'],
    }
  )
  // Cross-field validation: Registered buyer requires NTN/CNIC
  .refine(
    (data) => {
      if (data.buyerRegistrationType === 'Registered') {
        return data.buyerNTNCNIC && data.buyerNTNCNIC.length > 0;
      }
      return true;
    },
    {
      message: 'Registered buyer requires NTN or CNIC',
      path: ['buyerNTNCNIC'],
    }
  )
  // Cross-field validation: NTN/CNIC format for registered buyers
  .refine(
    (data) => {
      if (data.buyerRegistrationType === 'Registered' && data.buyerNTNCNIC) {
        return /^\d{7}$|^\d{13}$/.test(data.buyerNTNCNIC);
      }
      return true;
    },
    {
      message: 'Buyer NTN/CNIC must be 7 or 13 digits for registered buyers',
      path: ['buyerNTNCNIC'],
    }
  );

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

// =============================================================================
// Draft Schema (Partial Invoice for Saving)
// =============================================================================

export const draftSchema = z.object({
  id: z.string().uuid(),
  draftData: invoiceBaseSchema.partial(), // Use base schema without refinements
  lastSaved: z.number(), // Unix timestamp
  organizationId: z.string().uuid(),
});

export type InvoiceDraft = z.infer<typeof draftSchema>;
