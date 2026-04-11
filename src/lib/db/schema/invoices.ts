// Drizzle ORM Schema for Invoices
// FBR-compliant invoice and line item schema

import { pgTable, uuid, varchar, date, timestamp, jsonb, decimal, text, pgEnum, integer, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth';

// Note: user.id uses 'text' type, so foreign keys must match

// =============================================================================
// Enums
// =============================================================================

export const invoiceTypeEnum = pgEnum('invoice_type', ['Sale Invoice', 'Debit Note']);
export const buyerRegistrationTypeEnum = pgEnum('buyer_registration_type', ['Registered', 'Unregistered']);
export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'validating',
  'validated',
  'submitting',
  'issued',
  'failed',
]);

// =============================================================================
// Invoice Table
// =============================================================================

export const invoices = pgTable(
  'invoices',
  {
  // Primary key
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign keys
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  // Invoice header fields (FBR required)
  invoiceType: invoiceTypeEnum('invoice_type').notNull(),
  invoiceDate: date('invoice_date').notNull(), // YYYY-MM-DD format

  // Seller information
  sellerNTNCNIC: text('seller_ntn_cnic').notNull(), // NTN or CNIC — stored encrypted
  sellerBusinessName: varchar('seller_business_name', { length: 255 }).notNull(),
  sellerProvince: varchar('seller_province', { length: 100 }).notNull(),
  sellerAddress: text('seller_address').notNull(),

  // Buyer information
  buyerNTNCNIC: text('buyer_ntn_cnic'), // NTN or CNIC — stored encrypted, optional if unregistered
  buyerBusinessName: varchar('buyer_business_name', { length: 255 }).notNull(),
  buyerProvince: varchar('buyer_province', { length: 100 }).notNull(),
  buyerAddress: text('buyer_address').notNull(),
  buyerRegistrationType: buyerRegistrationTypeEnum('buyer_registration_type').notNull(),

  // Reference number (required for Debit Notes)
  invoiceRefNo: varchar('invoice_ref_no', { length: 28 }), // 22 digits (NTN) or 28 digits (CNIC)

  // Calculated totals (denormalized for performance)
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(), // Sum of line items excluding tax
  totalTax: decimal('total_tax', { precision: 15, scale: 2 }).notNull(), // Sum of all taxes
  grandTotal: decimal('grand_total', { precision: 15, scale: 2 }).notNull(), // Subtotal + Tax

  // FBR submission tracking
  fbrPayload: jsonb('fbr_payload'), // Complete FBR-formatted JSON for submission
  fbrInvoiceNumber: varchar('fbr_invoice_number', { length: 50 }), // Returned by FBR after submission
  fbrSubmissionId: uuid('fbr_submission_id'), // FK to fbr_submissions (set after first attempt)
  fbrSubmittedAt: timestamp('fbr_submitted_at'), // When submitted to FBR
  fbrResponseCode: varchar('fbr_response_code', { length: 10 }), // FBR API response code
  fbrResponseMessage: text('fbr_response_message'), // FBR API response message
  issuedAt: timestamp('issued_at'), // Set when invoice reaches 'issued' status

  // Status tracking (FBR lifecycle: draft → validating → validated → submitting → issued | failed)
  status: invoiceStatusEnum('status').notNull().default('draft'),

  // Sandbox flag — true if created while user's fbrEnvironment was 'sandbox'
  isSandbox: boolean('is_sandbox').notNull().default(false),

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by'), // User ID from auth system
  },
  (table) => [
    index('invoices_user_id_idx').on(table.userId),
    index('invoices_user_status_idx').on(table.userId, table.status),
  ]
);

// =============================================================================
// Line Items Table
// =============================================================================

export const lineItems = pgTable('line_items', {
  // Primary key
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign key
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),

  // Line item order
  lineNumber: integer('line_number').notNull(), // 1-based index for display order

  // Product information (FBR required)
  hsCode: varchar('hs_code', { length: 20 }).notNull(), // Harmonized System Code
  productDescription: text('product_description').notNull(),

  // Quantity and pricing (FBR required)
  quantity: decimal('quantity', { precision: 12, scale: 4 }).notNull(), // 4 decimal precision
  uom: varchar('uom', { length: 100 }).notNull(), // Unit of Measurement

  // Values (FBR required)
  valueSalesExcludingST: decimal('value_sales_excluding_st', { precision: 15, scale: 2 }).notNull(), // Base value
  fixedNotifiedValueOrRetailPrice: decimal('fixed_notified_value_or_retail_price', { precision: 15, scale: 2 }).notNull().default('0'),
  discount: decimal('discount', { precision: 15, scale: 2 }).default('0'), // Optional discount

  // Tax fields (FBR required)
  rate: varchar('rate', { length: 10 }).notNull(), // Tax rate (e.g., "18%")
  salesTaxApplicable: decimal('sales_tax_applicable', { precision: 15, scale: 2 }).notNull(),
  salesTaxWithheldAtSource: decimal('sales_tax_withheld_at_source', { precision: 15, scale: 2 }).notNull().default('0'),
  extraTax: decimal('extra_tax', { precision: 15, scale: 2 }).default('0'),
  furtherTax: decimal('further_tax', { precision: 15, scale: 2 }).default('0'),

  // Sale classification (FBR required)
  saleType: varchar('sale_type', { length: 100 }).notNull(), // e.g., "Goods at standard rate (default)"

  // Optional FBR fields
  sroScheduleNo: varchar('sro_schedule_no', { length: 50 }),
  fedPayable: decimal('fed_payable', { precision: 15, scale: 2 }).default('0'),
  sroItemSerialNo: varchar('sro_item_serial_no', { length: 50 }),

  // Calculated field (denormalized)
  totalValues: decimal('total_values', { precision: 15, scale: 2 }).notNull(), // valueSalesExcludingST + taxes

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// =============================================================================
// Invoice Drafts Table (Phase 2 - Server Sync)
// =============================================================================

export const invoiceDrafts = pgTable('invoice_drafts', {
  // Primary key
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign key
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  // Draft data (stored as JSON)
  draftData: jsonb('draft_data').notNull(), // Complete form state including line items

  // Metadata
  lastSaved: timestamp('last_saved').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by'), // User ID from auth system
});

// =============================================================================
// Relations
// =============================================================================

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(user, {
    fields: [invoices.userId],
    references: [user.id],
  }),
  lineItems: many(lineItems),
}));

export const lineItemsRelations = relations(lineItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [lineItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const invoiceDraftsRelations = relations(invoiceDrafts, ({ one }) => ({
  user: one(user, {
    fields: [invoiceDrafts.userId],
    references: [user.id],
  }),
}));

// =============================================================================
// Type Exports
// =============================================================================

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type LineItem = typeof lineItems.$inferSelect;
export type NewLineItem = typeof lineItems.$inferInsert;

export type InvoiceDraft = typeof invoiceDrafts.$inferSelect;
export type NewInvoiceDraft = typeof invoiceDrafts.$inferInsert;
