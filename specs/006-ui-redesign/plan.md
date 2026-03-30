# Implementation Plan: Premium UI Redesign with Dark/Light Mode

**Branch**: `006-ui-redesign` | **Date**: 2026-02-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/006-ui-redesign/spec.md`

---

## Summary

Replace the FBR Digital Invoicing Portal's dark-only, hardcoded-color UI with a premium design system using CSS custom properties and `next-themes`, enabling clean dark and light mode switching. The change affects `globals.css`, `layout.tsx`, all dashboard/auth components, and all page files. No API routes, database schemas, TypeScript interfaces, or business logic are touched.

---

## Technical Context

**Language/Version**: TypeScript 5 / Next.js 16.1.6 / React 19.2.3
**Primary Dependencies**: Tailwind CSS v4 (`@tailwindcss/postcss`), `next-themes` (to be installed), `better-auth` (untouched)
**Storage**: Neon PostgreSQL via Drizzle ORM (untouched)
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Web — Next.js App Router, server + client components
**Project Type**: Web application (single Next.js project, no separate frontend/backend)
**Performance Goals**: Theme switch < 200ms, no layout shift on toggle, no hydration flash
**Constraints**: Zero changes to `src/lib/`, `src/app/api/`, DB schema; inline SVG only; only `next-themes` added
**Scale/Scope**: ~43 files modified, 2 new files created; pure visual layer change

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Clarity** | PASS | Token names (`--foreground-muted`, `--primary-subtle`) are self-documenting |
| **II. Consistency** | PASS | All files migrate to same token system in one change; no mixed patterns |
| **III. Simplicity** | PASS | CSS vars + arbitrary Tailwind values is the simplest viable approach |
| **IV. Purpose-Driven** | PASS | Every new file/token is required by spec; no speculative additions |
| **V. Quality** | PASS | TypeScript checks required; both modes must be verified |
| **VI. Transparency** | PASS | All changes are purely visual; fully documented in this plan |
| **VII. Scalability** | PASS | Token system allows future theme variants by editing one CSS block |
| **VIII. Security** | PASS | No auth, session, or data handling changes |
| **IX. Data Integrity** | PASS | No financial calculations or DB schemas touched |
| **X. Testability** | PASS | `npx tsc --noEmit` + grep for hardcoded classes verify completion |

**Post-Design Re-check**: All gates still pass. No constitution violations detected.

---

## Project Structure

### Documentation (this feature)

```text
specs/006-ui-redesign/
├── plan.md              ← This file
├── spec.md              ← Feature requirements
├── research.md          ← Phase 0 research
├── data-model.md        ← Design token system
├── quickstart.md        ← Developer guide
├── contracts/
│   └── design-system.md ← CSS token contract + rules
└── tasks.md             ← (created by /sp.tasks)
```

### Source Code Layout (this feature's scope)

```text
src/
├── app/
│   ├── globals.css                              ← FULL REWRITE
│   ├── layout.tsx                               ← FULL REWRITE
│   ├── (auth)/
│   │   ├── layout.tsx                           ← UPDATE
│   │   ├── login/page.tsx                       ← UPDATE
│   │   ├── register/page.tsx                    ← UPDATE
│   │   ├── forgot-password/page.tsx             ← UPDATE
│   │   ├── reset-password/page.tsx              ← UPDATE
│   │   └── setup-organization/page.tsx          ← UPDATE
│   └── (dashboard)/
│       ├── layout.tsx                           ← UNTOUCHED (already clean)
│       ├── dashboard/page.tsx                   ← UPDATE
│       ├── clients/page.tsx                     ← UPDATE
│       ├── members/page.tsx                     ← UPDATE (if hardcoded classes)
│       ├── invoices/
│       │   ├── page.tsx                         ← UPDATE
│       │   ├── invoice-form-client.tsx          ← UPDATE (complex)
│       │   ├── new/page.tsx                     ← UPDATE
│       │   ├── [id]/page.tsx                    ← UPDATE
│       │   ├── [id]/print/page.tsx              ← UPDATE
│       │   └── drafts/
│       │       ├── page.tsx                     ← UPDATE
│       │       ├── DraftsClient.tsx             ← UPDATE
│       │       └── DraftDeleteButton.tsx        ← UPDATE
│       └── settings/
│           ├── business-profile/page.tsx        ← UPDATE
│           ├── hs-codes/page.tsx                ← UPDATE
│           └── settings-client.tsx              ← UPDATE
└── components/
    ├── ThemeProvider.tsx                        ← NEW
    ├── ThemeToggle.tsx                          ← NEW
    ├── auth/
    │   ├── LoginForm.tsx                        ← UPDATE
    │   ├── RegisterForm.tsx                     ← UPDATE
    │   ├── ForgotPasswordForm.tsx               ← UPDATE
    │   ├── ResetPasswordForm.tsx                ← UPDATE
    │   ├── SetupOrganizationForm.tsx            ← UPDATE
    │   └── SocialLoginButton.tsx                ← UPDATE
    ├── clients/
    │   ├── ClientsTable.tsx                     ← UPDATE
    │   └── ClientFormModal.tsx                  ← UPDATE
    ├── dashboard/
    │   ├── Sidebar.tsx                          ← FULL REWRITE
    │   ├── Header.tsx                           ← FULL REWRITE
    │   ├── MetricCard.tsx                       ← FULL REWRITE
    │   ├── DateRangePicker.tsx                  ← UPDATE
    │   └── RevenueTrendChart.tsx                ← UPDATE
    ├── invoices/
    │   ├── InvoiceStatusBadge.tsx               ← UPDATE
    │   ├── BuyerSearch.tsx                      ← UPDATE
    │   ├── ClientSearch.tsx                     ← UPDATE
    │   ├── DraftIndicator.tsx                   ← UPDATE
    │   ├── FBRErrorDisplay.tsx                  ← UPDATE
    │   ├── HSCodeSearch.tsx                     ← UPDATE
    │   ├── InvoiceHeader.tsx                    ← UPDATE
    │   ├── InvoicePrint.tsx                     ← UPDATE
    │   ├── InvoiceSummary.tsx                   ← UPDATE
    │   ├── LineItemRow.tsx                      ← UPDATE
    │   ├── LineItemsTable.tsx                   ← UPDATE
    │   ├── NTNVerifier.tsx                      ← UPDATE
    │   └── SubmissionStatus.tsx                 ← UPDATE
    └── settings/
        ├── BusinessProfileForm.tsx              ← UPDATE
        └── HSCodeMasterManager.tsx              ← UPDATE
```

**Structure Decision**: Single Next.js project, no new directories. Changes are scoped entirely to `src/components/` and `src/app/` — visual layer only.

---

## Complexity Tracking

*No constitution violations — this section is not needed.*

---

## Phase 0: Research Summary

See [research.md](./research.md) for full details. Key resolved decisions:

| Decision | Resolution |
|----------|-----------|
| next-themes version | v0.4+ (React 19 compatible), `attribute="class"`, `defaultTheme="dark"`, `enableSystem` |
| CSS var approach | `.dark {}` / `.light {}` class blocks, arbitrary Tailwind values (`bg-[var(--x)]`) |
| Font strategy | Remove Geist from layout.tsx, use `@import url(...)` for DM Sans/DM Mono in globals.css |
| ThemeProvider placement | Wraps `children` inside `<body>` in root layout.tsx |
| Badge approach | Update `InvoiceStatusBadge.tsx` in-place, inline badges in other components |
| Inline style vs classes | Tailwind arbitrary values preferred; inline style only for `backdropFilter`, complex gradients |
| Scope | 43 files total — 2 new, 5 full rewrites, 36 targeted updates |

---

## Phase 1: Design Artifacts

See:
- [data-model.md](./data-model.md) — Design token system and component interfaces
- [contracts/design-system.md](./contracts/design-system.md) — CSS token contract and rules
- [quickstart.md](./quickstart.md) — Developer guide with copy-paste patterns

---

## Implementation Phases

### Phase A: Foundation (blocks all other work)

**Goal**: Establish the design system and theme switching infrastructure.

**Tasks**:
1. `npm install next-themes`
2. Rewrite `src/app/globals.css`:
   - `@import "tailwindcss"` (keep)
   - `@import url(...)` for DM Sans + DM Mono
   - `:root {}` with radius tokens and font vars
   - `.light {}` block with all light mode tokens
   - `.dark {}` block with all dark mode tokens
   - `body {}` styles
   - `.dark body {}` ambient gradient
   - Scrollbar + selection styles
   - Remove legacy `@theme inline` block
3. Create `src/components/ThemeProvider.tsx` (`"use client"`)
4. Rewrite `src/app/layout.tsx`:
   - Remove Geist font imports
   - Import DM Sans if using next/font (or rely on CSS import)
   - Add `<html suppressHydrationWarning>`
   - Wrap children in `<ThemeProvider>`
5. Create `src/components/ThemeToggle.tsx` (`"use client"`)

**Acceptance**: App renders in dark mode, DM Sans visible, no console errors.

---

### Phase B: Core Shell

**Goal**: Redesign the three core layout components and make the toggle visible/functional.

**Tasks**:
6. Full rewrite `src/components/dashboard/Header.tsx`:
   - h-14 (56px), `bg-[var(--bg-subtle)]/80 backdrop-blur-xl`
   - Import and render `<ThemeToggle />`
   - User avatar (gradient), username, logout ghost button
   - All inline styles replaced with CSS var classes
7. Full rewrite `src/components/dashboard/Sidebar.tsx`:
   - `w-[240px]` (was w-64)
   - Replace emoji icons with inline SVG
   - Active: `bg-[var(--primary-subtle)] text-[var(--primary)]`
   - Hover: `bg-[var(--surface-2)]`
   - Logo area with gradient icon
   - Version tag at bottom
   - CSS var-based background + border (replace hardcoded rgba)
8. Full rewrite `src/components/dashboard/MetricCard.tsx`:
   - `bg-[var(--surface)] border-[var(--border)] shadow-[var(--shadow)]`
   - Optional icon in accent-colored square
   - Hover: `hover:-translate-y-0.5 transition-transform`
   - Subtle bottom gradient accent line
9. Update `src/app/(auth)/layout.tsx`:
   - Replace hardcoded rgba backgrounds with CSS var tokens
   - Glass card: `bg-[var(--surface)] border border-[var(--primary)]/30`

**Acceptance**: Click ThemeToggle → entire interface switches modes. Both look polished.

---

### Phase C: Auth Components

**Goal**: All auth forms use the unified design system.

**Tasks**:
10. `LoginForm.tsx` — inputs, labels, button, error state, links
11. `RegisterForm.tsx` — same pattern
12. `ForgotPasswordForm.tsx` — same pattern
13. `ResetPasswordForm.tsx` — same pattern
14. `SetupOrganizationForm.tsx` — same pattern
15. `SocialLoginButton.tsx` — replace `bg-white border-gray-300 text-gray-700` with CSS vars

**Acceptance**: Login page works visually in both modes, all inputs visible.

---

### Phase D: Invoice Components

**Goal**: All invoice-related components use design system tokens.

**Tasks** (in order of dependency):
16. `InvoiceStatusBadge.tsx` — semantic dot + color tokens for all statuses
17. `LineItemRow.tsx` — inputs, buttons, colors
18. `LineItemsTable.tsx` — table pattern from contract
19. `BuyerSearch.tsx` — input, dropdown, results
20. `ClientSearch.tsx` — same
21. `HSCodeSearch.tsx` — same
22. `InvoiceHeader.tsx` — section card, labels
23. `InvoiceSummary.tsx` — totals card
24. `NTNVerifier.tsx` — input, status display
25. `SubmissionStatus.tsx` — status colors
26. `FBRErrorDisplay.tsx` — error colors
27. `DraftIndicator.tsx` — badge/indicator
28. `InvoicePrint.tsx` — print layout (may keep some explicit colors for print CSS)
29. `invoice-form-client.tsx` — full cleanup, section cards, all inputs/buttons

---

### Phase E: Client & Settings Components

**Tasks**:
30. `ClientsTable.tsx` — table pattern, badges for registrationType
31. `ClientFormModal.tsx` — modal pattern, inputs
32. `BusinessProfileForm.tsx` — inputs, labels
33. `HSCodeMasterManager.tsx` — table/inputs

---

### Phase F: Dashboard Components

**Tasks**:
34. `DateRangePicker.tsx` — inputs, dropdown
35. `RevenueTrendChart.tsx` — chart colors (where applicable)

---

### Phase G: Pages

**Tasks** (bulk cleanup of remaining hardcoded classes):
36. `dashboard/page.tsx` — remove `from-slate-50`, `bg-gradient-to-br`
37. `invoices/page.tsx` — remove `bg-white/80`, gradient classes
38. `invoices/drafts/page.tsx` — remove `text-gray-900`
39. `invoices/drafts/DraftsClient.tsx` — cleanup
40. `invoices/drafts/DraftDeleteButton.tsx` — remove `text-red-500`
41. `invoices/[id]/page.tsx` — full cleanup
42. `invoices/[id]/print/page.tsx` — cleanup (preserve print-specific colors)
43. `invoices/new/page.tsx` — remove `bg-gray-50`
44. `clients/page.tsx` — remove `bg-white border-gray-200`
45. `members/page.tsx` — cleanup if needed
46. `settings/business-profile/page.tsx` — remove `bg-white border-gray-200`
47. `settings/hs-codes/page.tsx` — remove `bg-white border-slate-200`
48. `settings/settings-client.tsx` — remove `bg-white text-gray-*`
49. `(auth)/login/page.tsx` — remove `text-gray-900`
50. `(auth)/register/page.tsx` — same
51. `(auth)/forgot-password/page.tsx` — same
52. `(auth)/reset-password/page.tsx` — same
53. `(auth)/setup-organization/page.tsx` — same

---

## Verification Gates

### Gate 1: Zero hardcoded color classes
```bash
grep -rn "bg-white\|text-gray-\|border-gray-\|bg-gray-\|from-slate-\|bg-blue-\|text-blue-" \
  src/components src/app \
  --include="*.tsx"
# Expected: 0 matches (excluding SVG fill attributes)
```

### Gate 2: TypeScript compiles
```bash
npm run typecheck
# Expected: 0 errors
```

### Gate 3: Build succeeds
```bash
npm run build
# Expected: successful build
```

### Gate 4: Visual verification (manual)
- [ ] Dark mode: deep background, glass surfaces, indigo accents visible
- [ ] Light mode: light gray background, white surfaces, same indigo accents
- [ ] Theme toggle switches in < 200ms
- [ ] No layout shift on toggle
- [ ] All tables render correctly in both modes
- [ ] All modals look good in both modes
- [ ] All form inputs visible in both modes
- [ ] Auth pages look good in both modes
- [ ] Status badges use correct semantic colors
- [ ] No hydration errors in console

---

## Risks and Mitigations

1. **Risk**: `InvoicePrint.tsx` uses colors that need to be visible on paper — light mode theme doesn't affect print CSS. **Mitigation**: Keep explicit print-media colors where needed using `@media print` queries; update only screen colors with CSS vars.

2. **Risk**: `RevenueTrendChart.tsx` uses Recharts with hardcoded color values in chart config (not Tailwind classes). **Mitigation**: Update chart stroke/fill colors to use CSS var values read via `getComputedStyle` or hardcode acceptable values that work in both modes (chart library doesn't support CSS vars natively).

3. **Risk**: `backdrop-filter` on `bg-[var(--bg-subtle)]/80` — Tailwind v4 background opacity modifier (`/80`) may not combine with CSS variable backgrounds correctly. **Mitigation**: Use inline style for the `background: rgba(...)` with opacity baked into the color, or use `bg-[var(--bg-subtle)]` + separate `opacity-80` (note: opacity affects all children). Best: define a separate `--bg-subtle-glass` var with opacity baked in.

---

## ADR Candidates

No architectural decisions significant enough to warrant ADRs were identified. This is a purely visual layer change with no API design, data modeling, or platform decisions.
