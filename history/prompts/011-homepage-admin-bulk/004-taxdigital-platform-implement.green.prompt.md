---
id: "004"
title: taxdigital-platform-implement
stage: green
date: 2026-03-25
surface: agent
model: claude-sonnet-4-6
feature: 011-homepage-admin-bulk
branch: 011-homepage-admin-bulk
user: System Inn
command: /sp.implement
labels: ["implement","homepage","admin","bulk-invoice","typescript","eslint","vitest"]
links:
  spec: specs/011-homepage-admin-bulk/spec.md
  ticket: "null"
  adr: "null"
  pr: "null"
files:
  - src/components/home/ContactForm.tsx
  - src/app/page.tsx
  - src/app/api/admin/create-user-secret/route.ts
  - src/app/admin/admin-client.tsx
  - src/app/api/bulk-invoices/upload/route.ts
  - src/app/api/bulk-invoices/verify-ntns/route.ts
  - src/app/api/bulk-invoices/submit/route.ts
  - src/app/(dashboard)/invoices/bulk/bulk-client.tsx
  - src/app/(auth)/login/page.tsx
  - src/app/(auth)/register/page.tsx
  - src/app/api/organization/profile/route.ts
  - src/lib/utils.ts
  - src/components/invoices/ClientValidationBadge.tsx
  - src/components/ThemeToggle.tsx
  - src/components/dashboard/DashboardShell.tsx
  - src/components/invoices/NTNVerifier.tsx
  - src/components/auth/SetupOrganizationForm.tsx
  - src/components/settings/BusinessProfileForm.tsx
  - src/app/(dashboard)/settings/page.tsx
  - src/app/api/fbr/submit/route.ts
  - src/app/api/invoices/route.ts
  - src/lib/db/migrate-invoices-schema.ts
  - src/lib/db/migrate-rename-column.ts
  - src/lib/analytics/dashboard-metrics.ts
  - src/lib/clients/client-service.ts
  - src/lib/fbr/reference/cache.ts
  - src/lib/invoices/fbr-mapping.ts
  - src/lib/settings/business-profile.ts
  - src/app/layout.tsx
  - tests/integration/api/organization-profile.test.ts
  - tests/unit/hs-master.test.ts
  - specs/011-homepage-admin-bulk/tasks.md
tests:
  - tests/unit/fbr-token-resolution.test.ts (3 passed)
  - tests/unit/hs-master.test.ts (6 passed)
  - tests/unit/immutability.test.ts (2 passed)
  - tests/integration/api/organization-profile.test.ts (7 passed)
  - tests/unit/draft-fix.test.ts (3 passed)
  - tests/unit/lib/auth-permissions.test.ts (14 passed)
---

## Prompt

/sp.implement

(Invoked via skill with full sp.specify task list covering 6 tasks: light mode default, homepage, admin password, bulk invoice workflow, cleanup, quality gates. Full spec at specs/011-homepage-admin-bulk/spec.md.)

## Response snapshot

Executed all 18 tasks (T001–T018) across 6 user stories for the TaxDigital platform overhaul:

- **T001–T003**: Verified ThemeProvider, Sidebar bulk upload link, and invoices page bulk button — all already correct.
- **T004**: Created `src/components/home/ContactForm.tsx` — "use client" contact form with all fields, success state, and Calendly link.
- **T005**: Rewrote `src/app/page.tsx` as server component with session-based redirect and full 7-section landing page (navbar, hero, features, how-it-works, contact, footer).
- **T006**: Rewrote `src/app/api/admin/create-user-secret/route.ts` to accept `password` from body instead of generating server-side.
- **T007**: Rewrote `src/app/admin/admin-client.tsx` with password state, generate function, eye toggle, and credentials reveal.
- **T008**: Extended upload route to parse `.xlsx`/`.xls` files using `xlsx` library.
- **T009**: Created `src/app/api/bulk-invoices/verify-ntns/route.ts` — verifies NTNs via FBR STATL API (`statlStatus === 'active'`).
- **T010**: Updated submit route to filter `r.valid && r.ntnVerified === true`.
- **T011**: Rewrote bulk-client.tsx as 4-step wizard with step indicator, template download, drag-and-drop upload, NTN verification, and FBR submission.
- **T012**: Confirmed ThemeProvider already has `defaultTheme="light"` — no code change.
- **T013**: Removed self-register link from login page.
- **T014**: Register page redirects to `/login`.
- **T015**: Fixed 4 pre-existing TypeScript errors: ClientValidationBadge narrowing, missing `requireRole`/`getSessionWithRole` exports in utils.ts, hs-master.test mock type.
- **T016**: Fixed 21 ESLint problems (9 errors, 12 warnings) — all zero after fixes.
- **T017**: Fixed organization-profile test (drizzle-orm mock missing `relations`, route using `getSession` instead of `getSessionWithRole`). All 35 tests pass.
- **T018**: Final `tsc --noEmit` — zero errors confirmed.

## Outcome

- ✅ Impact: All 18 tasks completed. Premium landing page, admin password management, 4-step bulk invoice workflow, light mode default, auth cleanup all implemented and validated.
- 🧪 Tests: 35/35 passed across 6 test files. Zero TypeScript errors. Zero ESLint warnings.
- 📁 Files: 31 files created or modified.
- 🔁 Next prompts: Deploy to staging, run Playwright e2e tests, create PR.
- 🧠 Reflection: Pre-existing test/code mismatches (organization-profile route vs test expectations, missing utils exports) required updating application code to match test intent rather than patching tests. The verify-ntns API call shape (POST with `{ntnCnic}`, response `{statlStatus}`) was correctly identified from the actual route file rather than spec sample code.

## Evaluation notes (flywheel)

- Failure modes observed: Spec sample code used wrong schema names (`bulkInvoiceBatch`/`.invoices`) and wrong API call shape for verify-ntn — required reading actual source files before implementing.
- Graders run and results (PASS/FAIL): tsc PASS, eslint PASS, vitest PASS (35/35)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Add Playwright e2e coverage for the bulk upload flow
