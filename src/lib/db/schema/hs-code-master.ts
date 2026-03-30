// Drizzle ORM Schema — hs_code_master
// User-curated list of frequently used HS codes for instant invoice access

import { pgTable, uuid, text, varchar, boolean, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth';

export const hsCodes = pgTable(
  'hs_code_master',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    hsCode: varchar('hs_code', { length: 20 }).notNull(),
    description: text('description').notNull(),
    uom: varchar('uom', { length: 100 }),

    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('hs_code_master_user_id_idx').on(table.userId),
  ]
);

export const hsCodesToRelations = relations(hsCodes, ({ one }) => ({
  user: one(user, {
    fields: [hsCodes.userId],
    references: [user.id],
  }),
}));

export type HSCode = typeof hsCodes.$inferSelect;
export type NewHSCode = typeof hsCodes.$inferInsert;
