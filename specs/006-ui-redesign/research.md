# Research: Premium UI Redesign with Dark/Light Mode

**Feature**: `006-ui-redesign` | **Branch**: `006-ui-redesign` | **Date**: 2026-02-21

---

## Decision 1: next-themes Integration with Next.js 16 + React 19

**Decision**: Use `next-themes` v0.4+ with `attribute="class"` and `defaultTheme="dark"`.

**Rationale**:
- next-themes v0.4+ explicitly supports React 19 and Next.js App Router.
- `attribute="class"` instructs next-themes to set `class="dark"` or `class="light"` on `<html>`, which is exactly what our CSS `.dark {}` / `.light {}` selectors target.
- `suppressHydrationWarning` on `<html>` is the standard fix for server/client class mismatch — React skips the attribute warning for that single element.
- `enableSystem` automatically reads `window.matchMedia('(prefers-color-scheme: dark)')` for first-time visitors.

**Alternatives considered**:
- Manual localStorage + `useEffect` toggle: Works but reinvents what next-themes provides, adds hydration flicker without `suppressHydrationWarning`, and requires managing persistence manually.
- CSS `prefers-color-scheme` media query only: Doesn't support user override; no persistent choice.

**Finding**: `next-themes` is not yet in `package.json` — must be installed before implementation begins.

---

## Decision 2: Tailwind CSS v4 + CSS Custom Properties Pattern

**Decision**: Use `bg-[var(--token)]` arbitrary value syntax in Tailwind v4. Define all color/shadow tokens as CSS custom properties in `.light {}` and `.dark {}` class blocks in `globals.css`.

**Rationale**:
- Tailwind v4 uses `@import "tailwindcss"` and supports arbitrary values natively — `bg-[var(--surface)]` resolves at build time correctly.
- Defining tokens in `.dark {}` and `.light {}` class blocks means CSS vars cascade from the `<html>` class automatically — zero JavaScript re-render needed for color updates.
- The current `globals.css` already uses `@theme inline` for Tailwind color tokens. The new approach replaces this with explicit CSS var blocks and uses arbitrary value classes instead of semantic Tailwind color names (like `bg-indigo-600`), keeping implementation explicit and consistent.
- No `tailwind.config.js` is needed (none exists; Tailwind v4 configures via CSS).

**Tailwind dark mode configuration**: Since we're using `.dark {}` / `.light {}` class selectors (not Tailwind's `dark:` prefix), no Tailwind dark mode variant configuration is needed. The CSS cascade handles everything.

**Alternatives considered**:
- Using Tailwind's `dark:` prefix variant: Requires configuring `@custom-variant dark (&:is(.dark *))` in Tailwind v4 CSS. Adds complexity and mixes two styling paradigms. The direct CSS var approach is simpler.
- CSS-in-JS per-component theming: Overkill, introduces runtime cost, conflicts with Tailwind.

---

## Decision 3: Font Strategy — Google Fonts via CSS Import

**Decision**: Replace Geist fonts (loaded via `next/font/google`) with DM Sans and DM Mono loaded via `@import url(...)` in `globals.css`. Remove `Geist` and `Geist_Mono` from `layout.tsx`.

**Rationale**:
- The feature spec explicitly requires `@import url('https://fonts.googleapis.com/...')` in CSS.
- Removes the `--font-geist-sans` / `--font-geist-mono` CSS variable assignments from layout.tsx, simplifying font management.
- `globals.css` defines `--font-sans: 'DM Sans', system-ui, sans-serif` and `--font-mono: 'DM Mono', monospace` in `:root`.
- The `body { font-family: var(--font-sans) }` rule applies the font globally.

**Trade-off**: `next/font/google` provides self-hosting and font display optimization. The CSS `@import` approach is slightly slower (separate font request). For this project, the simplicity and spec compliance outweigh this minor performance consideration.

**Alternatives considered**:
- Keep Geist + use `next/font/google` for DM Sans: Would work but leaves two font systems, adds layout.tsx complexity.

---

## Decision 4: ThemeProvider Placement

**Decision**: Create `src/components/ThemeProvider.tsx` as a Client Component. Import and use it in `src/app/layout.tsx` to wrap `children`. Add `suppressHydrationWarning` to `<html>`.

**Rationale**:
- `layout.tsx` is a Server Component in Next.js App Router. `ThemeProvider` from next-themes requires `"use client"` because it uses React context and browser APIs.
- Wrapping only `children` (not the entire `<html>`) is the correct pattern — it keeps the `<html>` and `<body>` in the Server Component tree where SSR class resolution happens.
- The pattern from next-themes documentation: `<html suppressHydrationWarning><body><ThemeProvider>{children}</ThemeProvider></body></html>`.

**Finding**: Current `layout.tsx` uses `<html lang="en">` without `suppressHydrationWarning`. This will cause a React warning when next-themes sets the class attribute client-side if not suppressed.

---

## Decision 5: Badge Component Design

**Decision**: Create a new `src/components/ui/Badge.tsx` component with `variant` prop accepting: `draft | issued | validated | failed | submitting | validating | registered | unregistered`.

**Rationale**:
- Current `InvoiceStatusBadge.tsx` exists but uses hardcoded color classes. We can either update it or create a shared `Badge` component.
- Decision: **Update `InvoiceStatusBadge.tsx` in-place** rather than creating a separate component, since it already handles invoice status variants. Update `ClientsTable.tsx` to use inline badge styles with CSS vars for the registration type badge.
- The badge pattern: `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium` + semantic color classes via CSS vars.

---

## Decision 6: Inline Style vs Tailwind Classes for CSS Var Usage

**Decision**: Use **Tailwind arbitrary value classes** (`bg-[var(--surface)]`) where possible, and inline `style` only for properties Tailwind cannot express (e.g., `backdropFilter`, `WebkitBackdropFilter`, gradients with CSS vars, `boxShadow` with CSS vars).

**Rationale**:
- Tailwind v4 arbitrary values work for all standard CSS properties: `bg-[var(--x)]`, `text-[var(--x)]`, `border-[var(--x)]`.
- `shadow-[var(--shadow)]` is supported as an arbitrary value in Tailwind v4.
- `backdrop-blur-xl` is a Tailwind utility that doesn't need a CSS var.
- For complex multi-value properties like `box-shadow` with the custom shadow tokens, using `shadow-[var(--shadow)]` is valid.

**Finding**: The existing Sidebar and Header use inline `style={{}}` extensively with hardcoded dark colors. These should be migrated to Tailwind classes with CSS vars where possible.

---

## Decision 7: Scope of Files to Update

**Full inventory of files with hardcoded color classes** (from codebase grep):

**App pages (13)**:
- `src/app/(dashboard)/clients/page.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/invoices/drafts/page.tsx`
- `src/app/(dashboard)/invoices/invoice-form-client.tsx`
- `src/app/(dashboard)/invoices/new/page.tsx`
- `src/app/(dashboard)/invoices/page.tsx`
- `src/app/(dashboard)/invoices/[id]/page.tsx`
- `src/app/(dashboard)/invoices/[id]/print/page.tsx`
- `src/app/(dashboard)/members/page.tsx`
- `src/app/(dashboard)/settings/business-profile/page.tsx`
- `src/app/(dashboard)/settings/hs-codes/page.tsx`
- `src/app/(dashboard)/settings/settings-client.tsx`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `src/app/(auth)/setup-organization/page.tsx`

**Components (20)**:
- `src/components/auth/ForgotPasswordForm.tsx`
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/components/auth/ResetPasswordForm.tsx`
- `src/components/auth/SetupOrganizationForm.tsx`
- `src/components/auth/SocialLoginButton.tsx`
- `src/components/clients/ClientFormModal.tsx`
- `src/components/clients/ClientsTable.tsx`
- `src/components/dashboard/DateRangePicker.tsx`
- `src/components/dashboard/RevenueTrendChart.tsx`
- `src/components/invoices/BuyerSearch.tsx`
- `src/components/invoices/ClientSearch.tsx`
- `src/components/invoices/DraftIndicator.tsx`
- `src/components/invoices/FBRErrorDisplay.tsx`
- `src/components/invoices/HSCodeSearch.tsx`
- `src/components/invoices/InvoiceHeader.tsx`
- `src/components/invoices/InvoicePrint.tsx`
- `src/components/invoices/InvoiceStatusBadge.tsx`
- `src/components/invoices/InvoiceSummary.tsx`
- `src/components/invoices/LineItemRow.tsx`
- `src/components/invoices/LineItemsTable.tsx`
- `src/components/invoices/NTNVerifier.tsx`
- `src/components/invoices/SubmissionStatus.tsx`
- `src/components/settings/BusinessProfileForm.tsx`
- `src/components/settings/HSCodeMasterManager.tsx`

**Total**: ~38 files need updating (plus 3 new files, 5 full rewrites).

---

## Decision 8: Auth Layout — Theme Awareness

**Decision**: Update `src/app/(auth)/layout.tsx` to replace hardcoded dark colors with CSS var tokens.

**Finding**: The auth layout currently uses hardcoded `rgba(15, 15, 26, 0.8)` backgrounds. These must be replaced with CSS var equivalents so light mode renders correctly. The glassmorphism card uses `rgba(255,255,255,0.05)` which is fine in dark mode but invisible-ish in light mode — should use `bg-[var(--surface)]`.

---

## Resolved: All NEEDS CLARIFICATION items

No `[NEEDS CLARIFICATION]` markers were present in the spec. All decisions above are confirmed from codebase analysis.
