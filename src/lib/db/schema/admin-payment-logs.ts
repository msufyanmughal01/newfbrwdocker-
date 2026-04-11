// Drizzle ORM Schema — admin_payment_logs
// Records manual payment confirmations logged by admin when users upgrade their plan

import { pgTable, uuid, text, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const adminPaymentLogs = pgTable('admin_payment_logs', {
  id: uuid('id').primaryKey().defaultRandom(),

  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),

  paidAt: timestamp('paid_at', { withTimezone: true }).notNull(),
  amount: integer('amount').notNull(),            // PKR amount
  planSlug: varchar('plan_slug', { length: 50 }).notNull(),
  durationMonths: integer('duration_months').notNull().default(1),
  notes: text('notes'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type AdminPaymentLog = typeof adminPaymentLogs.$inferSelect;
export type NewAdminPaymentLog = typeof adminPaymentLogs.$inferInsert;
