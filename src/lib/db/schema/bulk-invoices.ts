// Drizzle ORM Schema — bulk invoice batches
// Tracks uploaded bulk invoice batches for Excel/CSV bulk submission

import { pgTable, uuid, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const bulkInvoiceBatches = pgTable('bulk_invoice_batches', {
  id: uuid('id').primaryKey().defaultRandom(),

  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  fileName: text('file_name').notNull(),
  totalRows: integer('total_rows').notNull().default(0),
  validRows: integer('valid_rows').notNull().default(0),
  invalidRows: integer('invalid_rows').notNull().default(0),
  submittedRows: integer('submitted_rows').notNull().default(0),
  failedRows: integer('failed_rows').notNull().default(0),

  // Status: pending | validating | ready | submitting | done | failed
  status: text('status').notNull().default('pending'),

  // JSON array of parsed invoice rows with validation results
  rows: jsonb('rows').notNull().default('[]'),

  // Summary of submission errors
  errors: jsonb('errors').notNull().default('[]'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type BulkInvoiceBatch = typeof bulkInvoiceBatches.$inferSelect;
export type NewBulkInvoiceBatch = typeof bulkInvoiceBatches.$inferInsert;
