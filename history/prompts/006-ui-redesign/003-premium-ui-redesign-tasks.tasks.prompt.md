---
id: 003
title: Premium UI Redesign Task Generation
stage: tasks
date: 2026-02-21
surface: agent
model: claude-sonnet-4-6
feature: 006-ui-redesign
branch: 006-ui-redesign
user: System Inn
command: /sp.tasks
labels: ["ui-redesign","dark-mode","design-system","tasks","planning"]
links:
  spec: specs/006-ui-redesign/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/006-ui-redesign/tasks.md
tests:
  - Format validation: all 58 tasks follow checkbox+ID+label+path format
  - Each user story has independent test criteria defined
  - Parallel opportunities identified and marked [P]
---

## Prompt

/sp.tasks (empty args — operates on current branch 006-ui-redesign with all plan artifacts available)

## Response snapshot

Generated `specs/006-ui-redesign/tasks.md` with 58 tasks across 8 phases organized by user story.

**Task breakdown**:
- Phase 1 (Setup): T001 — install next-themes (1 task)
- Phase 2 (Foundational): T002–T004 — globals.css, ThemeProvider, layout.tsx (3 tasks, blocks all stories)
- Phase 3 (US1 Theme Toggle P1): T005–T007 — ThemeToggle, Header rewrite, Sidebar rewrite (3 tasks)
- Phase 4 (US2 Dashboard P1): T008–T012 — MetricCard, DashboardContent, page, DateRangePicker, RevenueTrendChart (5 tasks)
- Phase 5 (US3 Invoice Form P2): T013–T026 — InvoiceStatusBadge, 10 invoice sub-components (parallelizable), invoice-form-client.tsx, new/page.tsx (14 tasks)
- Phase 6 (US4 Tables P2): T027–T036 — ClientsTable, ClientFormModal, drafts, HS codes, 5 pages (10 tasks)
- Phase 7 (US5 Auth P3): T037–T048 — auth layout, 6 auth forms, 5 auth pages (12 tasks)
- Phase 8 (Polish): T049–T058 — settings, members, print page, 4 verification gates (10 tasks)

**Key design decisions in tasks**:
- US3 invoice sub-components (T014–T024) are all parallelizable — 11 different files
- US5 auth components (T038–T048) all parallelizable — 11 different files
- US1 must complete before US2 (Header contains the ThemeToggle)
- US3, US4, US5 can run in parallel after Phase 2
- 39 of 58 tasks are marked [P]

**MVP path**: Just 7 tasks (T001–T007) deliver a working theme toggle as US1 MVP.

## Outcome

- ✅ Impact: 58 immediately executable tasks ready for /sp.implement
- 🧪 Tests: No test tasks (not requested in spec) — verification gates T055–T058 instead
- 📁 Files: specs/006-ui-redesign/tasks.md
- 🔁 Next prompts: /sp.implement to execute tasks starting with Phase 1
- 🧠 Reflection: 58 tasks vs the ~50 estimated in plan — additional members-client.tsx and settings-client.tsx files added correct scoping

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): Format check — all tasks have checkbox+ID+[P]?+[Story]?+description+filepath
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Run /sp.implement starting with T001–T004 to establish foundation
