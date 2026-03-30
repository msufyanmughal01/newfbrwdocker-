---
id: 002
title: Responsive Rebrand Implementation Plan
stage: plan
date: 2026-02-26
surface: agent
model: claude-sonnet-4-6
feature: 008-responsive-rebrand
branch: 008-responsive-rebrand
user: System Inn
command: /sp.plan
labels: ["responsive","mobile","rebrand","taxdigital","architecture","sidebar","tailwind"]
links:
  spec: specs/008-responsive-rebrand/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/008-responsive-rebrand/plan.md
  - specs/008-responsive-rebrand/research.md
  - specs/008-responsive-rebrand/data-model.md
  - specs/008-responsive-rebrand/quickstart.md
  - specs/008-responsive-rebrand/contracts/no-new-apis.md
  - history/prompts/008-responsive-rebrand/002-responsive-rebrand-implementation-plan.plan.prompt.md
tests:
  - none
---

## Prompt

(empty — /sp.plan invoked on active feature branch 008-responsive-rebrand)

## Response snapshot

Generated full implementation plan for the responsive design + TaxDigital rebrand feature.

**Phase 0 — Research** (`research.md`):
- Decision 1: Dual-mode sidebar (desktop toggle + mobile drawer overlay). No new dependencies.
- Decision 2: `overflow-x-auto` wrappers for all data tables. No card-view rewrites.
- Decision 3: 16 product brand labels changed; 6 FBR authority/compliance labels preserved unchanged.
- Decision 4: Tailwind built-in `md:` / `lg:` breakpoints only.
- Decision 5: Viewport meta handled automatically by Next.js.

**Phase 1 — Design** (`data-model.md`, `contracts/`, `quickstart.md`):
- No new database entities, no schema changes, no new API endpoints.
- New component state: `isMobileOpen: boolean` in `DashboardShell`; new `onMobileMenuToggle` prop in `Header`; new `isMobileOpen` + `onMobileClose` props in `Sidebar`.
- 17 files affected total (15 brand renames + 5 responsive structural changes).

**Architecture**: Mobile `< 768px` → sidebar renders as `position: fixed` drawer overlay with backdrop; desktop `≥ 768px` → existing expand/collapse behaviour preserved.

**Constitution check**: All 10 principles ✅ PASS. No violations.

**Agent context**: Updated `CLAUDE.md` with TypeScript 5.x, Next.js 14+, Tailwind CSS v4, Drizzle ORM.

## Outcome

- ✅ Impact: Full implementation plan with architecture, research, data model, contracts, and quickstart documented
- 🧪 Tests: No tests run (plan stage)
- 📁 Files: plan.md, research.md, data-model.md, quickstart.md, contracts/no-new-apis.md
- 🔁 Next prompts: `/sp.tasks` to generate the task list
- 🧠 Reflection: The critical insight is separating "FBR as product brand" (change) from "FBR as government authority" (preserve). Dual-mode sidebar is the right pattern — avoids a separate MobileSidebar component.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): Constitution check — all 10 PASS
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): run /sp.tasks to generate implementation tasks
