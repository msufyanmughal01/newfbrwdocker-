---
id: 002
title: TaxDigital Platform Overhaul Plan
stage: plan
date: 2026-03-25
surface: agent
model: claude-sonnet-4-6
feature: 011-homepage-admin-bulk
branch: 011-homepage-admin-bulk
user: System Inn
command: /sp.plan
labels: ["plan","homepage","admin","bulk-invoice","ntn-verification","architecture"]
links:
  spec: specs/011-homepage-admin-bulk/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/011-homepage-admin-bulk/plan.md
  - specs/011-homepage-admin-bulk/research.md
  - specs/011-homepage-admin-bulk/data-model.md
  - specs/011-homepage-admin-bulk/quickstart.md
  - specs/011-homepage-admin-bulk/contracts/api.md
tests:
  - none at plan stage
---

## Prompt

/sp.plan

## Response snapshot

Executed full Phase 0 + Phase 1 planning for the 011-homepage-admin-bulk feature.

**Key research findings**:
- Theme already defaults to light — no changes needed to ThemeProvider or layout
- NTN verify route is POST (not GET), accepts `{ ntnCnic }`, returns `statlStatus: 'active' | 'inactive' | 'unknown'` — spec's sample code was incorrect and corrected in plan
- Schema table is `bulkInvoiceBatches` with `rows` column (not `bulkInvoiceBatch` with `invoices`)
- Template columns must use camelCase names matching existing upload validator
- Sidebar and invoices page already have Bulk Upload link/button — no changes needed
- Login page has self-register link needing removal; register page needs redirect
- All dependencies already installed (xlsx, next-themes)

**Architecture decisions**:
1. Template uses camelCase field names (existing convention) — avoids upload route changes
2. verify-ntns calls POST `/api/fbr/verify-ntn` with `{ ntnCnic }` and checks `statlStatus === 'active'`
3. Submit route updated server-side to require `ntnVerified === true` (security hardening)

**Files to create**: `src/components/home/ContactForm.tsx`, `src/app/api/bulk-invoices/verify-ntns/route.ts`
**Files to rewrite**: `src/app/page.tsx`, `src/app/admin/admin-client.tsx`, `src/app/api/admin/create-user-secret/route.ts`, `src/app/(dashboard)/invoices/bulk/bulk-client.tsx`, `src/app/(auth)/register/page.tsx`
**Files to modify**: `src/app/(auth)/login/page.tsx`, `src/app/api/bulk-invoices/upload/route.ts`, `src/app/api/bulk-invoices/submit/route.ts`

**Artifacts created**: plan.md, research.md, data-model.md, quickstart.md, contracts/api.md

## Outcome

- ✅ Impact: Complete architecture and implementation plan for all 6 tasks with no unresolved clarifications
- 🧪 Tests: No tests at plan stage; Vitest is the runner for implementation stage
- 📁 Files: 5 planning artifacts created
- 🔁 Next prompts: `/sp.tasks` to generate testable implementation tasks
- 🧠 Reflection: The spec's sample code for verify-ntns had multiple wrong assumptions (GET vs POST, wrong response fields, wrong schema names) — research phase caught all of these before implementation

## Evaluation notes (flywheel)

- Failure modes observed: spec sample code had incorrect API call pattern for NTN verification — always read actual route files before trusting spec sample code
- Graders run and results (PASS/FAIL): constitution check — PASS (all 10 principles)
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): run /sp.tasks to validate task decomposition fits within implementation constraints
