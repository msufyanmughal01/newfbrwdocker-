# Data Model: FBR API Integration

**Date**: 2026-02-17 | **Branch**: `003-fbr-api-integration`

---

## New Tables

### 1. `fbr_submissions`

Tracks every FBR API submission attempt per invoice.

```typescript
// src/lib/db/schema/fbr.ts
export const fbrSubmissions = pgTable('fbr_submissions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id),
  userId: text('user_id').notNull(),

  // Status lifecycle: draft → validating → validated → submitting → issued | failed
  status: text('status', {
    enum: ['validating', 'validated', 'submitting', 'issued', 'failed']
  }).notNull().default('validating'),

  // Validate API results
  validateRequest: jsonb('validate_request'),       // Payload sent to FBR
  validateResponse: jsonb('validate_response'),     // Raw FBR validate response
  validateStatusCode: text('validate_status_code'), // "00" or "01"
  validatedAt: timestamp('validated_at'),

  // Post API results
  postRequest: jsonb('post_request'),               // Payload sent to FBR
  postResponse: jsonb('post_response'),             // Raw FBR post response
  fbrInvoiceNumber: text('fbr_invoice_number'),     // e.g. "7000007DI1747119701593"
  issuedAt: timestamp('issued_at'),

  // Error details
  fbrErrorCodes: jsonb('fbr_error_codes'),         // Array of {itemSNo, errorCode, error}
  failureReason: text('failure_reason'),

  // Metadata
  environment: text('environment', {
    enum: ['sandbox', 'production']
  }).notNull(),
  scenarioId: text('scenario_id'),                 // e.g. "SN001" (sandbox only)
  attemptedAt: timestamp('attempted_at').notNull().defaultNow(),
});
```

**Relationships**: belongs to one `invoices` record.

---

### 2. `fbr_reference_cache`

Stores cached FBR reference API responses with TTL.

```typescript
export const fbrReferenceCache = pgTable('fbr_reference_cache', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  dataType: text('data_type', {
    enum: [
      'provinces',
      'doc_types',
      'hs_codes',
      'sro_items',
      'transaction_types',
      'uom',
      'sro_schedule',
      'tax_rates',
      'hs_uom',
    ]
  }).notNull(),
  cacheKey: text('cache_key').notNull(),  // e.g. "provinces" or "tax_rates:18:7:2025-02-17"
  payload: jsonb('payload').notNull(),    // Raw array from FBR API
  fetchedAt: timestamp('fetched_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
}, (table) => ({
  cacheKeyIdx: uniqueIndex('fbr_cache_key_idx').on(table.cacheKey),
}));
```

**TTL by type**:
| Data Type | TTL |
|-----------|-----|
| provinces | 7 days |
| doc_types | 7 days |
| hs_codes | 24 hours |
| uom | 24 hours |
| sro_items | 24 hours |
| transaction_types | 24 hours |
| tax_rates | 1 hour |
| sro_schedule | 1 hour |
| hs_uom | 24 hours |

---

### 3. `buyer_registry`

Stores frequent buyer details per organization for autocomplete and STATL caching.

```typescript
export const buyerRegistry = pgTable('buyer_registry', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  organizationId: text('organization_id').notNull(),
  ntnCnic: text('ntn_cnic').notNull(),              // Buyer NTN (7 digits) or CNIC (13 digits)
  businessName: text('business_name').notNull(),
  province: text('province').notNull(),
  address: text('address').notNull(),
  registrationType: text('registration_type', {
    enum: ['Registered', 'Unregistered']
  }).notNull(),

  // STATL verification cache
  statlStatus: text('statl_status', {
    enum: ['active', 'inactive', 'unknown', 'skipped']
  }).default('unknown'),
  statlStatusCode: text('statl_status_code'),       // e.g. "01", "02"
  statlCheckedAt: timestamp('statl_checked_at'),

  // Registry metadata
  lastUsedAt: timestamp('last_used_at').defaultNow(),
  useCount: integer('use_count').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  orgNtnIdx: uniqueIndex('buyer_registry_org_ntn_idx').on(table.organizationId, table.ntnCnic),
  orgNameIdx: index('buyer_registry_org_name_idx').on(table.organizationId, table.businessName),
}));
```

---

## Modified Tables

### `invoices` (extend existing schema)

Add columns to existing `invoices` table:

```typescript
// Add to src/lib/db/schema/invoices.ts
fbrInvoiceNumber: text('fbr_invoice_number'),         // Populated after successful issuance
fbrSubmissionId: text('fbr_submission_id'),           // FK to fbr_submissions.id
invoiceStatus: text('invoice_status', {
  enum: ['draft', 'validating', 'validated', 'submitting', 'issued', 'failed']
}).notNull().default('draft'),
issuedAt: timestamp('issued_at'),
```

---

## Entity Relationships

```
Organization
  ├── has many Invoice
  │     ├── has many LineItem
  │     └── has one FBRSubmission (latest)
  └── has many BuyerRegistry

FBRReferenceCache (global, not org-scoped)
  └── keyed by (dataType + cacheKey)
```

---

## State Machine: Invoice Status

```
                    [User fills form]
                          │
                       draft
                          │ [Submit clicked]
                          ▼
                     validating ──── [FBR error] ──→ failed
                          │
                    [statusCode "00"]
                          ▼
                      validated
                          │ [Post API called]
                          ▼
                     submitting ──── [FBR error] ──→ failed
                          │
                    [Invoice number received]
                          ▼
                       issued (IMMUTABLE)
```

**Constitution Rule (Principle IX)**: `issued` records are immutable. No updates allowed after reaching this state.

---

## FBR API Payload Types (TypeScript Interfaces)

```typescript
// FBR Post/Validate Request (matches existing InvoiceFormData + scenarioId)
interface FBRInvoiceRequest {
  invoiceType: 'Sale Invoice' | 'Debit Note';
  invoiceDate: string;         // YYYY-MM-DD
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
  scenarioId?: string;         // Sandbox only
  items: FBRLineItem[];
}

interface FBRLineItem {
  hsCode: string;
  productDescription: string;
  rate: string;                // e.g. "18%"
  uoM: string;
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
}

// FBR Post Response (success)
interface FBRPostResponse {
  invoiceNumber: string;       // e.g. "7000007DI1747119701593"
  dated: string;               // e.g. "2025-05-13 12:01:41"
  validationResponse: FBRValidationResponse;
}

// FBR Validate Response
interface FBRValidationResponse {
  statusCode: '00' | '01';
  status: 'Valid' | 'Invalid' | 'invalid';
  error: string;
  errorCode?: string;
  invoiceStatuses: FBRItemStatus[] | null;
}

interface FBRItemStatus {
  itemSNo: string;
  statusCode: '00' | '01';
  status: 'Valid' | 'Invalid';
  invoiceNo: string | null;
  errorCode: string;
  error: string;
}

// STATL Response
interface STATLResponse {
  'status code': string;       // "01" = In-Active, "02" = In-Active
  status: 'In-Active' | 'Active';
}

// Get_Reg_Type Response
interface RegTypeResponse {
  statuscode: string;
  REGISTRATION_NO: string;
  REGISTRATION_TYPE: 'registered' | 'unregistered' | 'Registered' | 'Unregistered';
}
```
