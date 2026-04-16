// Drizzle ORM Schema for FBR Integration Tables
// Tables: fbr_submissions, fbr_reference_cache, buyer_registry

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  uniqueIndex,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { invoices } from './invoices';
import { user } from './auth';

// =============================================================================
// Enums
// =============================================================================

export const fbrSubmissionStatusEnum = pgEnum('fbr_submission_status', [
  'validating',
  'validated',
  'submitting',
  'issued',
  'failed',
]);

export const fbrEnvironmentEnum = pgEnum('fbr_environment', [
  'sandbox',
  'production',
]);

export const fbrReferenceDataTypeEnum = pgEnum('fbr_reference_data_type', [
  'provinces',
  'hs_codes',
  'uom',
  'hs_uom',
  'tax_rates',
  'doc_types',
  'trans_types',
  'sro_schedule',
  'sro_items',
]);

export const statlStatusEnum = pgEnum('statl_status', [
  'active',
  'inactive',
  'unknown',
]);

// =============================================================================
// FBR Submissions Table
// =============================================================================

export const fbrSubmissions = pgTable(
  'fbr_submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Link to the invoice being submitted
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),

    // Submission status lifecycle
    status: fbrSubmissionStatusEnum('status').notNull().default('validating'),

    // FBR API request/response payloads (JSONB for full traceability)
    validateRequest: jsonb('validate_request'),
    validateResponse: jsonb('validate_response'),
    postRequest: jsonb('post_request'),
    postResponse: jsonb('post_response'),

    // FBR outcome
    fbrInvoiceNumber: varchar('fbr_invoice_number', { length: 50 }),
    fbrErrorCodes: jsonb('fbr_error_codes'), // Array of FBR error objects on failure

    // Submission context
    environment: fbrEnvironmentEnum('environment').notNull().default('sandbox'),
    scenarioId: varchar('scenario_id', { length: 10 }), // e.g. "SN001" — sandbox only

    // Timestamps
    attemptedAt: timestamp('attempted_at').notNull().defaultNow(),
    issuedAt: timestamp('issued_at'), // Set when status = 'issued'
  },
  (table) => [
    index('fbr_submissions_invoice_id_idx').on(table.invoiceId),
  ]
);

// =============================================================================
// FBR Reference Data Cache Table
// =============================================================================

export const fbrReferenceCache = pgTable('fbr_reference_cache', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Cache key uniquely identifies this cached entry (e.g. 'provinces', 'hs_uom:8517.6200')
  cacheKey: varchar('cache_key', { length: 255 }).notNull().unique(),

  // Type of reference data
  dataType: fbrReferenceDataTypeEnum('data_type').notNull(),

  // The cached payload (FBR API response body)
  payload: jsonb('payload').notNull(),

  // ETag for conditional requests (optional FBR support)
  etag: varchar('etag', { length: 255 }),

  // TTL tracking
  fetchedAt: timestamp('fetched_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
});

// =============================================================================
// Buyer Registry Table
// =============================================================================

export const buyerRegistry = pgTable(
  'buyer_registry',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Scoped to user (FK to user.id for tenant isolation)
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    // Buyer identity
    ntnCnic: text('ntn_cnic').notNull(), // 7 digits (NTN) or 13 digits (CNIC)
    businessName: varchar('business_name', { length: 255 }).notNull(),

    // Address details
    province: varchar('province', { length: 100 }),
    address: text('address'),

    // Registration type from FBR Get_Reg_Type
    registrationType: varchar('registration_type', { length: 50 }), // 'Registered' | 'Unregistered'

    // STATL NTN verification result
    statlStatus: statlStatusEnum('statl_status').default('unknown'),
    statlStatusCode: varchar('statl_status_code', { length: 10 }), // Raw code from STATL response
    statlCheckedAt: timestamp('statl_checked_at'), // When STATL was last called

    // Usage tracking for autocomplete ranking
    lastUsedAt: timestamp('last_used_at').notNull().defaultNow(),
    useCount: integer('use_count').notNull().default(1),

    // Metadata
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    // Unique buyer per user (prevent duplicates)
    uniqueIndex('buyer_registry_user_ntn_idx').on(
      table.userId,
      table.ntnCnic
    ),
  ]
);

// =============================================================================
// Relations
// =============================================================================

export const fbrSubmissionsRelations = relations(fbrSubmissions, ({ one }) => ({
  invoice: one(invoices, {
    fields: [fbrSubmissions.invoiceId],
    references: [invoices.id],
  }),
}));

// =============================================================================
// Type Exports
// =============================================================================

export type FBRSubmission = typeof fbrSubmissions.$inferSelect;
export type NewFBRSubmission = typeof fbrSubmissions.$inferInsert;

export type FBRReferenceCache = typeof fbrReferenceCache.$inferSelect;
export type NewFBRReferenceCache = typeof fbrReferenceCache.$inferInsert;

export type BuyerRegistry = typeof buyerRegistry.$inferSelect;
export type NewBuyerRegistry = typeof buyerRegistry.$inferInsert;
