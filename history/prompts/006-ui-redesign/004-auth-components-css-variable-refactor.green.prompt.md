---
id: 004
title: Auth Components CSS Variable Refactor
stage: green
date: 2026-02-21
surface: agent
model: claude-sonnet-4-6
feature: 006-ui-redesign
branch: 005-fbr-compliance-platform
user: System Inn
command: replace hardcoded Tailwind color classes with CSS variable equivalents in auth components
labels: ["ui", "refactor", "css-variables", "auth", "tailwind"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/components/auth/LoginForm.tsx
  - src/components/auth/RegisterForm.tsx
  - src/components/auth/ForgotPasswordForm.tsx
  - src/components/auth/ResetPasswordForm.tsx
  - src/components/auth/SetupOrganizationForm.tsx
  - src/components/auth/SocialLoginButton.tsx
tests:
  - none
---

## Prompt

Update the following auth component files in C:\Users\System Inn\Desktop\fbrdigitalinvoicingportal by replacing ALL hardcoded Tailwind color classes with CSS variable equivalents. Rules:
- Replace `text-gray-700`, `text-gray-600`, `text-gray-900` → `text-[var(--foreground-muted)]` for labels, `text-[var(--foreground)]` for headings
- Replace `text-gray-400` → `text-[var(--foreground-subtle)]`
- Replace `bg-white` → `bg-[var(--surface)]`
- Replace `bg-gray-50`, `hover:bg-gray-50` → `bg-[var(--surface-2)]`, `hover:bg-[var(--surface-2)]`
- Replace `border-gray-300`, `border-gray-200` → `border-[var(--border)]`
- Replace `text-blue-600`, `text-blue-500` → `text-[var(--primary)]`
- Replace `hover:text-blue-700` → `hover:text-[var(--primary-hover)]`
- Replace `bg-blue-600`, `bg-blue-500` → `bg-[var(--primary)]`
- Replace `hover:bg-blue-700` → `hover:bg-[var(--primary-hover)]`
- Replace `focus:ring-blue-500`, `focus:ring-blue-*` → `focus:ring-[var(--primary)]/20`
- Replace `focus:border-blue-500` → `focus:border-[var(--primary)]`
- Replace `text-red-600`, `text-red-500` → `text-[var(--error)]`
- Replace `bg-red-*` → `bg-[var(--error-bg)]`
- For ALL `<input>` and `<select>` and `<textarea>` elements, replace className with: `w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors`
- For submit/primary buttons: `w-full rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2 text-sm font-medium text-white transition-all disabled:opacity-50`
- For labels: `block text-sm font-medium text-[var(--foreground-muted)] mb-1`
- DO NOT change any TypeScript types, interfaces, props, logic, API calls, or import statements
- DO NOT change SVG fill attributes

Files to update:
1. src/components/auth/LoginForm.tsx
2. src/components/auth/RegisterForm.tsx
3. src/components/auth/ForgotPasswordForm.tsx
4. src/components/auth/ResetPasswordForm.tsx
5. src/components/auth/SetupOrganizationForm.tsx
6. src/components/auth/SocialLoginButton.tsx

## Response snapshot

All 6 auth component files were updated successfully. Every hardcoded Tailwind color class was replaced with its CSS variable equivalent:

- All `<input>` elements received the standard field className using `--surface-2`, `--border`, `--foreground`, `--foreground-subtle`, and `--primary` variables.
- All `<label>` elements received `block text-sm font-medium text-[var(--foreground-muted)] mb-1`.
- All submit buttons received the standard primary button className using `--primary` and `--primary-hover` variables.
- All `text-gray-*` on body text replaced with `text-[var(--foreground-muted)]` or `text-[var(--foreground-subtle)]` as appropriate.
- Headings (`text-gray-900`) replaced with `text-[var(--foreground)]`.
- Error messages (`text-red-600`) replaced with `text-[var(--error)]`.
- Links (`text-blue-600`) replaced with `text-[var(--primary)]`.
- SocialLoginButton border/bg/text replaced with `--border`, `--surface`, `--foreground-muted`, `--surface-2`.
- No TypeScript logic, imports, props, or SVG fill attributes were changed.
- `rounded-md` upgraded to `rounded-lg` throughout for visual consistency with the new design system.

## Outcome

- Impact: All 6 auth components now use the design-token CSS variable system instead of hardcoded Tailwind palette classes, enabling theme switching and consistent theming across light/dark modes.
- Tests: No automated tests added; visual regression testing recommended.
- Files: 6 files modified under src/components/auth/
- Next prompts: Apply the same CSS variable refactor to dashboard layout components, or verify CSS variable definitions exist in globals.css.
- Reflection: Straightforward mechanical replacement. The `rounded-md` to `rounded-lg` upgrade was applied consistently to match the new design language described in the task rules for buttons and inputs.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): none
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): verify --primary, --primary-hover, --surface, --surface-2, --border, --foreground, --foreground-muted, --foreground-subtle, --error CSS custom properties are defined in globals.css
