// Drizzle ORM Schema — business_profiles
// 1:1 with users; stores business identity, personal details, and encrypted FBR token

import { pgTable, uuid, text, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
// Note: ntnCnic and cnic use text (not varchar) to accommodate AES-256-GCM encrypted values (~80+ chars)
import { user } from './auth';

export const businessProfiles = pgTable('business_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),

  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),

  // Business info
  businessName: varchar('business_name', { length: 255 }),
  ntnCnic: text('ntn_cnic'),       // Business NTN (7 digits) or CNIC (13 digits) — stored encrypted
  phone: varchar('phone', { length: 20 }),
  province: varchar('province', { length: 100 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  logoPath: text('logo_path'),                         // base64 data URL

  // Personal / record-keeping info
  fatherName: varchar('father_name', { length: 255 }),
  cnic: text('cnic'),               // Personal CNIC (13 digits) — stored encrypted
  dateOfBirth: varchar('date_of_birth', { length: 20 }),
  gender: varchar('gender', { length: 20 }),
  emergencyContact: varchar('emergency_contact', { length: 20 }),
  notes: text('notes'),                                // Admin internal notes

  // Subscription plan
  planSlug: varchar('plan_slug', { length: 50 }).notNull().default('standard'),
  planActivatedAt: timestamp('plan_activated_at', { withTimezone: true }),

  // Billing cycle — admin sets this to anchor the monthly invoice quota window
  // If null, falls back to 1st of current month
  billingCycleStart: timestamp('billing_cycle_start', { withTimezone: true }),

  // FBR environment per user: 'sandbox' or 'production'
  fbrEnvironment: varchar('fbr_environment', { length: 20 }).notNull().default('sandbox'),

  // FBR POSID (Point of Sale ID)
  fbrPosid: varchar('fbr_posid', { length: 50 }),

  // FBR token stored encrypted — never stored plain
  fbrTokenEncrypted: text('fbr_token_encrypted'),
  fbrTokenHint: varchar('fbr_token_hint', { length: 10 }),
  fbrTokenExpiresAt: timestamp('fbr_token_expires_at', { withTimezone: true }),
  fbrTokenUpdatedAt: timestamp('fbr_token_updated_at', { withTimezone: true }),

  // Invoice printing preferences
  invoiceNote: text('invoice_note'),                   // Default note shown at bottom of invoice
  invoiceNoteMode: varchar('invoice_note_mode', { length: 10 }).notNull().default('ask'),   // 'always'|'never'|'ask'

  // Payment details for invoice footer
  // { bankName: string, iban: string, accountTitle: string, branch: string }
  paymentDetails: jsonb('payment_details'),
  paymentDetailsMode: varchar('payment_details_mode', { length: 10 }).notNull().default('ask'), // 'always'|'never'|'ask'

  // Business credentials shown in invoice header
  // [{ type: string, value: string, includeInInvoice: boolean }]
  businessCredentials: jsonb('business_credentials'),

  // Which address appears on invoices: 'business' (address field) or 'fbr' (FBR registered address)
  invoiceAddressType: varchar('invoice_address_type', { length: 20 }).notNull().default('business'),

  // Email shown on invoices / business communications
  businessEmail: varchar('business_email', { length: 255 }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type BusinessProfile = typeof businessProfiles.$inferSelect;
export type NewBusinessProfile = typeof businessProfiles.$inferInsert;
