---
id: "007"
title: "P0 Security Fixes Implementation"
stage: green
date: "2026-02-21"
surface: agent
model: claude-sonnet-4-6
feature: "005-fbr-compliance-platform"
branch: "005-fbr-compliance-platform"
user: system
command: "Implement P0 security fixes plan"
labels: ["security", "rls", "schema", "tenant-isolation", "indexes", "fbr-token"]
links:
  spec: "null"
  ticket: "null"
  adr: "null"
  pr: "null"
files:
  - "src/lib/db/schema/fbr.ts"
  - "src/lib/db/schema/invoices.ts"
  - "src/lib/db/schema/hs-code-master.ts"
  - "src/lib/db/schema/business-profiles.ts"
  - "src/lib/db/index.ts"
  - "src/app/api/fbr/submit/route.ts"
  - "src/app/api/buyers/route.ts"
  - "src/lib/fbr/reference/statl.ts"
  - "src/app/api/fbr/verify-ntn/route.ts"
  - "src/lib/fbr/api-client.ts"
  - "drizzle/0002_p0_security_fixes.sql"
tests: []
---

## Prompt

Implement the following plan:

# P0 Security Fixes — Implementation Plan

[Full plan provided: four P0 security gaps addressed: buyerRegistry.organizationId rename+FK, performance indexes, Neon RLS, FBR token expiry tracking. 10 files modified, 1 new migration created.]

## Response

Implemented all four P0 security fixes across 10 files + 1 new migration:

### Fix 1 — buyerRegistry rename + FK
- `src/lib/db/schema/fbr.ts`: `organizationId` → `userId` with `.references(() => user.id, { onDelete: 'cascade' })`, unique index renamed to `buyer_registry_user_ntn_idx`
- `src/app/api/fbr/submit/route.ts`: `organizationId: userId` → `userId: userId`, conflict target updated
- `src/app/api/buyers/route.ts`: `organizationId` var → `userId`, field reference updated
- `src/lib/fbr/reference/statl.ts`: function param `organizationId` → `userId`, all 4 field references updated
- `src/app/api/fbr/verify-ntn/route.ts`: `organizationId` → `userId` variable and call

### Fix 2 — Performance indexes
- `src/lib/db/schema/invoices.ts`: added `index` import + table config with `invoices_user_id_idx` and `invoices_user_status_idx`
- `src/lib/db/schema/hs-code-master.ts`: added `index` import + `hs_code_master_user_id_idx`
- `src/lib/db/schema/fbr.ts`: added `index` import + `fbr_submissions_invoice_id_idx`
- Migration SQL: `invoice_drafts_user_id_idx` also added

### Fix 3 — Token expiry columns
- `src/lib/db/schema/business-profiles.ts`: added `fbrTokenExpiresAt` and `fbrTokenUpdatedAt` timestamp columns
- `src/lib/fbr/api-client.ts`: `resolveToken()` now selects `fbrTokenExpiresAt`, checks expiry, emits `console.warn` if expired (still returns token — full refresh is P1)

### Fix 4 — Neon RLS
- `drizzle/0002_p0_security_fixes.sql`: enables RLS on 6 tables, creates PERMISSIVE policies using `current_setting('app.current_user_id', true)` with empty-string/NULL pass-through (so owner/migration connections bypass cleanly)
- `src/lib/db/index.ts`: exports `withTenantContext<T>(userId, fn)` wrapping a transaction that calls `set_config('app.current_user_id', userId, true)` with LOCAL scope

### Verification
- `npx tsc --noEmit` passes with 0 errors related to our changes (4 pre-existing unrelated errors in test files and invoice-form-client.tsx)

## Outcome

All 4 P0 security gaps closed. Migration `drizzle/0002_p0_security_fixes.sql` must be applied to the database before deploying.
