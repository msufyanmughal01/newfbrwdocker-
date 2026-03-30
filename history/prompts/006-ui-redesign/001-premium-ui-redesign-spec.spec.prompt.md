---
id: 001
title: Premium UI Redesign with Dark/Light Mode Spec
stage: spec
date: 2026-02-21
surface: agent
model: claude-sonnet-4-6
feature: 006-ui-redesign
branch: 006-ui-redesign
user: System Inn
command: /sp.specify
labels: ["ui-redesign","dark-mode","design-system","tailwind","next-themes","spec"]
links:
  spec: specs/006-ui-redesign/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/006-ui-redesign/spec.md
  - specs/006-ui-redesign/checklists/requirements.md
tests:
  - Spec quality checklist validated (all items pass)
---

## Prompt

You are redesigning the entire UI of this Next.js + Tailwind CSS FBR Digital Invoicing Portal from scratch. The goal is a premium, professional, modern interface with full dark/light mode toggle. Here is exactly what to do:

- Tailwind CSS v4 / TypeScript
- All existing API routes, DB logic, auth logic stays UNTOUCHED

STEP 1 — Install Dependencies: npm install next-themes
STEP 2 — Theme Provider Setup: Create src/components/ThemeProvider.tsx using next-themes with attribute="class" defaultTheme="dark" enableSystem. Update src/app/layout.tsx to wrap in ThemeProvider, add suppressHydrationWarning on <html>, import DM Sans.
STEP 3 — globals.css Full Rewrite: Complete CSS variable design system with .light and .dark class contexts covering bg, surface, border, foreground, primary, accent, semantic status colors, and shadows.
STEP 4 — ThemeToggle Component: Sun/moon icon toggle using resolvedTheme from next-themes.
STEP 5 — Redesign ALL Components: Sidebar (240px, SVG icons), Header (56px, frosted-glass, ThemeToggle), MetricCard (hover lift), Tables (rounded container, hover rows), Status Badges (semantic semantic-color dot), Forms (surface-2 bg, primary focus ring), Buttons (primary/ghost/danger/link variants), Modals (bg-subtle panel), Empty states, Auth pages.
STEP 6 — Remove ALL hardcoded color classes from 13 pages.
STEP 7 — Update 12 component files.
STEP 8 — InvoiceFormClient: section cards, input/button styling.

DESIGN RULES: NEVER use bg-white, text-gray-*, bg-gray-*, border-gray-*, from-slate-*. ALWAYS use CSS variable tokens. Keep all business logic, API calls, and TypeScript interfaces unchanged.

[Full description includes VERIFICATION CHECKLIST for dark mode polish, light mode cleanliness, theme toggle functionality, table/modal rendering, form visibility, auth pages, status badges, no hydration errors, and TypeScript compilation.]

## Response snapshot

Created feature branch `006-ui-redesign` and wrote comprehensive specification to `specs/006-ui-redesign/spec.md`.

Spec includes:
- 5 prioritized user stories (P1: theme toggle works, P1: dashboard premium, P2: invoice form styled, P2: tables correct, P3: auth pages consistent)
- Edge cases: SSR hydration, JS-disabled, localStorage cleared, undefined resolvedTheme, mixed hardcoded/var classes
- 15 functional requirements (FR-001 to FR-015) covering ThemeProvider, ThemeToggle, CSS variables, component redesigns, zero hardcoded colors, and TS compilation
- Constraints: no changes to src/lib/ or API routes; inline SVG only; next-themes is the only new package
- 8 measurable success criteria (SC-001 to SC-008) including <200ms theme switch, zero hardcoded classes, zero TS errors, regression-free API functionality
- Assumptions and Out of Scope sections

Spec quality checklist at `specs/006-ui-redesign/checklists/requirements.md` — all items passed.

## Outcome

- ✅ Impact: Spec captures complete UI redesign scope with clear constraints protecting all business logic
- 🧪 Tests: Spec quality checklist validated — all items pass, no [NEEDS CLARIFICATION] markers
- 📁 Files: specs/006-ui-redesign/spec.md, specs/006-ui-redesign/checklists/requirements.md
- 🔁 Next prompts: /sp.plan or /sp.tasks to generate implementation plan
- 🧠 Reflection: Feature description was highly detailed and prescriptive — spec translated implementation instructions into business/user-facing requirements successfully

## Evaluation notes (flywheel)

- Failure modes observed: PowerShell create-new-feature.ps1 positional parameter error (non-blocking — branch and spec file were created successfully)
- Graders run and results (PASS/FAIL): Spec quality checklist — PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Run /sp.plan to generate architectural plan before implementation
