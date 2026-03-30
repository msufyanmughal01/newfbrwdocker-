# Tasks: Premium UI Redesign with Dark/Light Mode

**Input**: Design documents from `specs/006-ui-redesign/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓
**Tests**: Not requested in spec. No test tasks generated.
**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks in same phase)
- **[Story]**: Maps to user story from spec.md (US1–US5)
- All paths relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install the one new dependency before any other work begins.

- [ ] T001 Install `next-themes` package via `npm install next-themes` (verify it appears in `package.json` dependencies)

**Checkpoint**: `package.json` contains `"next-themes"` entry. Proceed to Phase 2.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the CSS design system and theme-switching infrastructure. Every user story depends on this phase. No UI work can begin until this is complete.

**⚠️ CRITICAL**: All Phase 3–7 work blocks on this phase completing.

- [ ] T002 Rewrite `src/app/globals.css` — replace existing dark-only vars with: `@import "tailwindcss"`, `@import url(...)` for DM Sans + DM Mono, `:root {}` with `--font-sans`, `--font-mono`, radius tokens, `.light {}` block with all 28 light tokens (see `data-model.md`), `.dark {}` block with all 28 dark tokens, `body {}` styles with `font-family: var(--font-sans)`, `.dark body {}` ambient gradient, scrollbar styles, `::selection` style — remove old `@theme inline` block entirely

- [ ] T003 Create `src/components/ThemeProvider.tsx` — `"use client"` component that wraps `children` in `<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>` from `next-themes`; export as named export `ThemeProvider`

- [ ] T004 Rewrite `src/app/layout.tsx` — remove `Geist`/`Geist_Mono` font imports, add `suppressHydrationWarning` to `<html>`, import and wrap `children` with `<ThemeProvider>` from `src/components/ThemeProvider`, keep `metadata` export and body structure intact; DM Sans loads via CSS `@import` so no `next/font` import needed

**Checkpoint**: `npm run dev` — app renders in dark mode, DM Sans font visible in browser, no console errors. Verify `.dark` class is on `<html>` element in DevTools. Proceed to Phase 3.

---

## Phase 3: User Story 1 — Theme Toggle Works Reliably (P1) 🎯 MVP

**Goal**: A functional theme toggle button in the header that switches the entire interface between dark and light mode, persists across reloads, and respects OS preference.

**Independent Test**: Load `/dashboard`, click the toggle button in the header. Entire interface switches within 200ms. Reload page — theme persists. Open DevTools → Application → LocalStorage: `theme` key should be `"dark"` or `"light"`.

- [ ] T005 [US1] Create `src/components/ThemeToggle.tsx` — `"use client"` component using `useTheme` from `next-themes`; renders a `<button>` with sun SVG when `resolvedTheme === "dark"` and moon SVG when `resolvedTheme === "light"`; ghost button style using CSS vars: `border border-[var(--border)] bg-transparent hover:bg-[var(--surface-2)] text-[var(--foreground-muted)] rounded-lg p-2 transition-colors`; inline SVG only (no icon library); handle `mounted` state to avoid hydration mismatch (render placeholder until mounted)

- [ ] T006 [US1] Rewrite `src/components/dashboard/Header.tsx` — reduce height to `h-14` (56px from h-16); import `ThemeToggle` from `src/components/ThemeToggle`; render `<ThemeToggle />` before the avatar; replace all hardcoded `rgba(15,15,26,0.8)` background with `className="bg-[var(--bg-subtle)]"` and `style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}`; replace all inline color styles with CSS var classes: `text-[var(--foreground-muted)]` for username and subtitle, `border-[var(--border)]` for logout button border, `hover:bg-[var(--surface-2)]` for logout hover; keep `authClient.signOut()` logic unchanged

- [ ] T007 [US1] Rewrite `src/components/dashboard/Sidebar.tsx` — set width to `w-[240px]`; replace hardcoded `rgba(15,15,26,0.8)` background with `bg-[var(--bg-subtle)]` and inline `backdropFilter`; replace `borderRight` inline style with `border-r border-[var(--border)]`; replace all 7 emoji icons with inline SVG icons (Dashboard=grid, Invoices=file-text, Drafts=edit-2, New Invoice=plus-circle, Clients=users, Settings=settings, HS Codes=search); active state: `bg-[var(--primary-subtle)] text-[var(--primary)]` with `boxShadow: 'inset 0 0 0 1px var(--primary)/30'`; hover state: remove `onMouseEnter/onMouseLeave` handlers, use Tailwind group/hover classes instead: `hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]`; add version tag `v1.0` at bottom with `text-[var(--foreground-subtle)] text-xs`; add gradient logo icon div before "FBR Portal" text; keep `usePathname()` active state logic unchanged

**Checkpoint**: Theme toggle visible in header. Clicking it switches dark↔light instantly. Sidebar, header, and body all change color. Theme persists on reload. ✅ US1 DONE.

---

## Phase 4: User Story 2 — Dashboard Looks Professional in Both Modes (P1)

**Goal**: The dashboard page renders a premium interface — metric cards with hover animations, correct typography, and full visual polish in both dark and light mode.

**Independent Test**: Load `/dashboard` in dark mode — deep background, glass-effect cards, indigo accents. Switch to light mode — white surfaces, light gray background, same indigo. Hover a metric card — subtle upward lift. No white boxes or invisible text.

- [ ] T008 [US2] Rewrite `src/components/dashboard/MetricCard.tsx` — replace all inline `style` colors with CSS var classes: `bg-[var(--surface)] border-[var(--border)] shadow-[var(--shadow)]` for container; remove `backdropFilter` (surfaces don't need blur); add hover lift: `hover:-translate-y-0.5 transition-all duration-200`; add optional `icon?: React.ReactNode` prop rendered in an `accentColor`-colored `8×8` rounded square; add subtle bottom gradient accent: `<div className="absolute bottom-0 inset-x-0 h-0.5 rounded-b-xl" style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />`; wrap container in `relative overflow-hidden`; `text-[var(--foreground-muted)]` for label, `text-[var(--foreground)]` for value; keep `MetricCardProps` interface and loading skeleton unchanged

- [ ] T009 [US2] Update `src/app/(dashboard)/dashboard/DashboardContent.tsx` — remove any hardcoded color classes (`from-slate-50`, `bg-gradient-to-br`, `bg-white`, `text-gray-*`); wrap page in `<div className="min-h-full">` (not `min-h-screen`); page header: `<h1 className="text-2xl font-bold text-[var(--foreground)]">`; all container divs use CSS var classes

- [ ] T010 [P] [US2] Update `src/app/(dashboard)/dashboard/page.tsx` — remove `bg-gradient-to-br from-slate-50`, any wrapper background classes; keep `async` server component logic and data fetching calls completely unchanged

- [ ] T011 [P] [US2] Update `src/components/dashboard/DateRangePicker.tsx` — replace all `bg-white`, `border-gray-*`, `text-gray-*`, `bg-gray-*` with CSS var equivalents per `contracts/design-system.md` Rule 3; keep all date logic, props interface, and event handlers unchanged

- [ ] T012 [P] [US2] Update `src/components/dashboard/RevenueTrendChart.tsx` — replace hardcoded Tailwind color classes with CSS var classes; for Recharts `stroke`/`fill` props that require hex values (not CSS vars), read computed style via `getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()` in a `useEffect` or use acceptable hardcoded hex fallbacks (`#6366f1` for primary, `#34d399` for positive) that look good in both modes; keep all Recharts component logic unchanged

**Checkpoint**: `/dashboard` looks polished in both modes. Metric cards lift on hover. Gradient accent line visible on card bottom. Recharts renders without errors. ✅ US2 DONE.

---

## Phase 5: User Story 3 — Invoice Creation Form Is Fully Styled (P2)

**Goal**: The New Invoice form uses unified input/button styling with CSS vars across all sub-components — fully visible and well-styled in both dark and light mode.

**Independent Test**: Navigate to `/invoices/new` in dark mode — all inputs visible with dark backgrounds, primary-colored focus rings on click. Switch to light mode — inputs on light background, text visible, labels readable. All buttons styled.

- [ ] T013 [US3] Update `src/components/invoices/InvoiceStatusBadge.tsx` — replace all hardcoded `bg-green-100 text-green-700`, `bg-red-*`, `bg-yellow-*`, `bg-blue-*`, `bg-gray-*` with semantic CSS var pattern; add leading dot indicator `<span className="w-1.5 h-1.5 rounded-full" />` for each variant; use badge colors per `contracts/design-system.md` Rule 6: draft=surface-3/foreground-muted, issued/validated=positive-bg/positive, failed=error-bg/error, submitting/validating=info-bg/info; keep `status` prop type and component interface unchanged

- [ ] T014 [P] [US3] Update `src/components/invoices/LineItemRow.tsx` — replace all `bg-white`, `border-gray-*`, `text-gray-*`, `bg-gray-*` with CSS var classes per input/button patterns in `contracts/design-system.md`; keep all `react-hook-form` `register()`, `watch()`, validation, and calculation logic completely unchanged

- [ ] T015 [P] [US3] Update `src/components/invoices/LineItemsTable.tsx` — apply table container pattern: `rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--border)]`; header: `bg-[var(--surface-2)] text-xs uppercase text-[var(--foreground-muted)]`; rows: `hover:bg-[var(--surface-2)] border-b border-[var(--border)]`; keep all table logic and props unchanged

- [ ] T016 [P] [US3] Update `src/components/invoices/BuyerSearch.tsx` — replace all hardcoded color classes with CSS var classes; dropdown results: `bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow)]`; result items: `hover:bg-[var(--surface-2)]`; input: unified input pattern from contract; keep all search/debounce/API call logic unchanged

- [ ] T017 [P] [US3] Update `src/components/invoices/ClientSearch.tsx` — same pattern as T016; replace hardcoded colors with CSS vars; keep logic unchanged

- [ ] T018 [P] [US3] Update `src/components/invoices/HSCodeSearch.tsx` — same pattern as T016; replace hardcoded colors; keep all HS code search logic unchanged

- [ ] T019 [P] [US3] Update `src/components/invoices/InvoiceHeader.tsx` — replace `bg-white`, `border-gray-*`, `text-gray-*` with CSS var classes; section card: `bg-[var(--surface)] border border-[var(--border)] rounded-xl`; labels: `text-[var(--foreground-muted)]`; keep all props and display logic unchanged

- [ ] T020 [P] [US3] Update `src/components/invoices/InvoiceSummary.tsx` — replace hardcoded colors with CSS var classes; totals area: `bg-[var(--surface-2)]`; dividers: `border-[var(--border)]`; primary total: `text-[var(--foreground)] font-bold`; keep all calculation display logic unchanged

- [ ] T021 [P] [US3] Update `src/components/invoices/NTNVerifier.tsx` — unified input pattern for the NTN input; verified state: `text-[var(--positive)]`; error state: `text-[var(--error)]`; keep all NTN verification API call logic unchanged

- [ ] T022 [P] [US3] Update `src/components/invoices/SubmissionStatus.tsx` — replace `bg-green-*`, `bg-red-*`, `bg-blue-*` with semantic CSS var classes; keep all status display and FBR submission state logic unchanged

- [ ] T023 [P] [US3] Update `src/components/invoices/FBRErrorDisplay.tsx` — replace `text-red-*`, `bg-red-*` with `text-[var(--error)] bg-[var(--error-bg)]`; error container: `border border-[var(--error)]/20 rounded-lg p-4`; keep all error parsing and display logic unchanged

- [ ] T024 [P] [US3] Update `src/components/invoices/DraftIndicator.tsx` — replace hardcoded indicator colors with CSS vars; keep indicator logic unchanged

- [ ] T025 [US3] Update `src/app/(dashboard)/invoices/invoice-form-client.tsx` — (largest file) apply section card pattern to each form section: `bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 mb-6`; replace ALL hardcoded `bg-white`, `bg-gray-*`, `text-gray-*`, `border-gray-*` with CSS var classes; unified input/select/textarea pattern throughout; primary button: `bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white`; ghost/secondary buttons: `border border-[var(--border)] bg-transparent hover:bg-[var(--surface-2)] text-[var(--foreground-muted)]`; section headings: `text-[var(--foreground)] font-semibold text-lg`; keep ALL TypeScript interfaces, form validation, `react-hook-form`, FBR API calls, line item calculations, and submission logic completely unchanged

- [ ] T026 [P] [US3] Update `src/app/(dashboard)/invoices/new/page.tsx` — remove `min-h-screen bg-gray-50`, any wrapper background classes; keep server component session auth logic unchanged

**Checkpoint**: Navigate `/invoices/new`, fill form in both modes. All inputs visible, labeled, focusable. Section cards visible. Submit button styled. No white boxes. ✅ US3 DONE.

---

## Phase 6: User Story 4 — Tables Display Correctly in Both Modes (P2)

**Goal**: All data tables (invoices list, drafts, clients, HS codes) render with the unified table pattern and semantic status badges in both dark and light mode.

**Independent Test**: Navigate to `/invoices`, `/invoices/drafts`, `/clients`, and `/settings/hs-codes` in both modes. Each table container has rounded corners, correct borders, hover row highlight, and status badges with correct semantic colors.

- [ ] T027 [US4] Update `src/components/clients/ClientsTable.tsx` — apply full table pattern: container `rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--border)]`; header row `bg-[var(--surface-2)] text-xs uppercase text-[var(--foreground-muted)]`; body rows `hover:bg-[var(--surface-2)] border-b border-[var(--border)]`; cells `py-3.5 px-4 text-[var(--foreground)]`; count text: `text-[var(--foreground-muted)]`; Add Client button: primary variant; empty state: `border-2 border-dashed border-[var(--border)]`; registration badges: use CSS var semantic colors (Registered=positive-bg/positive, other=surface-3/foreground-muted) with dot indicator; delete button: danger variant; edit button: link variant; keep all client CRUD logic, state, and API calls unchanged

- [ ] T028 [US4] Update `src/components/clients/ClientFormModal.tsx` — apply modal pattern: overlay `fixed inset-0 bg-black/50 backdrop-blur-sm z-50`; panel `bg-[var(--bg-subtle)] border border-[var(--border-strong)] rounded-2xl shadow-[var(--shadow-lg)]`; header `border-b border-[var(--border)] px-6 py-4`; all inputs: unified input pattern; remove ALL `bg-white`, `border-gray-*`, `text-gray-*`; keep all form validation, API calls, and `onSaved`/`onClose` callbacks unchanged

- [ ] T029 [P] [US4] Update `src/app/(dashboard)/invoices/drafts/DraftsClient.tsx` — finish cleanup of any remaining hardcoded `bg-white`, `text-gray-*`, `border-gray-*`; apply table pattern; keep all draft listing and state logic unchanged

- [ ] T030 [P] [US4] Update `src/app/(dashboard)/invoices/drafts/DraftDeleteButton.tsx` — replace `text-red-500` with `text-[var(--error)]`; hover state: `hover:text-[var(--error)] hover:bg-[var(--error-bg)]`; keep delete API call logic unchanged

- [ ] T031 [P] [US4] Update `src/components/settings/HSCodeMasterManager.tsx` — replace all `slate-*`, `gray-*` classes with CSS var classes; apply table pattern for the HS codes table; inputs: unified input pattern; buttons: primary/ghost variants; keep all HS code CRUD logic unchanged

- [ ] T032 [P] [US4] Update `src/app/(dashboard)/invoices/page.tsx` — remove `min-h-screen bg-gradient-to-br from-slate-50`, `bg-white/80`; page header: `text-[var(--foreground)]` title; keep all invoice listing server logic unchanged

- [ ] T033 [P] [US4] Update `src/app/(dashboard)/invoices/drafts/page.tsx` — remove `text-gray-900`; page title: `text-[var(--foreground)]`; keep server component logic unchanged

- [ ] T034 [P] [US4] Update `src/app/(dashboard)/clients/page.tsx` — remove `bg-white rounded-xl border border-gray-200`; apply `bg-[var(--surface)] border border-[var(--border)] rounded-xl`; keep server session and client data fetching logic unchanged

- [ ] T035 [P] [US4] Update `src/app/(dashboard)/settings/hs-codes/page.tsx` — remove `bg-white border-slate-200`; apply CSS var surface/border classes; keep server logic unchanged

- [ ] T036 [US4] Update `src/app/(dashboard)/invoices/[id]/page.tsx` — remove `min-h-screen bg-gray-50`, all `bg-white`, `text-gray-900`; apply CSS var classes throughout; detail sections: `bg-[var(--surface)] border border-[var(--border)] rounded-xl`; text hierarchy: `text-[var(--foreground)]` / `text-[var(--foreground-muted)]`; keep all invoice detail data fetching and FBR status display logic unchanged

**Checkpoint**: Navigate all 4 table pages in both modes. Tables render with correct borders, hover states, and status badges. No white/gray artifacts. ✅ US4 DONE.

---

## Phase 7: User Story 5 — Auth Pages Consistent with Design System (P3)

**Goal**: All auth pages (login, register, forgot password, reset password, organization setup) use CSS variable styling throughout — no white inputs on dark background, no gray text on light background.

**Independent Test**: Open `/login` in both modes. All inputs visible, labels readable, error messages use red CSS vars, social login button has correct border/bg, no white boxes visible in dark mode.

- [ ] T037 [US5] Update `src/app/(auth)/layout.tsx` — replace hardcoded `rgba(15,15,26,0.8)` ambient background with `bg-[var(--bg)]`; replace glass card `rgba(255,255,255,0.05)` with `bg-[var(--surface)]`; update card border from hardcoded `rgba(99,102,241,0.3)` to `border-[var(--primary)]/30`; keep all layout structure and ambient glow orb positions unchanged; add `suppressHydrationWarning` if not already present

- [ ] T038 [P] [US5] Update `src/components/auth/LoginForm.tsx` — replace ALL `text-gray-700`, `border-gray-300`, `bg-blue-600`, `hover:bg-blue-700`, `text-blue-600`, `text-red-600` with CSS var classes; labels: `text-[var(--foreground-muted)]`; inputs: unified input pattern from contract; submit button: primary variant; error text: `text-[var(--error)]`; links: `text-[var(--primary)] hover:text-[var(--primary-hover)]`; keep all `authClient.signIn.email()` and form state logic unchanged

- [ ] T039 [P] [US5] Update `src/components/auth/RegisterForm.tsx` — same pattern as T038; replace all hardcoded color classes with CSS var equivalents; keep all registration logic and validation unchanged

- [ ] T040 [P] [US5] Update `src/components/auth/ForgotPasswordForm.tsx` — same pattern; replace hardcoded colors; keep logic unchanged

- [ ] T041 [P] [US5] Update `src/components/auth/ResetPasswordForm.tsx` — same pattern; replace hardcoded colors; keep logic unchanged

- [ ] T042 [P] [US5] Update `src/components/auth/SetupOrganizationForm.tsx` — same pattern; replace hardcoded colors; inputs/buttons/labels use CSS vars; keep org setup API logic unchanged

- [ ] T043 [P] [US5] Update `src/components/auth/SocialLoginButton.tsx` — replace `bg-white border-gray-300 text-gray-700 hover:bg-gray-50` with `bg-[var(--surface)] border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--surface-2)]`; keep Google SVG icon `fill` colors (brand colors, exempted from Rule 1); keep `authClient.signIn.social()` logic unchanged

- [ ] T044 [P] [US5] Update `src/app/(auth)/login/page.tsx` — remove `text-gray-900`, `border-gray-300`, `bg-white`; any page-level wrapper classes use CSS vars; keep structure

- [ ] T045 [P] [US5] Update `src/app/(auth)/register/page.tsx` — same pattern as T044

- [ ] T046 [P] [US5] Update `src/app/(auth)/forgot-password/page.tsx` — same pattern as T044

- [ ] T047 [P] [US5] Update `src/app/(auth)/reset-password/page.tsx` — same pattern as T044

- [ ] T048 [P] [US5] Update `src/app/(auth)/setup-organization/page.tsx` — same pattern as T044

**Checkpoint**: Open `/login` in both modes. Inputs styled, no white boxes in dark, no gray artifacts in light. Error message on bad login uses red CSS var. Toggle works on auth pages too. ✅ US5 DONE.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Remaining pages and components not belonging to a single user story, final verification passes.

- [ ] T049 [P] Update `src/components/settings/BusinessProfileForm.tsx` — replace all `border-gray-*`, `text-gray-*`, `bg-white`, `bg-gray-*` with CSS var classes; unified input/button/label pattern; section cards: `bg-[var(--surface)] border border-[var(--border)] rounded-xl`; keep all business profile API logic unchanged

- [ ] T050 [P] Update `src/app/(dashboard)/settings/business-profile/page.tsx` — remove `bg-white border-gray-200`; apply CSS var surface/border; keep server data fetching unchanged

- [ ] T051 [P] Update `src/app/(dashboard)/settings/settings-client.tsx` — remove `bg-white`, `text-gray-*`, `border-gray-*`; settings navigation items: `hover:bg-[var(--surface-2)]`; active: `bg-[var(--primary-subtle)] text-[var(--primary)]`; keep settings routing logic unchanged

- [ ] T052 [P] Update `src/app/(dashboard)/members/members-client.tsx` — replace all hardcoded color classes with CSS var classes; members table: unified table pattern; invite button: primary variant; keep all member management logic unchanged

- [ ] T053 [P] Update `src/app/(dashboard)/members/page.tsx` — remove any hardcoded wrapper color classes; keep server component logic unchanged

- [ ] T054 [P] Update `src/app/(dashboard)/invoices/[id]/print/page.tsx` — replace screen-rendering hardcoded classes with CSS var equivalents; for print-specific colors inside `@media print` blocks, leave explicit values (print CSS needs absolute colors); keep print layout logic unchanged

- [X] T055 Verification Gate 1 — run `grep -rn "bg-white\|text-gray-\|border-gray-\|bg-gray-\|from-slate-\|bg-blue-\|text-blue-\|border-blue-" src/components src/app --include="*.tsx"` and confirm zero matches (excluding SVG `fill="..."` attributes); fix any remaining violations found

- [X] T056 Verification Gate 2 — run `npm run typecheck` (`npx tsc --noEmit`); fix any TypeScript errors introduced by the UI changes (should be zero if logic was untouched)

- [X] T057 Verification Gate 3 — run `npm run build`; confirm successful build with no errors; fix any build-time issues

- [ ] T058 Verification Gate 4 — manual visual check in browser: dark mode premium appearance (deep bg, glass surfaces, indigo accents), light mode clean appearance (white surfaces, light gray bg), theme toggle switches < 200ms, no layout shift, all tables correct in both modes, all modals correct in both modes, all form inputs visible in both modes, all auth pages correct, all status badges semantic colors, no hydration console errors

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
  └─► Phase 2 (Foundational) — blocks all user story phases
         └─► Phase 3 (US1 Theme Toggle) — P1
         └─► Phase 3 (US1) → Phase 4 (US2 Dashboard) — P1, depends on toggle in header
         └─► Phase 5 (US3 Invoice Form) — P2, can start after Phase 2
         └─► Phase 6 (US4 Tables) — P2, can start after Phase 2
         └─► Phase 7 (US5 Auth) — P3, can start after Phase 2
              └─► Phase 8 (Polish) — after all user stories
```

### User Story Dependencies

| Story | Depends On | Can Parallelize With |
|-------|-----------|---------------------|
| US1 (P1) | Phase 2 complete | Nothing — implement first |
| US2 (P1) | Phase 2 + US1 (Header has toggle) | — |
| US3 (P2) | Phase 2 complete | US4, US5 |
| US4 (P2) | Phase 2 complete | US3, US5 |
| US5 (P3) | Phase 2 complete | US3, US4 |

### Within Each User Story

- Parent components before children that import them
- Shared components (InvoiceStatusBadge T013) before components that use it
- No test-first required (not requested in spec)
- Logic must remain unchanged — only visual class replacements

### Parallel Opportunities

- All `[P]` tasks within the same phase can run in parallel
- US3, US4, US5 can all be worked on in parallel once Phase 2 is complete
- Within US3: T014–T024 are all `[P]` — they touch different component files
- Within US4: T029–T035 are all `[P]` — different files
- Within US5: T038–T048 are all `[P]` — different files

---

## Parallel Execution Examples

### Parallel: US3 Invoice Component Layer (after T013 done)

```
Batch 1 (all at once, different files):
  Task T014: LineItemRow.tsx
  Task T015: LineItemsTable.tsx
  Task T016: BuyerSearch.tsx
  Task T017: ClientSearch.tsx
  Task T018: HSCodeSearch.tsx
  Task T019: InvoiceHeader.tsx
  Task T020: InvoiceSummary.tsx
  Task T021: NTNVerifier.tsx
  Task T022: SubmissionStatus.tsx
  Task T023: FBRErrorDisplay.tsx
  Task T024: DraftIndicator.tsx

Batch 2 (after Batch 1):
  Task T025: invoice-form-client.tsx (imports above components)
  Task T026: invoices/new/page.tsx
```

### Parallel: US5 Auth Components (all at once)

```
All at once (different files):
  Task T038: LoginForm.tsx
  Task T039: RegisterForm.tsx
  Task T040: ForgotPasswordForm.tsx
  Task T041: ResetPasswordForm.tsx
  Task T042: SetupOrganizationForm.tsx
  Task T043: SocialLoginButton.tsx
  Task T044: login/page.tsx
  Task T045: register/page.tsx
  Task T046: forgot-password/page.tsx
  Task T047: reset-password/page.tsx
  Task T048: setup-organization/page.tsx
```

---

## Implementation Strategy

### MVP First (US1 Only — Fastest Path to Value)

1. Complete **Phase 1** (T001) — install dependency
2. Complete **Phase 2** (T002–T004) — design system foundation
3. Complete **Phase 3 US1** (T005–T007) — toggle + header + sidebar
4. **STOP and VALIDATE**: Click toggle → full interface switches modes
5. If validated: proceed to US2, or ship/demo the toggle

### Incremental Delivery

1. **Phase 1+2+3** → Theme toggle works (**US1 MVP** — 7 tasks)
2. **Phase 4** → Dashboard looks premium in both modes (**US2** — 5 tasks)
3. **Phase 5** → Invoice form fully styled (**US3** — 14 tasks)
4. **Phase 6** → All tables correct (**US4** — 10 tasks)
5. **Phase 7** → Auth pages consistent (**US5** — 12 tasks)
6. **Phase 8** → Polish + verification (10 tasks)

### Full Parallel Strategy

With multiple instances/developers:
1. Complete Phase 1 + Phase 2 together (sequential, 4 tasks)
2. Complete Phase 3 (US1) — enables all other phases
3. Launch simultaneously:
   - Dev A: US2 (Phase 4 — dashboard)
   - Dev B: US3 (Phase 5 — invoice form)
   - Dev C: US4+US5 (Phases 6+7 — tables + auth)
4. All merge → Phase 8 verification

---

## Task Summary

| Phase | Tasks | Parallelizable | User Story |
|-------|-------|---------------|-----------|
| Phase 1: Setup | 1 (T001) | 0 | — |
| Phase 2: Foundational | 3 (T002–T004) | 1 | — |
| Phase 3: US1 Theme Toggle | 3 (T005–T007) | 0 | US1 |
| Phase 4: US2 Dashboard | 5 (T008–T012) | 3 | US2 |
| Phase 5: US3 Invoice Form | 14 (T013–T026) | 11 | US3 |
| Phase 6: US4 Tables | 10 (T027–T036) | 7 | US4 |
| Phase 7: US5 Auth Pages | 12 (T037–T048) | 11 | US5 |
| Phase 8: Polish | 10 (T049–T058) | 6 | — |
| **TOTAL** | **58 tasks** | **39 parallelizable** | 5 stories |

---

## Notes

- `[P]` tasks = different files, no dependencies within same phase
- `[Story]` label maps to user stories from spec.md for traceability
- **Rule**: If a task says "keep logic unchanged" — only change CSS class strings
- **Rule**: No file in `src/lib/`, `src/app/api/`, or DB schema may be touched
- **Rule**: All changes must pass `npm run typecheck` (zero errors)
- Commit after each phase checkpoint for clean git history
- Verify both modes after each phase checkpoint — don't wait until the end
- Grep command in T055 is the final authority on completion
