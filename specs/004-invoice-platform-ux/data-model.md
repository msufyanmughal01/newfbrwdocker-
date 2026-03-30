# Data Model: Smart Invoice Platform UX Enhancement

**Feature**: 004-invoice-platform-ux
**Date**: 2026-02-17

---

## New Tables

### `business_profiles`

Stores per-user business identity and FBR configuration. Created automatically at signup.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, default gen_random_uuid() | |
| `user_id` | UUID | FK → users.id, UNIQUE, NOT NULL | 1:1 with user |
| `business_name` | VARCHAR(255) | | Auto-fills invoice sellerBusinessName |
| `ntn_cnic` | VARCHAR(13) | | 7-digit NTN or 13-digit CNIC |
| `province` | VARCHAR(100) | | FBR province enum value |
| `address` | TEXT | | Business address |
| `logo_path` | VARCHAR(500) | NULLABLE | Relative path: /uploads/logos/{userId}-logo.{ext} |
| `fbr_token_encrypted` | TEXT | NULLABLE | AES-256 encrypted FBR bearer token |
| `fbr_token_hint` | VARCHAR(10) | NULLABLE | Last 4 chars for display masking |
| `created_at` | TIMESTAMP | NOT NULL, default NOW() | |
| `updated_at` | TIMESTAMP | NOT NULL, default NOW() | Updated on every PUT |

**Relationships**: 1 business_profile → 1 user

---

### `clients`

User-managed client (buyer) registry. Explicit master data, separate from auto-populated `buyer_registry`.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK, default gen_random_uuid() | |
| `user_id` | UUID | FK → users.id, NOT NULL | Scoped to user |
| `business_name` | VARCHAR(255) | NOT NULL | |
| `ntn_cnic` | VARCHAR(13) | NULLABLE | |
| `province` | VARCHAR(100) | NULLABLE | |
| `address` | TEXT | NULLABLE | |
| `registration_type` | VARCHAR(50) | NULLABLE | 'Registered' | 'Unregistered' |
| `notes` | TEXT | NULLABLE | Optional user notes |
| `is_deleted` | BOOLEAN | NOT NULL, default false | Soft delete (Constitution: no hard deletes) |
| `created_at` | TIMESTAMP | NOT NULL, default NOW() | |
| `updated_at` | TIMESTAMP | NOT NULL, default NOW() | |

**Indexes**:
- `(user_id, business_name)` — for search queries
- `(user_id, is_deleted)` — filter active clients

**Relationships**: 1 user → many clients

---

## Modified Tables

### `invoices` (existing — no schema change needed)

The invoice status lifecycle (`draft`, `validating`, `validated`, `submitting`, `issued`, `failed`) already covers the draft/issued separation. The Drafts page and Invoices page are filtered views only — no new columns required.

---

## Entity Relationships

```
users
 ├── 1:1 → business_profiles (created at signup)
 ├── 1:N → clients (user-managed client registry)
 ├── 1:N → invoices (existing)
 │          └── status: 'draft' | 'issued' | 'failed' | ...
 └── 1:N → buyer_registry (auto-managed, from 003)
```

---

## Computed Entities (Not Stored)

### `DashboardMetrics`

Computed on-demand via SQL aggregation. Fields returned by `GET /api/dashboard/metrics`:

```
{
  totalInvoices: number,           -- COUNT of issued invoices in range
  totalRevenue: string,            -- SUM(grand_total) as decimal string
  totalSalesTax: string,           -- SUM(total_tax) as decimal string
  revenueExcludingSalesTax: string,-- SUM(subtotal) as decimal string
  trendData: Array<{
    date: string,                  -- ISO date (YYYY-MM-DD) or YYYY-MM for monthly
    invoiceCount: number,
    revenue: string
  }>
}
```

---

## Validation Rules (from spec FR)

| Entity | Field | Rule |
|--------|-------|------|
| business_profiles | ntn_cnic | Optional; if provided: 7 digits (NTN) or 13 digits (CNIC) |
| business_profiles | fbr_token_encrypted | Encrypted server-side; never returned in plain text |
| business_profiles | logo_path | Max 5MB file, image types only (jpg, png, webp, svg) |
| clients | business_name | Required, 1–255 chars |
| clients | ntn_cnic | Optional; same pattern as above |
| clients | registration_type | If provided: 'Registered' or 'Unregistered' only |
| DashboardMetrics | date range | `from` ≤ `to`; both required; ISO date strings |

---

## State Transitions

### Business Profile
```
(none) → created_blank_at_signup → profile_filled → profile_updated → ...
```
No terminal state — business profile is always editable.

### Client
```
active → soft_deleted (is_deleted=true)
```
Soft delete only. No hard deletes (Constitution constraint).

### Invoice Status (existing, unchanged)
```
draft → validating → validated → submitting → issued (immutable)
                                           → failed (can retry)
```
