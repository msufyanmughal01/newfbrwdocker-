---
id: 003
title: Client Selector Tasks Generated
stage: tasks
date: 2026-02-26
surface: agent
model: claude-sonnet-4-6
feature: 009-invoice-client-select
branch: 009-invoice-client-select
user: System Inn
command: /sp.tasks
labels: ["tasks","invoice","client-selector","component-upgrade","ux"]
links:
  spec: specs/009-invoice-client-select/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/009-invoice-client-select/tasks.md
tests:
  - none run
---

## Prompt

/sp.tasks

## Response snapshot

Generated `tasks.md` for `009-invoice-client-select` with 24 tasks across 6 phases.

**Total tasks**: 24
**Files affected**: 2 (`ClientSearch.tsx`, `InvoiceHeader.tsx`)
**No API changes, no schema changes, no new dependencies.**

Task breakdown by user story:
- Phase 1 (Setup): T001–T002 (2 tasks) — read existing files
- Phase 2 (Foundational): T003–T005 (3 tasks) — state refactor, fetch logic, remove 2-char guard
- Phase 3 (US1 Browse & Select — P1): T006–T011 (6 tasks) — trigger, list render, loading/empty/error states, auto-fill verify
- Phase 4 (US2 Filter — P2): T012–T015 (4 tasks) — filter input, client-side filter logic, no-match state, reset on close
- Phase 5 (US3 Clear — P3): T016–T018 (3 tasks) — clear button, handleClear(), re-fetch on reopen
- Phase 6 (Polish): T019–T024 (6 tasks) — InvoiceHeader relocation, label, keyboard nav, BuyerSearch regression, final validation

MVP scope: Phases 1–3 (US1 only) — browse + select functional in 11 tasks.

## Outcome

- ✅ Impact: 24 actionable tasks; immediately executable by /sp.implement
- 🧪 Tests: none (not requested in spec)
- 📁 Files: specs/009-invoice-client-select/tasks.md
- 🔁 Next prompts: /sp.implement to execute tasks
- 🧠 Reflection: Tight scope (2 files) means phases are thin; US2 and US3 can be parallelised after US1 checkpoint

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): format validation — all 24 tasks have checkbox, ID, story label (where applicable), and file path
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): /sp.implement starting with Phase 1+2+3 for MVP
