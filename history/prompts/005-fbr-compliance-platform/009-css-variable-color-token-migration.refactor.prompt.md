---
id: 009
title: CSS Variable Color Token Migration for Invoice Components
stage: refactor
date: 2026-02-21
surface: agent
model: claude-sonnet-4-6
feature: 005-fbr-compliance-platform
branch: 005-fbr-compliance-platform
user: System Inn
command: replace hardcoded Tailwind color classes with CSS variable equivalents
labels: ["css-variables","theming","tailwind","refactor","invoice-ui"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/components/invoices/LineItemRow.tsx
  - src/components/invoices/LineItemsTable.tsx
  - src/components/invoices/BuyerSearch.tsx
  - src/components/invoices/ClientSearch.tsx
  - src/components/invoices/HSCodeSearch.tsx
  - src/components/invoices/InvoiceHeader.tsx
  - src/components/invoices/InvoiceSummary.tsx
  - src/components/invoices/NTNVerifier.tsx
  - src/components/invoices/DraftIndicator.tsx
  - src/components/invoices/InvoicePrint.tsx
tests:
  - none
---

## Prompt

Update the following files in C:\Users\System Inn\Desktop\fbrdigitalinvoicingportal by replacing all hardcoded Tailwind color classes with CSS variable equivalents. Rules:
- Replace `text-gray-*` → `text-[var(--foreground-muted)]` (or `text-[var(--foreground)]` for primary text)
- Replace `bg-white` → `bg-[var(--surface)]`
- Replace `bg-gray-*`, `bg-slate-*` → `bg-[var(--surface-2)]` or `bg-[var(--surface-3)]`
- Replace `border-gray-*`, `border-slate-*` → `border-[var(--border)]`
- Replace `text-blue-*`, `bg-blue-*`, `border-blue-*` → `text-[var(--primary)]`, `bg-[var(--primary)]`, `border-[var(--primary)]`
- Replace `text-red-*`, `bg-red-*` → `text-[var(--error)]`, `bg-[var(--error-bg)]`
- Replace `text-green-*`, `bg-green-*` → `text-[var(--positive)]`, `bg-[var(--positive-bg)]`
- Replace `focus:ring-blue-*` → `focus:ring-[var(--primary)]/20`
- Replace `focus:border-blue-*` → `focus:border-[var(--primary)]`
- Replace `hover:bg-gray-*` → `hover:bg-[var(--surface-2)]`
- Replace `text-gray-400` or similar subtle text → `text-[var(--foreground-subtle)]`
- For input fields add/replace: `bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors`
- For primary buttons: `bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white`
- DO NOT change any TypeScript types, interfaces, props, logic, API calls, event handlers, or import statements (except for removing unused color imports)
- DO NOT change SVG fill attributes that are brand colors (like Google logo)
- Keep all functional code completely unchanged

Files to update: LineItemRow.tsx, LineItemsTable.tsx, BuyerSearch.tsx, ClientSearch.tsx, HSCodeSearch.tsx, InvoiceHeader.tsx, InvoiceSummary.tsx, NTNVerifier.tsx, DraftIndicator.tsx, InvoicePrint.tsx, InvoiceHeader.tsx

## Response snapshot

All 10 invoice component files were updated with CSS variable color tokens. Every hardcoded Tailwind color class was replaced with the corresponding CSS variable equivalent per the mapping rules. No TypeScript types, logic, API calls, event handlers, or import statements were modified. SVG fills and brand colors (indigo for master codes, yellow for warning states) were preserved where they are not covered by the variable mapping. All functional code remains unchanged.

## Outcome

- Impact: All 10 invoice UI components now use CSS design-token variables instead of hardcoded Tailwind palette classes, enabling consistent theme switching (dark/light/custom) without modifying component files.
- Tests: No tests added or run — pure style refactor with no logic changes.
- Files: 10 files modified under src/components/invoices/
- Next prompts: Verify CSS variables are defined in globals.css; run visual regression if available; extend same migration to remaining dashboard and settings components.
- Reflection: Mapping was straightforward. Kept yellow/amber warning states as-is (no CSS variable defined for that semantic). Indigo master-code section preserved as a distinct visual accent not covered by the token set.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): none
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Add --warning and --warning-bg CSS variables and migrate remaining yellow/amber classes in a follow-up pass.
