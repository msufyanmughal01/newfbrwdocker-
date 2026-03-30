---
id: 003
title: FBR API Integration Full Implementation
stage: green
date: 2026-02-17
surface: agent
model: claude-sonnet-4-5-20250929
feature: 003-fbr-api-integration
branch: 002-invoice-creation-form
user: system-inn
command: /sp.implement (continued from previous session)
labels: ["fbr-api", "qr-code", "buyer-registry", "hs-code-search", "ntn-verify", "invoice-list", "reference-data", "polish"]
links:
  spec: specs/003-fbr-api-integration/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - src/components/invoices/BuyerSearch.tsx
  - src/components/invoices/InvoiceHeader.tsx
  - src/lib/fbr/reference/provinces.ts
  - src/lib/fbr/reference/uom.ts
  - src/lib/fbr/reference/tax-rates.ts
  - src/app/api/fbr/reference/provinces/route.ts
  - src/app/api/fbr/reference/uom/route.ts
  - src/app/api/fbr/reference/tax-rates/route.ts
  - src/components/invoices/FBRErrorDisplay.tsx
  - src/components/invoices/InvoiceStatusBadge.tsx
  - src/components/invoices/FBRErrorBoundary.tsx
  - src/components/invoices/LineItemRow.tsx
  - src/components/invoices/LineItemsTable.tsx
  - src/app/(dashboard)/invoices/page.tsx
  - src/app/(dashboard)/invoices/[id]/page.tsx
  - src/components/dashboard/Sidebar.tsx
  - src/app/api/invoices/route.ts
  - src/app/(dashboard)/invoices/invoice-form-client.tsx
  - .env.example
  - specs/003-fbr-api-integration/tasks.md
tests:
  - none (implementation phase)
---

## Prompt

continue (resume /sp.implement from T042 onwards — completing Phases 7-10 of 003-fbr-api-integration)

## Response

Completed all remaining tasks T042–T062 across Phases 7–10:

**Phase 7 (US5 Buyer Registry):**
- T042: Replaced buyer business name plain input in InvoiceHeader.tsx with BuyerSearch component

**Phase 8 (US6 Error Display + Reference Pre-population):**
- T043: Created `src/lib/fbr/reference/provinces.ts` (FBR live provinces, 24h cache)
- T044: Created `src/lib/fbr/reference/uom.ts` (FBR live UOMs, 24h cache)
- T045: Created `GET /api/fbr/reference/provinces` route
- T046: Created `GET /api/fbr/reference/uom` route
- T047: FBRErrorDisplay already had grouping + onFieldHighlight — confirmed complete
- T048: invoice-form-client.tsx already had handleFieldHighlight wiring — confirmed complete

**Phase 9 (Reference Data):**
- T049: Created `src/lib/fbr/reference/tax-rates.ts` (SaleTypeToRate API, 24h cache, default fallback)
- T050: Created `GET /api/fbr/reference/tax-rates` route
- T051: InvoiceHeader.tsx now fetches provinces from live API with FBR_PROVINCES fallback
- T052: LineItemsTable.tsx fetches UOM from live API, passes to LineItemRow; LineItemRow accepts uomOptions prop
- T053: LineItemsTable.tsx fetches tax rates from live API, passes to LineItemRow; LineItemRow accepts taxRateOptions prop

**Phase 10 (Polish):**
- T054: Created `.env.example` documenting FBR_API_TOKEN, FBR_ENV, DATABASE_URL, BETTER_AUTH_SECRET
- T055: Created `/invoices` list page with table (FBR number, type, date, buyer, status, View/Print actions)
- T056: Invoice detail page already had "Back to Invoices" link — confirmed complete
- T057: Created `InvoiceStatusBadge` component (gray/blue/cyan/yellow/green/red by status)
- T058: Added "Invoices" nav link to Sidebar.tsx with prefix-based active detection
- T059: Removed all debug console.log statements from invoices/route.ts, LineItemsTable.tsx, invoice-form-client.tsx
- T060: FBR_API_TOKEN guard already existed in api-client.ts — confirmed complete
- T061: Loading states already existed in HSCodeSearch and BuyerSearch — confirmed complete
- T062: Created `FBRErrorBoundary` class component; wrapped BuyerSearch in InvoiceHeader and HSCodeSearch in LineItemRow

**TypeScript fixes:** Resolved all TS errors — fbrGet type assertions, readonly array spreading for useState defaults, province enum type guard in BuyerSearch.

**Build result:** `npx next build` exits 0, all routes compiled — /invoices, /invoices/[id], /invoices/[id]/print, /invoices/new all render correctly.

All 62 tasks marked [x] in specs/003-fbr-api-integration/tasks.md.
