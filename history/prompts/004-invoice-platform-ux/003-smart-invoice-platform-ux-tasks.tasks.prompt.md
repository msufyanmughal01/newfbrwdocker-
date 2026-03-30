---
id: 003
title: Smart Invoice Platform UX Tasks
stage: tasks
date: 2026-02-17
surface: agent
model: claude-sonnet-4-5-20250929
feature: 004-invoice-platform-ux
branch: 004-invoice-platform-ux
user: system-inn
command: /sp.tasks
labels: ["business-profile", "client-registry", "analytics-dashboard", "draft-workflow", "modern-ui", "drizzle", "recharts", "task-generation"]
links:
  spec: specs/004-invoice-platform-ux/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/004-invoice-platform-ux/tasks.md
tests:
  - none (task generation phase)
---

## Prompt

/sp.tasks (for 004-invoice-platform-ux)

## Response snapshot

Generated `specs/004-invoice-platform-ux/tasks.md` with 48 tasks across 8 phases for the Smart Invoice Platform UX Enhancement feature.

**Phase structure:**
- Phase 1 (Setup, 3 tasks): Install recharts, create uploads directory, update .env.example
- Phase 2 (Foundational, 5 tasks): business_profiles schema, clients schema, schema index exports, AES-256 encryption util, Drizzle migration
- Phase 3 (US1 — Business Profile, 9 tasks): DB service, GET/PUT API routes, logo upload route, BusinessProfileForm component, settings page, Sidebar nav link, /invoices/new server component modification, InvoiceFormClient defaultValues
- Phase 4 (US2 — Client Registry, 11 tasks): client service, GET/POST/PUT/DELETE API routes, ClientFormModal, ClientsTable, Clients page, ClientSearch combobox, InvoiceHeader integration, Sidebar nav link
- Phase 5 (US3 — Draft Workflow, 4 tasks): Drafts page, invoices list filter update, DELETE draft API, Sidebar nav link
- Phase 6 (US4 — Analytics Dashboard, 6 tasks): metrics aggregation service, GET /api/dashboard/metrics, MetricCard, DateRangePicker, RevenueTrendChart, dashboard page modification
- Phase 7 (US5 — Design System, 6 tasks): glassmorphism applied to dashboard, settings, invoices, drafts, clients pages, responsive verification
- Phase 8 (Polish, 4 tasks): console.log cleanup, gitignore for uploads, quickstart validation, task marking

**Key metrics:**
- 48 total tasks; 24 parallelizable [P] tasks
- MVP = Phase 1+2+3+4 (US1+US2) — eliminates seller and buyer repetitive entry
- US1, US2, US3, US4 can all run in parallel after Phase 2 completes
- No automated test tasks (not requested in spec)
- Single new dependency: recharts

## Outcome

- ✅ Impact: 48 actionable tasks covering all 5 user stories; immediately executable with full file paths
- 🧪 Tests: Manual validation via quickstart.md scenarios (T047); no automated tests requested
- 📁 Files: specs/004-invoice-platform-ux/tasks.md
- 🔁 Next prompts: `/sp.implement` to execute tasks phase by phase
- 🧠 Reflection: US1 and US2 are both P1 stories — sequencing them separately (Phase 3 then Phase 4) ensures each is independently testable; US3/US4 have no cross-dependencies so can truly parallelize

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): none (task generation phase)
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): run /sp.implement starting with Phase 1 (Setup) tasks
