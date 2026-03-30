// Drizzle ORM Schema — clients
// User-managed client (buyer) registry; 1:N with users; soft-delete only

import { pgTable, uuid, text, varchar, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const clients = pgTable(
  'clients',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    businessName: varchar('business_name', { length: 255 }).notNull(),
    ntnCnic: varchar('ntn_cnic', { length: 13 }),
    province: varchar('province', { length: 100 }),
    address: text('address'),
    registrationType: varchar('registration_type', { length: 50 }), // 'Registered' | 'Unregistered'
    notes: text('notes'),

    // Soft delete — Constitution: no hard deletes on user data
    isDeleted: boolean('is_deleted').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('clients_user_business_name_idx').on(table.userId, table.businessName),
    index('clients_user_deleted_idx').on(table.userId, table.isDeleted),
  ]
);

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
