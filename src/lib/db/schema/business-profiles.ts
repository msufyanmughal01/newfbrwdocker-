// Drizzle ORM Schema — business_profiles
// 1:1 with users; stores business identity, personal details, and encrypted FBR token

import { pgTable, uuid, text, varchar, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const businessProfiles = pgTable('business_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),

  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),

  // Business info
  businessName: varchar('business_name', { length: 255 }),
  ntnCnic: varchar('ntn_cnic', { length: 13 }),       // Business NTN (7 digits) or CNIC (13 digits)
  phone: varchar('phone', { length: 20 }),
  province: varchar('province', { length: 100 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  logoPath: text('logo_path'),                         // base64 data URL

  // Personal / record-keeping info
  fatherName: varchar('father_name', { length: 255 }),
  cnic: varchar('cnic', { length: 13 }),               // Personal CNIC (13 digits)
  dateOfBirth: varchar('date_of_birth', { length: 20 }),
  gender: varchar('gender', { length: 20 }),
  emergencyContact: varchar('emergency_contact', { length: 20 }),
  notes: text('notes'),                                // Admin internal notes

  // FBR token stored encrypted — never stored plain
  fbrTokenEncrypted: text('fbr_token_encrypted'),
  fbrTokenHint: varchar('fbr_token_hint', { length: 10 }),
  fbrTokenExpiresAt: timestamp('fbr_token_expires_at', { withTimezone: true }),
  fbrTokenUpdatedAt: timestamp('fbr_token_updated_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type BusinessProfile = typeof businessProfiles.$inferSelect;
export type NewBusinessProfile = typeof businessProfiles.$inferInsert;
