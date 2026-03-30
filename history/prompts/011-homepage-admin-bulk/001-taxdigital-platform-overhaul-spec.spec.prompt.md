---
id: 001
title: TaxDigital Platform Overhaul Spec
stage: spec
date: 2026-03-25
surface: agent
model: claude-sonnet-4-6
feature: 011-homepage-admin-bulk
branch: 011-homepage-admin-bulk
user: System Inn
command: /sp.specify
labels: ["spec","homepage","admin","bulk-invoice","light-mode","fbr"]
links:
  spec: specs/011-homepage-admin-bulk/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/011-homepage-admin-bulk/spec.md
  - specs/011-homepage-admin-bulk/checklists/requirements.md
  - history/prompts/011-homepage-admin-bulk/001-taxdigital-platform-overhaul-spec.spec.prompt.md
tests:
  - none at spec stage
---

## Prompt

You are working on the TaxDigital Next.js application. Read every file before editing it. Never guess imports or structure — check the actual codebase first. After all tasks are complete, run the full test suite and fix every error.

---

CORE RULES

- Read every file before touching it
- Never hardcode colors — always use CSS variables (var(--primary), var(--foreground), etc.)
- Never modify src/app/api/auth/ route files
- Never drop or alter organization/member/invitation database tables
- Never modify src/lib/fbr/post-invoice.ts — only read and call it
- Fix every TypeScript error and every test failure before finishing

---

TASK 1 — SET LIGHT MODE AS DEFAULT THEME
[...full prompt continues with Tasks 1–6 and verification checklist as provided by user...]

## Response snapshot

Created feature branch directory `011-homepage-admin-bulk` (no git, file-system only) and wrote a comprehensive specification covering 5 user stories across 6 tasks:

1. **US1 (P1)** — Visitor landing page: 6 acceptance scenarios covering redirect, navigation, contact form
2. **US2 (P1)** — Admin manual password creation: 6 acceptance scenarios covering generate, edit, submit, credentials reveal
3. **US3 (P1)** — 4-step bulk invoice workflow: 7 acceptance scenarios covering template download, upload validation, NTN verification, FBR submission
4. **US4 (P2)** — Light mode default: 3 acceptance scenarios covering no-flash, stored preference
5. **US5 (P2)** — Sidebar/nav wiring: 4 acceptance scenarios covering bulk link, login page cleanup, register redirect

39 functional requirements defined across theme, landing page, admin, bulk invoice, navigation, and quality gates. 9 measurable success criteria. 8 constraints. 8 assumptions documented.

Checklist: all 12 items pass. No [NEEDS CLARIFICATION] markers. Spec ready for `/sp.plan`.

Files created:
- `specs/011-homepage-admin-bulk/spec.md`
- `specs/011-homepage-admin-bulk/checklists/requirements.md`

## Outcome

- ✅ Impact: Specification written and validated for all 6 tasks across theme, homepage, admin, bulk invoice, navigation, and quality gates
- 🧪 Tests: No tests at spec stage
- 📁 Files: 2 spec files, 1 PHR
- 🔁 Next prompts: `/sp.plan 011-homepage-admin-bulk` to create architecture and implementation plan
- 🧠 Reflection: Feature description was extremely detailed with pixel-level UI specs — translated these into user-facing, technology-agnostic requirements while preserving all acceptance criteria

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): checklist validation — PASS (all 12 items)
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): run /sp.plan to validate architectural decisions around bulk invoice schema and NTN verification flow
