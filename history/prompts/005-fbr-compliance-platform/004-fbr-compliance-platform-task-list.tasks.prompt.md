---
id: 004
title: FBR Compliance Platform Task List
stage: tasks
date: 2026-02-20
surface: agent
model: claude-sonnet-4-6
feature: 005-fbr-compliance-platform
branch: 005-fbr-compliance-platform
user: System Inn
command: /sp.tasks
labels: ["tasks","fbr","invoicing","draft-fix","hs-codes","immutability","ui","testing"]
links:
  spec: specs/005-fbr-compliance-platform/spec.md
  ticket: null
  adr: history/adr/001-draft-storage-server-migration.md
  pr: null
files:
  - specs/005-fbr-compliance-platform/tasks.md
tests:
  - Format validation: all 50 tasks follow [checkbox][ID][P?][Story?][description+path] format
  - User story coverage: all 6 user stories have dedicated phases
---

## Prompt

(empty — /sp.tasks invoked without additional arguments)

## Response snapshot

Generated `specs/005-fbr-compliance-platform/tasks.md` with 50 tasks organized across 9 phases:

- Phase 1 (Setup): T001–T003 — hs_code_master DB schema + db:push
- Phase 2 (Foundational): T004–T005 — HS codes service + draft API helper
- Phase 3 (US1 P1): T006–T011 — Business profile auto-create at signup, FBR per-user token
- Phase 4 (US2 P1): T012–T017 — HS Code Master API routes, manager component, search update
- Phase 5 (US3 P2): T018–T023 — Draft popup fix (delete IndexedDB useEffect), server-side save, Drafts page with search/filter/convert
- Phase 6 (US4 P2): T024–T027 — Dashboard metrics issued-only filter, From>To guard
- Phase 7 (US5 P3): T028–T032 — Immutability guard 409, read-only invoice view, FBR retry verification, token missing guidance
- Phase 8 (US6 P3): T033–T039 — Design tokens in globals.css, dashboard, sidebar, invoice form, drafts, settings, auth pages
- Phase 9 (Polish): T040–T050 — 4 Vitest unit tests, 3 Playwright e2e tests, typecheck, npm test, e2e, lint

MVP scope: Phase 1–4 (US1+US2, both P1 stories).
All 50 tasks include checkbox, ID, parallelizable marker, story label, description with exact file path.

## Outcome

- ✅ Impact: Complete, immediately-executable task list covering all 6 user stories and 40 functional requirements from spec.md
- 🧪 Tests: Format validation — all 50 tasks follow required checklist format; ADR cross-references correct
- 📁 Files: specs/005-fbr-compliance-platform/tasks.md
- 🔁 Next prompts: /sp.implement — begin executing tasks; or /sp.analyze — cross-artifact consistency check first
- 🧠 Reflection: Codebase analysis (from sp.plan session) made task writing precise — exact line numbers (T018 removes lines 103-122), exact function names, exact import paths. No guessing required.

## Evaluation notes (flywheel)

- Failure modes observed: None — tasks.md generated cleanly from existing plan/spec/data-model context
- Graders run and results (PASS/FAIL): Format check — 50/50 tasks PASS (checkbox + ID + optional P + optional Story + description with file path)
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Run /sp.implement to start executing tasks in sequence
