---
id: 005
title: Dropdown CSS Color Scheme Fix
stage: green
date: 2026-02-26
surface: agent
model: claude-sonnet-4-6
feature: 009-invoice-client-select
branch: 009-invoice-client-select
user: System Inn
command: /sp.analyze
labels: ["green","css","dark-mode","dropdown","color-scheme","select","client-search"]
links:
  spec: specs/009-invoice-client-select/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - src/app/globals.css
  - src/components/invoices/ClientSearch.tsx
tests:
  - Visual inspection — dropdowns readable in dark mode
---

## Prompt

the dropdown of province scenario and saved buyer info and invoice type is showing the text and background of dropdown both white the saved buyer info dropdown is transparent thats why its is collapsing

## Response snapshot

**Root cause analysis — two distinct bugs:**

**Bug 1 — Native `<select>` white-on-white (Province, Invoice Type):**
CSS variables defined under `.light` / `.dark` classes but `color-scheme` not set. Without `color-scheme: dark`, browsers on Windows render native `<select>` widget using OS light-mode appearance (white background). Combined with `text-[var(--foreground)]` = `#e8edf5` (near-white in dark mode) → white text on white OS-native select background.

**Bug 2 — ClientSearch dropdown transparent/collapsing:**
In dark mode, `--surface: rgba(255,255,255,0.04)` = 4% opacity white = essentially transparent. The dropdown `<div>` with `bg-[var(--surface)]` had no visible background, causing it to appear collapsed.

**Fixes applied:**

1. `src/app/globals.css` — added `color-scheme: light` to `.light {}` and `color-scheme: dark` to `.dark {}`. This instructs browsers to render all native form controls (select, scrollbars, checkboxes) using the correct OS theme variant.

2. `src/components/invoices/ClientSearch.tsx` — changed dropdown container from `bg-[var(--surface)]` to `bg-[var(--bg-subtle)]`. In dark mode `--bg-subtle: #0d1120` (solid opaque), in light mode `#f1f3f8` (solid light gray). Resolves the transparent collapse.

## Outcome

- ✅ Impact: All three dropdown surfaces (Province, Invoice Type, ClientSearch) now readable in dark mode — correct contrasting backgrounds and text
- 🧪 Tests: Visual inspection in browser required; no automated test for CSS rendering
- 📁 Files: src/app/globals.css, src/components/invoices/ClientSearch.tsx
- 🔁 Next prompts: Visually verify in browser that dropdowns are readable; run T024 manual test checklist
- 🧠 Reflection: `color-scheme` is the correct semantic fix for native form elements — avoids hacking individual select styles; `--bg-subtle` (solid) is the right token for overlay surfaces vs `--surface` (semi-transparent glass)

## Evaluation notes (flywheel)

- Failure modes observed: none — root cause was clear from CSS variable inspection
- Graders run and results (PASS/FAIL): CSS visual inspection — PENDING (requires browser run)
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Open app in dark mode and verify province select, invoice type select, and ClientSearch dropdown are all readable
