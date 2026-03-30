---
id: 002
title: Premium UI Redesign Architecture Plan
stage: plan
date: 2026-02-21
surface: agent
model: claude-sonnet-4-6
feature: 006-ui-redesign
branch: 006-ui-redesign
user: System Inn
command: /sp.plan
labels: ["ui-redesign","dark-mode","design-system","tailwind","next-themes","architecture","plan"]
links:
  spec: specs/006-ui-redesign/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/006-ui-redesign/plan.md
  - specs/006-ui-redesign/research.md
  - specs/006-ui-redesign/data-model.md
  - specs/006-ui-redesign/quickstart.md
  - specs/006-ui-redesign/contracts/design-system.md
tests:
  - Constitution check: all 10 principles pass
  - Gate 1: zero hardcoded color class check defined
  - Gate 2: TypeScript compilation check defined
  - Gate 3: build success check defined
  - Gate 4: manual visual verification checklist defined
---

## Prompt

/sp.plan (empty args — operates on current branch 006-ui-redesign)

## Response snapshot

Generated complete implementation plan for the Premium UI Redesign feature (`006-ui-redesign`).

**Artifacts produced**:

1. `research.md` — 8 resolved decisions covering: next-themes v0.4+ compatibility with React 19/Next.js 16; CSS var approach with `.dark`/`.light` class blocks + Tailwind arbitrary values; DM Sans via CSS `@import`; ThemeProvider placement inside `<body>` in layout.tsx; Badge component strategy (update InvoiceStatusBadge in-place); inline style vs Tailwind class guidance; full file inventory (43 files: 2 new, 5 full rewrites, 36 updates); auth layout theme-awareness.

2. `data-model.md` — Complete design token system documenting all CSS custom properties with light/dark values for all categories (bg, surface, border, foreground, primary, accent, semantic status, shadows, radius). Component interface contracts for ThemeProvider, ThemeToggle, Badge/InvoiceStatusBadge, MetricCard, Sidebar, Header. State transition diagram for theme switching.

3. `contracts/design-system.md` — Binding contract with 8 rules: forbidden hardcoded classes, required CSS var pattern, token mapping table, standard input/button/badge/table/modal patterns, verification bash command.

4. `quickstart.md` — Developer guide with implementation order (7 layers), verification commands, copy-paste design patterns, and do-not-touch file list.

5. `plan.md` — Full implementation plan with: technical context, constitution check (all 10 pass), project structure tree, Phase 0 research summary, Phase 1 design artifacts, 7 implementation phases (A-G), 4 verification gates, 3 risks with mitigations, ADR assessment (none warranted).

**Key findings from codebase analysis**:
- 43 files need updating (higher than the 25 listed in the spec — additional invoice sub-components found)
- Current globals.css uses dark-only CSS vars; full rewrite needed
- next-themes not yet in package.json — install required first
- Tailwind v4 with `@tailwindcss/postcss` — no tailwind.config.js, CSS-first configuration
- Dashboard layout.tsx is already clean (server component, no hardcoded colors)
- backdrop-filter opacity combination needs careful handling (Risk 3 documented)

## Outcome

- ✅ Impact: Complete architectural plan ready for task generation and implementation
- 🧪 Tests: 4 verification gates defined with specific commands and acceptance criteria
- 📁 Files: 5 artifacts created across specs/006-ui-redesign/
- 🔁 Next prompts: /sp.tasks to generate dependency-ordered task list; /sp.implement to execute
- 🧠 Reflection: Codebase had more files needing update than the spec listed (38 vs 25) — research phase surfaced the additional invoice sub-components correctly

## Evaluation notes (flywheel)

- Failure modes observed: backdrop-filter opacity with CSS vars is a potential Tailwind v4 gotcha — documented in Risks
- Graders run and results (PASS/FAIL): Constitution check — all 10 PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Run /sp.tasks then /sp.implement with Layer 1 (Foundation) tasks first
