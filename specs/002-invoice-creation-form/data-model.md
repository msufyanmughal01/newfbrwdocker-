# Data Model: Invoice Creation Form

**Branch**: `002-invoice-creation-form` | **Date**: 2026-02-14 | **Spec**: [spec.md](./spec.md)

## Purpose

This document defines the database schemas for invoices, line items, and drafts using Drizzle ORM, including FBR JSON mapping functions and field constraints.

## Table of Contents

1. [Database Schema Overview](#database-schema-overview)
2. [Invoice Schema](#invoice-schema)
3. [Line Item Schema](#line-item-schema)
4. [Invoice Draft Schema](#invoice-draft-schema)
5. [FBR JSON Mapping](#fbr-json-mapping)
6. [Relationships and Constraints](#relationships-and-constraints)
7. [Migration Strategy](#migration-strategy)

---

## Database Schema Overview

**ORM**: Drizzle ORM 0.45
**Database**: PostgreSQL (Neon serverless)
**Schema Location**: `src/lib/db/schema/invoices.ts`

### Entity Relationship Diagram

```
┌─────────────────┐
│  Organization   │
│  (existing)     │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐       ┌──────────────────┐
│    Invoice      │◄──────┤   LineItem       │
│                 │  1:N  │                  │
│  - id           │       │  - id            │
│  - type         │       │  - invoiceId     │
│  - date         │       │  - hsCode        │
│  - seller*      │       │  - description   │
│  - buyer*       │       │  - quantity      │
│  - refNo        │       │  - rate          │
│  - totals       │       │  - amounts       │
│  - fbrPayload   │       │                  │
│  - status       │       └──────────────────┘
│  - timestamps   │
└─────────────────┘
         ▲
         │
         │ 1:1 (optional)
         │
┌────────┴────────┐
│  InvoiceDraft   │
│                 │
│  - id           │
│  - draftData    │
│  - lastSaved    │
└─────────────────┘
```

---

## Invoice Schema

### Table: `invoices`

**Purpose**: Stores FBR-compliant invoices (Sale Invoices and Debit Notes)

```typescript
// src/lib/db/schema/invoices.ts
import { pgTable, uuid, varchar, date, timestamp, jsonb, decimal, text, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './auth';

// Enums
export const invoiceTypeEnum = pgEnum('invoice_type', ['Sale Invoice', 'Debit Note']);
export const buyerRegistrationTypeEnum = pgEnum('buyer_registration_type', ['Registered', 'Unregistered']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'submitted', 'accepted', 'rejected']);

// Invoice table
export const invoices = pgTable('invoices', {
  // Primary key
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign keys
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Invoice header fields (FBR required)
  invoiceType: invoiceTypeEnum('invoice_type').notNull(),
  invoiceDate: date('invoice_date').notNull(), // YYYY-MM-DD format

  // Seller information
  sellerNTNCNIC: varchar('seller_ntn_cnic', { length: 13 }).notNull(), // 7 digits (NTN) or 13 digits (CNIC)
  sellerBusinessName: varchar('seller_business_name', { length: 255 }).notNull(),
  sellerProvince: varchar('seller_province', { length: 100 }).notNull(),
  sellerAddress: text('seller_address').notNull(),

  // Buyer information
  buyerNTNCNIC: varchar('buyer_ntn_cnic', { length: 13 }), // Optional if unregistered
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
  fbrSubmittedAt: timestamp('fbr_submitted_at'), // When submitted to FBR
  fbrResponseCode: varchar('fbr_response_code', { length: 10 }), // FBR API response code
  fbrResponseMessage: text('fbr_response_message'), // FBR API response message

  // Status tracking
  status: invoiceStatusEnum('status').notNull().default('draft'),

  // Metadata
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by'), // User ID from auth system
});

// Indexes for query performance
export const invoicesIndexes = {
  organizationIdIdx: 'idx_invoices_organization_id',
  invoiceDateIdx: 'idx_invoices_invoice_date',
  statusIdx: 'idx_invoices_status',
  fbrInvoiceNumberIdx: 'idx_invoices_fbr_invoice_number',
};
```

### Field Constraints

| Field | Type | Constraints | FBR Mapping |
|-------|------|-------------|-------------|
| `invoiceType` | enum | Required, 'Sale Invoice' or 'Debit Note' | `invoiceType` |
| `invoiceDate` | date | Required, format: YYYY-MM-DD | `invoiceDate` |
| `sellerNTNCNIC` | varchar(13) | Required, 7 or 13 digits | `sellerNTNCNIC` |
| `sellerBusinessName` | varchar(255) | Required, min 1 char | `sellerBusinessName` |
| `sellerProvince` | varchar(100) | Required, valid province | `sellerProvince` |
| `sellerAddress` | text | Required, min 1 char | `sellerAddress` |
| `buyerNTNCNIC` | varchar(13) | Optional if unregistered, 7 or 13 digits | `buyerNTNCNIC` |
| `buyerBusinessName` | varchar(255) | Required, min 1 char | `buyerBusinessName` |
| `buyerProvince` | varchar(100) | Required, valid province | `buyerProvince` |
| `buyerAddress` | text | Required, min 1 char | `buyerAddress` |
| `buyerRegistrationType` | enum | Required, 'Registered' or 'Unregistered' | `buyerRegistrationType` |
| `invoiceRefNo` | varchar(28) | Required for Debit Notes, 22 or 28 digits | `invoiceRefNo` |
| `subtotal` | decimal(15,2) | Required, non-negative | Calculated from items |
| `totalTax` | decimal(15,2) | Required, non-negative | Calculated from items |
| `grandTotal` | decimal(15,2) | Required, non-negative | Calculated from items |

---

## Line Item Schema

### Table: `line_items`

**Purpose**: Stores individual products/services within an invoice

```typescript
// src/lib/db/schema/invoices.ts (continued)
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

// Indexes
export const lineItemsIndexes = {
  invoiceIdIdx: 'idx_line_items_invoice_id',
  invoiceIdLineNumberIdx: 'idx_line_items_invoice_id_line_number',
};
```

### Field Constraints

| Field | Type | Constraints | FBR Mapping |
|-------|------|-------------|-------------|
| `invoiceId` | uuid | Required, foreign key | N/A (internal) |
| `lineNumber` | integer | Required, > 0 | N/A (display order) |
| `hsCode` | varchar(20) | Required | `hsCode` |
| `productDescription` | text | Required, min 1 char | `productDescription` |
| `quantity` | decimal(12,4) | Required, > 0, 4 decimals | `quantity` |
| `uom` | varchar(100) | Required | `uom` |
| `valueSalesExcludingST` | decimal(15,2) | Required, >= 0 | `valueSalesExcludingST` |
| `rate` | varchar(10) | Required, format: "N%" | `rate` |
| `salesTaxApplicable` | decimal(15,2) | Required, >= 0 | `salesTaxApplicable` |
| `saleType` | varchar(100) | Required | `saleType` |
| `totalValues` | decimal(15,2) | Required, >= 0 | `totalValues` |

---

## Invoice Draft Schema

### Table: `invoice_drafts`

**Purpose**: Stores incomplete invoices for later resumption (Phase 2 - server-side)

**Note**: Phase 1 uses IndexedDB client-side. This schema is for Phase 2 server migration.

```typescript
// src/lib/db/schema/invoices.ts (continued)
export const invoiceDrafts = pgTable('invoice_drafts', {
  // Primary key
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign key
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Draft data (stored as JSON)
  draftData: jsonb('draft_data').notNull(), // Complete form state including line items

  // Metadata
  lastSaved: timestamp('last_saved').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  createdBy: uuid('created_by'), // User ID from auth system
});

// Indexes
export const invoiceDraftsIndexes = {
  organizationIdIdx: 'idx_invoice_drafts_organization_id',
  createdByIdx: 'idx_invoice_drafts_created_by',
  lastSavedIdx: 'idx_invoice_drafts_last_saved',
};
```

### Draft Data Structure

The `draftData` JSONB field stores the complete form state:

```typescript
interface DraftData {
  // Invoice header
  invoiceType: 'Sale Invoice' | 'Debit Note';
  invoiceDate: string; // YYYY-MM-DD
  sellerNTNCNIC: string;
  sellerBusinessName: string;
  sellerProvince: string;
  sellerAddress: string;
  buyerNTNCNIC: string;
  buyerBusinessName: string;
  buyerProvince: string;
  buyerAddress: string;
  buyerRegistrationType: 'Registered' | 'Unregistered';
  invoiceRefNo?: string;

  // Line items
  items: Array<{
    hsCode: string;
    productDescription: string;
    rate: string;
    uom: string;
    quantity: number;
    valueSalesExcludingST: number;
    fixedNotifiedValueOrRetailPrice: number;
    discount: number;
    salesTaxApplicable: number;
    salesTaxWithheldAtSource: number;
    extraTax: number;
    furtherTax: number;
    saleType: string;
    sroScheduleNo?: string;
    fedPayable: number;
    sroItemSerialNo?: string;
    totalValues: number;
  }>;
}
```

---

## FBR JSON Mapping

### Mapping Function: Internal Schema → FBR API Format

**Purpose**: Convert database records to FBR Digital Invoicing API v1.12 format

**Location**: `src/lib/invoices/fbr-mapping.ts`

```typescript
// src/lib/invoices/fbr-mapping.ts
import { Invoice, LineItem } from '@/lib/db/schema/invoices';

export interface FBRInvoicePayload {
  invoiceType: string;
  invoiceDate: string;
  sellerNTNCNIC: string;
  sellerBusinessName: string;
  sellerProvince: string;
  sellerAddress: string;
  buyerNTNCNIC: string;
  buyerBusinessName: string;
  buyerProvince: string;
  buyerAddress: string;
  buyerRegistrationType: string;
  invoiceRefNo?: string;
  scenarioId?: string; // For sandbox testing only
  items: Array<{
    hsCode: string;
    productDescription: string;
    rate: string;
    uom: string;
    quantity: number;
    totalValues: number;
    valueSalesExcludingST: number;
    fixedNotifiedValueOrRetailPrice: number;
    salesTaxApplicable: number;
    salesTaxWithheldAtSource: number;
    extraTax: number;
    furtherTax: number;
    sroScheduleNo: string;
    fedPayable: number;
    discount: number;
    saleType: string;
    sroItemSerialNo: string;
  }>;
}

/**
 * Convert internal invoice data to FBR API format
 * @param invoice - Invoice record from database
 * @param lineItems - Line items associated with invoice
 * @param options - Optional sandbox configuration
 * @returns FBR-compliant JSON payload
 */
export function mapToFBRFormat(
  invoice: Invoice,
  lineItems: LineItem[],
  options?: { sandbox?: boolean; scenarioId?: string }
): FBRInvoicePayload {
  const payload: FBRInvoicePayload = {
    // Header fields
    invoiceType: invoice.invoiceType,
    invoiceDate: invoice.invoiceDate, // Already in YYYY-MM-DD format
    sellerNTNCNIC: invoice.sellerNTNCNIC,
    sellerBusinessName: invoice.sellerBusinessName,
    sellerProvince: invoice.sellerProvince,
    sellerAddress: invoice.sellerAddress,
    buyerNTNCNIC: invoice.buyerNTNCNIC || '', // Empty string if unregistered
    buyerBusinessName: invoice.buyerBusinessName,
    buyerProvince: invoice.buyerProvince,
    buyerAddress: invoice.buyerAddress,
    buyerRegistrationType: invoice.buyerRegistrationType,

    // Optional fields
    ...(invoice.invoiceRefNo && { invoiceRefNo: invoice.invoiceRefNo }),
    ...(options?.sandbox && options.scenarioId && { scenarioId: options.scenarioId }),

    // Line items (sorted by line number)
    items: lineItems
      .sort((a, b) => a.lineNumber - b.lineNumber)
      .map((item) => ({
        hsCode: item.hsCode,
        productDescription: item.productDescription,
        rate: item.rate,
        uom: item.uom,
        quantity: parseFloat(item.quantity), // Convert decimal to number
        totalValues: parseFloat(item.totalValues),
        valueSalesExcludingST: parseFloat(item.valueSalesExcludingST),
        fixedNotifiedValueOrRetailPrice: parseFloat(item.fixedNotifiedValueOrRetailPrice),
        salesTaxApplicable: parseFloat(item.salesTaxApplicable),
        salesTaxWithheldAtSource: parseFloat(item.salesTaxWithheldAtSource),
        extraTax: parseFloat(item.extraTax || '0'),
        furtherTax: parseFloat(item.furtherTax || '0'),
        sroScheduleNo: item.sroScheduleNo || '',
        fedPayable: parseFloat(item.fedPayable || '0'),
        discount: parseFloat(item.discount || '0'),
        saleType: item.saleType,
        sroItemSerialNo: item.sroItemSerialNo || '',
      })),
  };

  return payload;
}

/**
 * Validate FBR payload against specification
 * @param payload - FBR invoice payload
 * @returns Validation result with errors if any
 */
export function validateFBRPayload(payload: FBRInvoicePayload): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Header validation
  if (!['Sale Invoice', 'Debit Note'].includes(payload.invoiceType)) {
    errors.push('Invalid invoice type');
  }

  if (payload.invoiceType === 'Debit Note' && !payload.invoiceRefNo) {
    errors.push('Debit Note requires invoice reference number');
  }

  if (payload.invoiceRefNo && ![22, 28].includes(payload.invoiceRefNo.length)) {
    errors.push('Invoice reference must be 22 (NTN) or 28 (CNIC) digits');
  }

  // NTN/CNIC validation
  if (![7, 13].includes(payload.sellerNTNCNIC.length)) {
    errors.push('Seller NTN/CNIC must be 7 or 13 digits');
  }

  if (payload.buyerRegistrationType === 'Registered' &&
      ![7, 13].includes(payload.buyerNTNCNIC.length)) {
    errors.push('Registered buyer requires NTN (7 digits) or CNIC (13 digits)');
  }

  // Items validation
  if (payload.items.length === 0) {
    errors.push('At least one line item is required');
  }

  if (payload.items.length > 100) {
    errors.push('Maximum 100 line items allowed');
  }

  payload.items.forEach((item, index) => {
    if (item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Quantity must be positive`);
    }

    if (item.valueSalesExcludingST < 0) {
      errors.push(`Item ${index + 1}: Sales value cannot be negative`);
    }

    if (!item.rate.match(/^\d+%$/)) {
      errors.push(`Item ${index + 1}: Tax rate must be in format "18%"`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### Mapping Examples

#### Example 1: Sale Invoice

**Internal Format** (Database):
```typescript
const invoice = {
  id: 'uuid-123',
  invoiceType: 'Sale Invoice',
  invoiceDate: '2026-02-14',
  sellerNTNCNIC: '0786909',
  sellerBusinessName: 'ABC Company',
  // ... other fields
};

const lineItems = [
  {
    id: 'uuid-456',
    invoiceId: 'uuid-123',
    lineNumber: 1,
    hsCode: '0101.2100',
    productDescription: 'Product A',
    quantity: '10.0000',
    rate: '18%',
    // ... other fields
  }
];
```

**FBR Format** (API):
```json
{
  "invoiceType": "Sale Invoice",
  "invoiceDate": "2026-02-14",
  "sellerNTNCNIC": "0786909",
  "sellerBusinessName": "ABC Company",
  "buyerNTNCNIC": "1000000000000",
  "buyerBusinessName": "Customer XYZ",
  "buyerProvince": "Sindh",
  "buyerAddress": "Karachi",
  "buyerRegistrationType": "Registered",
  "items": [
    {
      "hsCode": "0101.2100",
      "productDescription": "Product A",
      "rate": "18%",
      "uom": "Numbers, pieces, units",
      "quantity": 10.0,
      "valueSalesExcludingST": 1000.00,
      "salesTaxApplicable": 180.00,
      "totalValues": 1180.00,
      "discount": 0.00,
      "saleType": "Goods at standard rate (default)"
    }
  ]
}
```

---

## Relationships and Constraints

### Drizzle ORM Relations

```typescript
// src/lib/db/schema/invoices.ts (continued)
import { relations } from 'drizzle-orm';

// Invoice relations
export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [invoices.organizationId],
    references: [organizations.id],
  }),
  lineItems: many(lineItems),
}));

// Line item relations
export const lineItemsRelations = relations(lineItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [lineItems.invoiceId],
    references: [invoices.id],
  }),
}));

// Invoice draft relations
export const invoiceDraftsRelations = relations(invoiceDrafts, ({ one }) => ({
  organization: one(organizations, {
    fields: [invoiceDrafts.organizationId],
    references: [organizations.id],
  }),
}));
```

### Database Constraints

#### Foreign Key Constraints
- `invoices.organizationId` → `organizations.id` (CASCADE DELETE)
- `lineItems.invoiceId` → `invoices.id` (CASCADE DELETE)
- `invoiceDrafts.organizationId` → `organizations.id` (CASCADE DELETE)

#### Unique Constraints
- `fbrInvoiceNumber` (if not null) - ensures FBR invoice numbers are unique

#### Check Constraints
```sql
-- Ensure valid NTN/CNIC lengths
ALTER TABLE invoices ADD CONSTRAINT check_seller_ntn_cnic_length
  CHECK (LENGTH(seller_ntn_cnic) IN (7, 13));

ALTER TABLE invoices ADD CONSTRAINT check_buyer_ntn_cnic_length
  CHECK (buyer_ntn_cnic IS NULL OR LENGTH(buyer_ntn_cnic) IN (7, 13));

-- Ensure positive quantities
ALTER TABLE line_items ADD CONSTRAINT check_quantity_positive
  CHECK (quantity > 0);

-- Ensure non-negative amounts
ALTER TABLE line_items ADD CONSTRAINT check_amounts_non_negative
  CHECK (
    value_sales_excluding_st >= 0 AND
    sales_tax_applicable >= 0 AND
    total_values >= 0
  );

-- Ensure Debit Note has reference
ALTER TABLE invoices ADD CONSTRAINT check_debit_note_reference
  CHECK (
    (invoice_type = 'Debit Note' AND invoice_ref_no IS NOT NULL) OR
    (invoice_type = 'Sale Invoice')
  );
```

---

## Migration Strategy

### Phase 1: Initial Schema Creation

**File**: `drizzle/migrations/0001_create_invoices.sql`

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE invoice_type AS ENUM ('Sale Invoice', 'Debit Note');
CREATE TYPE buyer_registration_type AS ENUM ('Registered', 'Unregistered');
CREATE TYPE invoice_status AS ENUM ('draft', 'submitted', 'accepted', 'rejected');

-- Create invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  invoice_type invoice_type NOT NULL,
  invoice_date DATE NOT NULL,

  seller_ntn_cnic VARCHAR(13) NOT NULL,
  seller_business_name VARCHAR(255) NOT NULL,
  seller_province VARCHAR(100) NOT NULL,
  seller_address TEXT NOT NULL,

  buyer_ntn_cnic VARCHAR(13),
  buyer_business_name VARCHAR(255) NOT NULL,
  buyer_province VARCHAR(100) NOT NULL,
  buyer_address TEXT NOT NULL,
  buyer_registration_type buyer_registration_type NOT NULL,

  invoice_ref_no VARCHAR(28),

  subtotal DECIMAL(15, 2) NOT NULL,
  total_tax DECIMAL(15, 2) NOT NULL,
  grand_total DECIMAL(15, 2) NOT NULL,

  fbr_payload JSONB,
  fbr_invoice_number VARCHAR(50),
  fbr_submitted_at TIMESTAMP,
  fbr_response_code VARCHAR(10),
  fbr_response_message TEXT,

  status invoice_status NOT NULL DEFAULT 'draft',

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID
);

-- Create line_items table
CREATE TABLE line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,

  hs_code VARCHAR(20) NOT NULL,
  product_description TEXT NOT NULL,

  quantity DECIMAL(12, 4) NOT NULL,
  uom VARCHAR(100) NOT NULL,

  value_sales_excluding_st DECIMAL(15, 2) NOT NULL,
  fixed_notified_value_or_retail_price DECIMAL(15, 2) NOT NULL DEFAULT 0,
  discount DECIMAL(15, 2) DEFAULT 0,

  rate VARCHAR(10) NOT NULL,
  sales_tax_applicable DECIMAL(15, 2) NOT NULL,
  sales_tax_withheld_at_source DECIMAL(15, 2) NOT NULL DEFAULT 0,
  extra_tax DECIMAL(15, 2) DEFAULT 0,
  further_tax DECIMAL(15, 2) DEFAULT 0,

  sale_type VARCHAR(100) NOT NULL,

  sro_schedule_no VARCHAR(50),
  fed_payable DECIMAL(15, 2) DEFAULT 0,
  sro_item_serial_no VARCHAR(50),

  total_values DECIMAL(15, 2) NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create invoice_drafts table (Phase 2)
CREATE TABLE invoice_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  draft_data JSONB NOT NULL,
  last_saved TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID
);

-- Create indexes
CREATE INDEX idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_fbr_invoice_number ON invoices(fbr_invoice_number) WHERE fbr_invoice_number IS NOT NULL;

CREATE INDEX idx_line_items_invoice_id ON line_items(invoice_id);
CREATE INDEX idx_line_items_invoice_id_line_number ON line_items(invoice_id, line_number);

CREATE INDEX idx_invoice_drafts_organization_id ON invoice_drafts(organization_id);
CREATE INDEX idx_invoice_drafts_created_by ON invoice_drafts(created_by);
CREATE INDEX idx_invoice_drafts_last_saved ON invoice_drafts(last_saved);

-- Add constraints
ALTER TABLE invoices ADD CONSTRAINT check_seller_ntn_cnic_length
  CHECK (LENGTH(seller_ntn_cnic) IN (7, 13));

ALTER TABLE invoices ADD CONSTRAINT check_buyer_ntn_cnic_length
  CHECK (buyer_ntn_cnic IS NULL OR LENGTH(buyer_ntn_cnic) IN (7, 13));

ALTER TABLE invoices ADD CONSTRAINT check_debit_note_reference
  CHECK (
    (invoice_type = 'Debit Note' AND invoice_ref_no IS NOT NULL AND LENGTH(invoice_ref_no) IN (22, 28)) OR
    (invoice_type = 'Sale Invoice')
  );

ALTER TABLE line_items ADD CONSTRAINT check_quantity_positive
  CHECK (quantity > 0);

ALTER TABLE line_items ADD CONSTRAINT check_amounts_non_negative
  CHECK (
    value_sales_excluding_st >= 0 AND
    sales_tax_applicable >= 0 AND
    total_values >= 0
  );
```

### Running Migrations

```bash
# Generate migration from schema
npm run db:generate

# Apply migration to database
npm run db:migrate

# Push schema directly (development only)
npm run db:push
```

---

## Summary

This data model provides:

✅ **FBR Compliance**: All mandatory fields from Digital Invoicing API v1.12
✅ **Type Safety**: Drizzle ORM with TypeScript for compile-time validation
✅ **Performance**: Indexes on frequently queried columns
✅ **Data Integrity**: Foreign keys, check constraints, enums
✅ **Extensibility**: JSONB fields for future FBR API changes
✅ **Migration Path**: Clear strategy for IndexedDB → PostgreSQL drafts

Next steps: See [contracts/invoice-api.md](./contracts/invoice-api.md) for API specifications.
