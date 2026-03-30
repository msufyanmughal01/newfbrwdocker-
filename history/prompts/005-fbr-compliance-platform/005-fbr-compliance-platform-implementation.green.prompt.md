---
id: "005"
title: FBR Compliance Platform Full Implementation
stage: green
date: 2026-02-20
surface: agent
model: claude-sonnet-4-6
feature: 005-fbr-compliance-platform
branch: 005-fbr-compliance-platform
user: System Inn
command: /sp.implement
labels: ["implementation","fbr","compliance","drizzle","next.js","vitest","playwright","draft-workflow","hs-codes","business-profile","immutability","retry","ui-modernization"]
links:
  spec: specs/005-fbr-compliance-platform/spec.md
  ticket: null
  adr: history/adr/
  pr: null
files:
  - src/lib/db/schema/hs-code-master.ts (created)
  - src/lib/db/schema/index.ts (modified)
  - src/lib/hs-codes/master-service.ts (created)
  - src/lib/invoices/draft-api.ts (created)
  - src/lib/auth.ts (modified)
  - src/lib/fbr/api-client.ts (modified)
  - src/lib/fbr/validate.ts (modified)
  - src/lib/fbr/post-invoice.ts (modified)
  - src/app/api/fbr/submit/route.ts (modified)
  - src/app/api/fbr/validate/route.ts (modified)
  - src/app/api/hs-codes/master/route.ts (created)
  - src/app/api/hs-codes/master/[id]/route.ts (created)
  - src/app/api/invoices/[id]/route.ts (modified)
  - src/components/settings/HSCodeMasterManager.tsx (created)
  - src/app/(dashboard)/settings/hs-codes/page.tsx (created)
  - src/app/(dashboard)/invoices/invoice-form-client.tsx (modified)
  - src/app/(dashboard)/invoices/drafts/DraftsClient.tsx (created)
  - src/app/(dashboard)/invoices/drafts/page.tsx (modified)
  - src/app/(dashboard)/invoices/[id]/page.tsx (modified)
  - src/app/(dashboard)/dashboard/DashboardContent.tsx (modified)
  - src/components/dashboard/Sidebar.tsx (modified)
  - src/components/invoices/HSCodeSearch.tsx (modified)
  - src/app/globals.css (modified)
  - src/app/(auth)/layout.tsx (modified)
  - scripts/create-hs-table.mjs (created)
  - specs/005-fbr-compliance-platform/tasks.md (modified)
  - tests/unit/draft-fix.test.ts (created)
  - tests/unit/immutability.test.ts (created)
  - tests/unit/fbr-token-resolution.test.ts (created)
  - tests/unit/hs-master.test.ts (created)
  - tests/e2e/draft-workflow.spec.ts (created)
  - tests/e2e/hs-code-master.spec.ts (created)
  - tests/e2e/business-profile.spec.ts (created)
tests:
  - tests/unit/draft-fix.test.ts (3 tests — PASS)
  - tests/unit/immutability.test.ts (2 tests — PASS)
  - tests/unit/fbr-token-resolution.test.ts (3 tests — PASS)
  - tests/unit/hs-master.test.ts (6 tests — PASS)
  - tests/e2e/draft-workflow.spec.ts (4 tests — written)
  - tests/e2e/hs-code-master.spec.ts (3 tests — written)
  - tests/e2e/business-profile.spec.ts (3 tests — written)
---

## Prompt

/sp.implement

## Response snapshot

Executed the full 50-task implementation plan for the `005-fbr-compliance-platform` feature across 9 phases:

**Phase 1 — DB Schema (T001–T003):** Created `hs_code_master` Drizzle table (`src/lib/db/schema/hs-code-master.ts`) with user-scoped HS codes (uuid PK, userId FK → cascade delete, hsCode, description, uom, isActive, sortOrder, timestamps). Exported from schema index. Ran direct SQL script to create table (drizzle-kit push was blocked by interactive TTY prompt for existing constraint rename).

**Phase 2 — Foundational Services (T004–T005):** Created `src/lib/hs-codes/master-service.ts` with `listUserHSCodes`, `pinHSCode`, `unpinHSCode`, `hsCodeExists` (all userId-scoped). Created `src/lib/invoices/draft-api.ts` with `createServerDraft`/`updateServerDraft` fetch helpers.

**Phase 3 — US1 Business Profile (T006–T011):** Added `databaseHooks.user.create.after` to `src/lib/auth.ts` to auto-create business profile on signup. Added `resolveToken(userId?)` to `src/lib/fbr/api-client.ts` — queries `businessProfiles.fbrTokenEncrypted`, decrypts via AES-256-GCM, falls back to env var, throws `FBR_TOKEN_MISSING` error with `.code` property. Added exponential backoff retry (max 2 retries, 5xx/timeout). Updated `validateWithFBR`, `postToFBR`, submit and validate API routes to pass userId.

**Phase 4 — US2 HS Code Master (T012–T017):** Created GET/POST `/api/hs-codes/master` and DELETE `/api/hs-codes/master/[id]` routes. Created `HSCodeMasterManager` component (search FBR reference API, pin/unpin codes, star indicators). Created `/settings/hs-codes` page. Updated `HSCodeSearch` to show master codes first on focus (no minimum chars), then FBR reference results below on 3+ chars. Added "HS Codes" nav link to Sidebar.

**Phase 5 — US3 Draft Workflow (T018–T023):** Removed IndexedDB draft recovery popup from `invoice-form-client.tsx` (removed `useDebouncedCallback`, `listDrafts` useEffect, `showDraftRecovery` state, modal JSX). Replaced with server-side Save Draft (POST to `/api/invoices` for new, PATCH for update). Created `DraftsClient.tsx` with client-side search/filter by buyer name and date range. Added PATCH handler to `/api/invoices/[id]/route.ts` with immutability guard (409 INVOICE_IMMUTABLE for issued/submitting).

**Phase 6 — US4 Dashboard Analytics (T024–T027):** Dashboard metrics already filtered by `issued` status. Added `from > to` date swap guard in `DashboardContent.tsx`. MetricCard already had loading skeleton.

**Phase 7 — US5 FBR Submission (T028–T032):** PATCH immutability guard added in T023. Added read-only banner for issued invoices in `/invoices/[id]/page.tsx`. FBR retry logic added in T009. Added `FBR_TOKEN_MISSING` error display in `invoice-form-client.tsx` with link to settings.

**Phase 8 — US6 UI Modernization (T033–T039):** Added CSS design tokens (`--color-primary: #4f46e5`, etc.) and `.card` utility to `globals.css`. Applied card styling to dashboard metrics, invoice form sections. Updated Sidebar to use primary color (indigo-600). Updated auth layout to card-based design.

**Phase 9 — Tests (T040–T050):** Created 4 Vitest unit test files (14 tests, all pass). Created 3 Playwright e2e spec files. Fixed lint errors (`any` types in invoice-form-client.tsx replaced with `Resolver<InvoiceFormData>` and `DefaultValues<InvoiceFormData>`; removed unused `getToken` from api-client.ts).

## Outcome

- ✅ Impact: All 50 tasks completed. Six user stories fully implemented: business profile auto-fill, HS code master, server-side draft workflow (IndexedDB popup removed), dashboard analytics date guard, FBR submission immutability guard, UI modernization with design tokens.
- 🧪 Tests: 14 new Vitest unit tests (all pass). 10 Playwright e2e tests written. Pre-existing `auth-permissions.test.ts` failures (10 tests) are unrelated to this feature.
- 📁 Files: 13 files created, 20 files modified. Zero TypeScript errors in source. New lint errors in implementation files resolved; remaining 18 lint issues are all pre-existing.
- 🔁 Next prompts: Run `/sp.git.commit_pr` to commit and open a PR; run e2e tests against a live dev server; apply DB migration on staging via `node scripts/create-hs-table.mjs`.
- 🧠 Reflection: `drizzle-kit push` requires a live TTY for interactive prompts on constraint renames — work around with direct SQL scripts or `--accept-data-loss` flag in non-interactive contexts. Per-user encrypted FBR tokens require careful decrypt + fallback logic to avoid breaking existing env-var-only deployments.

## Evaluation notes (flywheel)

- Failure modes observed: drizzle-kit interactive TTY blocked automation; `any` type casts introduced by `zodResolver` + `useForm` generic mismatch required proper `Resolver<T>` / `DefaultValues<T>` imports.
- Graders run and results (PASS/FAIL): TypeScript — PASS (0 errors); Vitest unit (new files) — PASS (14/14); Full lint (new/modified files) — PASS (0 new errors).
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Add `--accept-data-loss` to drizzle-kit push command in CI to avoid interactive prompts for future schema migrations.
