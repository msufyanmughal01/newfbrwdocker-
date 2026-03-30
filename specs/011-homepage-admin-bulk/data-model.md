# Data Model: TaxDigital Platform Overhaul

**Branch**: `011-homepage-admin-bulk` | **Date**: 2026-03-25

---

## Existing Tables (unchanged)

All existing database tables are unchanged. No schema migrations are needed for this feature.

### bulkInvoiceBatches (existing — column `rows` extended)

```
Column          Type        Notes
──────────────────────────────────────────────────────────
id              uuid PK     auto-generated
userId          text        FK → user.id (cascade delete)
fileName        text        original upload filename
totalRows       int         count of all rows in upload
validRows       int         count of field-valid rows
invalidRows     int         count of field-invalid rows
submittedRows   int         count of rows submitted to FBR
failedRows      int         count of rows that failed FBR submission
status          text        pending | has_errors | ready | verified |
                            submitting | done | partial | failed
rows            jsonb       array of InvoiceRow objects (see below)
errors          jsonb       array of batch-level error strings
createdAt       timestamptz auto-set on insert
updatedAt       timestamptz updated on each state change
```

### InvoiceRow (jsonb structure within `rows` column)

Added fields `ntnVerified` and `ntnMessage` for the new Step 3 verification:

```typescript
interface InvoiceRow {
  rowIndex: number;
  // existing fields
  buyerBusinessName?: string;
  buyerNTNCNIC?: string;
  buyerProvince?: string;
  buyerAddress?: string;
  buyerRegistrationType?: string;
  invoiceDate?: string;
  invoiceType?: string;
  hsCode?: string;
  productDescription?: string;
  quantity?: number;
  uom?: string;
  valueSalesExcludingST?: number;
  salesTaxApplicable?: number;
  discount?: number;
  rate?: string;
  errors: string[];
  valid: boolean;
  // new fields added by verify-ntns step
  ntnVerified?: boolean | null;   // null = not checked yet; true = active; false = inactive/unknown
  ntnMessage?: string;             // human-readable result message
  // existing FBR submission fields
  submitted?: boolean;
  invoiceId?: string;
  fbrInvoiceNumber?: string;
  submitError?: string;
}
```

**Status transitions**:
```
pending
  → has_errors (upload completed, some rows invalid)
  → ready (upload completed, all rows valid)
  → verified (NTN verification completed)
  → submitting (submit in progress)
  → done (all valid+verified rows submitted)
  → partial (some submitted, some failed)
  → failed (all submissions failed)
```

---

## Ephemeral Data Structures (not persisted)

### CreatedCredentials (admin flow)

Not persisted. Returned from API, displayed once, then discarded.

```typescript
interface CreatedCredentials {
  name: string;
  email: string;
  password: string; // plaintext — shown once for handoff
}
```

### ContactSubmission (landing page form)

Not persisted in this release. Form data used only for local success state display.

```typescript
interface ContactSubmission {
  fullName: string;
  businessName: string;
  email: string;
  phone?: string;
  message?: string;
}
```

---

## CSS Variable Inventory (design system)

All UI components must use only these CSS variables. No hardcoded color values.

```
Category        Variable                Light value
────────────────────────────────────────────────────────────
Background      --bg                    #f8f9fc
                --bg-subtle             #f1f3f8
Surface         --surface               #ffffff
                --surface-2             #f5f6fa
                --surface-3             #eef0f6
Border          --border                #e2e5ee
                --border-strong         #c8ccdb
Text            --foreground            #0f1423
                --foreground-muted      #6b7280
                --foreground-subtle     #9ca3af
Brand           --primary               #4f46e5
                --primary-hover         #4338ca
                --primary-fg            #ffffff
                --primary-subtle        #eef2ff
Status          --positive              #059669
                --positive-bg           #ecfdf5
                --warning               #d97706
                --warning-bg            #fffbeb
                --error                 #dc2626
                --error-bg              #fef2f2
                --info                  #2563eb
                --info-bg               #eff6ff
Shadows         --shadow-sm             …
                --shadow                …
                --shadow-lg             …
```
