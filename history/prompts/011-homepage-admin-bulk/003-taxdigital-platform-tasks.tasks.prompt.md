---
id: 003
title: TaxDigital Platform Tasks
stage: tasks
date: 2026-03-25
surface: agent
model: claude-sonnet-4-6
feature: 011-homepage-admin-bulk
branch: 011-homepage-admin-bulk
user: System Inn
command: /sp.tasks
labels: ["tasks","homepage","admin","bulk-invoice","ntn-verification","implementation"]
links:
  spec: specs/011-homepage-admin-bulk/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/011-homepage-admin-bulk/tasks.md
tests:
  - none at tasks stage
---

## Prompt

/sp.tasks

## Response snapshot

Generated `specs/011-homepage-admin-bulk/tasks.md` with 18 tasks across 7 phases derived from plan.md, spec.md, research.md, data-model.md, contracts/api.md, and quickstart.md.

**Phase breakdown**:
- Phase 1 (T001–T003): Setup — verify 3 confirmed-complete prerequisites (ThemeProvider, Sidebar bulk link, Invoices page bulk button)
- Phase 2 (T004–T005) [US1 P1 MVP]: Landing page — create ContactForm.tsx client island + rewrite page.tsx full 7-section server component
- Phase 3 (T006–T007) [US2 P1]: Admin password — rewrite create-user-secret API route to accept body password + rewrite admin-client.tsx with generate/show/hide flow + CSS var replacement
- Phase 4 (T008–T011) [US3 P1]: Bulk invoice — extend upload route for xlsx/xls + create verify-ntns route + harden submit route with ntnVerified filter + rewrite bulk-client.tsx 4-step wizard
- Phase 5 (T012) [US4 P2]: Light mode theme confirmation (no code change expected per research)
- Phase 6 (T013–T014) [US5 P2]: Cleanup — remove register link from login page + replace register page with redirect
- Phase 7 (T015–T018): Quality gates — tsc → eslint → vitest → final tsc re-run

**Key architectural decisions encoded in tasks**:
- verify-ntns calls POST (not GET) `/api/fbr/verify-ntn` with `{ ntnCnic: row.buyerNTNCNIC }`, checks `statlStatus === 'active'`
- Schema table is `bulkInvoiceBatches`, column is `rows` (not `invoices`)
- Template column names are camelCase to match existing upload validator
- Submit route security hardening: `r.valid && r.ntnVerified === true`

**Total**: 18 tasks | MVP = Phase 2 (US1 landing page) | 6 parallel opportunities flagged with [P]

## Outcome

- ✅ Impact: Complete, independently-testable implementation tasks for all 6 spec tasks with no unresolved clarifications
- 🧪 Tests: No test tasks generated; Vitest quality gate in Phase 7 (T017)
- 📁 Files: specs/011-homepage-admin-bulk/tasks.md (18 tasks, 7 phases)
- 🔁 Next prompts: `/sp.implement` to execute tasks starting with T004 (MVP: US1 landing page)
- 🧠 Reflection: Tasks organized by user story priority (P1 first) enables MVP delivery of landing page independently of admin/bulk changes — implementors can ship US1 without touching US2–US5

## Evaluation notes (flywheel)

- Failure modes observed: none — all design decisions were resolved in plan.md before task generation; no clarifications needed at tasks stage
- Graders run and results (PASS/FAIL): format validation — PASS (all 18 tasks have checkbox + ID + labels + file paths)
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): run /sp.implement on T004+T005 only to validate MVP landing page delivery path
