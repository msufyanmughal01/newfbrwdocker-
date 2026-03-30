# Data Model: FBR Compliance Platform

**Branch**: `005-fbr-compliance-platform` | **Date**: 2026-02-19

---

## Existing Tables (No Schema Change Needed)

### `business_profiles`
One-to-one with `users`. Already exists.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | text FK → users.id | unique, cascade delete |
| business_name | varchar(255) | |
| ntn_cnic | varchar(13) | 7-digit NTN or 13-digit CNIC |
| province | varchar(100) | FBR province values |
| address | text | |
| logo_path | varchar(500) | Path to uploaded logo file |
| fbr_token_encrypted | text | AES-256-GCM encrypted |
| fbr_token_hint | varchar(10) | Last 4 chars for display |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Gap**: Auto-creation at signup (hook into better-auth `user.create.after`). No schema change needed.

---

### `clients`
User-scoped buyer registry. Already exists with soft-delete.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | text FK → users.id | cascade delete |
| business_name | varchar(255) | NOT NULL |
| ntn_cnic | varchar(13) | unique key for dedup |
| province | varchar(100) | |
| address | text | |
| registration_type | varchar(50) | 'Registered' \| 'Unregistered' |
| notes | text | |
| is_deleted | boolean | soft-delete only |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Indexes**: `(user_id, business_name)`, `(user_id, is_deleted)`

**Gap**: None — schema complete.

---

### `invoices`
Core transactional record. Already exists.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | text FK → users.id | |
| invoice_type | enum | 'Sale Invoice' \| 'Debit Note' |
| invoice_date | date | YYYY-MM-DD |
| seller_ntn_cnic | varchar(13) | Snapshot from business profile at creation |
| seller_business_name | varchar(255) | Snapshot |
| seller_province | varchar(100) | Snapshot |
| seller_address | text | Snapshot |
| buyer_ntn_cnic | varchar(13) | Optional if unregistered |
| buyer_business_name | varchar(255) | |
| buyer_province | varchar(100) | |
| buyer_address | text | |
| buyer_registration_type | enum | 'Registered' \| 'Unregistered' |
| invoice_ref_no | varchar(28) | For Debit Notes |
| subtotal | decimal(15,2) | Excludes tax |
| total_tax | decimal(15,2) | Sum of all tax |
| grand_total | decimal(15,2) | subtotal + total_tax |
| fbr_payload | jsonb | Full FBR-formatted payload |
| fbr_invoice_number | varchar(50) | IRN from FBR |
| fbr_submission_id | uuid FK | → fbr_submissions |
| fbr_submitted_at | timestamp | |
| fbr_response_code | varchar(10) | |
| fbr_response_message | text | |
| issued_at | timestamp | Set when status = 'issued' |
| status | enum | draft\|validating\|validated\|submitting\|issued\|failed |
| created_at | timestamp | |
| updated_at | timestamp | |
| created_by | uuid | |

**User-facing status mapping**:
- `draft` → Draft
- `validated` → Active (ready to submit)
- `issued` → Submitted (IRN received, immutable)
- `failed` → Failed (can retry)

**Gap**: Server-side immutability guard needed in all PATCH/PUT handlers. No schema change.

---

### `line_items`
Child of invoices. Already exists (check schema/invoices.ts for full definition).

---

### `fbr_submissions`
Audit trail for FBR API calls. Already exists.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| invoice_id | uuid FK → invoices | cascade delete |
| status | enum | validating\|validated\|submitting\|issued\|failed |
| validate_request | jsonb | Full validate API payload |
| validate_response | jsonb | Full validate API response |
| post_request | jsonb | Full post API payload |
| post_response | jsonb | Full post API response |
| fbr_invoice_number | varchar(50) | IRN on success |
| fbr_error_codes | jsonb | Error array on rejection |
| environment | enum | sandbox\|production |
| scenario_id | varchar(10) | Sandbox scenario ref |
| attempted_at | timestamp | |
| issued_at | timestamp | |

**Gap**: None — schema complete for audit logging.

---

### `fbr_reference_cache`
FBR reference data (HS codes, provinces, UOM, tax rates). Already exists.

---

## New Tables Required

### `hs_code_master` (NEW)
User-curated list of frequently used HS codes. Enables instant access without FBR API calls.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, defaultRandom() | |
| user_id | text | FK → users.id, NOT NULL | Scoped per user |
| hs_code | varchar(20) | NOT NULL | HS code value (e.g. '8517.6200') |
| description | text | NOT NULL | Human-readable description |
| uom | varchar(100) | | Default UOM for this code |
| is_active | boolean | NOT NULL, default true | Soft-disable without delete |
| sort_order | integer | default 0 | User-defined ordering |
| created_at | timestamptz | NOT NULL, defaultNow() | |
| updated_at | timestamptz | NOT NULL, defaultNow() | |

**Indexes**:
- `(user_id, hs_code)` — unique (prevents duplicate pinning)
- `(user_id, is_active)` — filter active codes
- `(user_id, sort_order)` — ordered listing

**Validation rules**:
- `hs_code` must match pattern `^\d{4}(\.\d{2,4})?$`
- `description` max 500 chars
- One user cannot pin more than 500 HS codes (soft cap)

**State transitions**: active → inactive (soft-disable), never hard-deleted.

---

## Entity Relationships

```
users (better-auth)
  ├── business_profiles (1:1)
  ├── clients (1:N, soft-delete)
  ├── hs_code_master (1:N, soft-disable)
  └── invoices (1:N)
        ├── line_items (1:N)
        └── fbr_submissions (1:N, audit trail)

fbr_reference_cache (global, shared across users)
```

---

## State Machine: Invoice Lifecycle

```
           ┌─────────────────────────────────────┐
           │           User Actions              │
           └─────────────────────────────────────┘
                              │
                         [Create]
                              ▼
                        ┌─────────┐
             [Save] ──▶ │  draft  │ ◀── [Edit resume]
                        └─────────┘
                              │
                    [Submit to FBR]
                              ▼
                       ┌──────────────┐
                       │  validating  │ ──── FBR /validate call
                       └──────────────┘
                          │       │
                    [pass]        [fail]
                       ▼             ▼
                 ┌──────────┐   ┌──────────┐
                 │validated │   │  failed  │ ──▶ [User retry]
                 └──────────┘   └──────────┘
                       │
                  [Auto-proceed]
                       ▼
                  ┌───────────┐
                  │submitting │ ──── FBR /post call
                  └───────────┘
                     │       │
               [IRN]          [reject]
                  ▼               ▼
             ┌────────┐      ┌──────────┐
             │ issued │      │  failed  │
             └────────┘      └──────────┘
                  │
             [IMMUTABLE — no further edits]
```

---

## Migration Plan

### Migration 005-a: `hs_code_master` table (NEW)
```sql
CREATE TABLE hs_code_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hs_code VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  uom VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX hs_master_user_code_idx ON hs_code_master(user_id, hs_code);
CREATE INDEX hs_master_user_active_idx ON hs_code_master(user_id, is_active);
CREATE INDEX hs_master_user_sort_idx ON hs_code_master(user_id, sort_order);
```

### Migration 005-b: No changes to existing tables
All existing tables (`business_profiles`, `clients`, `invoices`, `line_items`, `fbr_submissions`, `fbr_reference_cache`) require no structural changes for this feature.

---

## Data Integrity Rules (Constitution Principle IX)

1. All financial fields use `decimal(15,2)` — no floating point.
2. `issued` invoices: server rejects all mutations. Check status before any update.
3. FBR token: encrypted at rest, decrypted only server-side, never logged or returned to client.
4. All user data scoped by `user_id` — no cross-user access.
5. Soft-delete only on `clients` and `hs_code_master`. Hard-delete forbidden (Constitution constraint).
6. `fbr_submissions` is append-only — no updates, no deletes.
