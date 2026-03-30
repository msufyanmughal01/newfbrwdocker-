---
description: "Task list for 008-responsive-rebrand: responsive design + TaxDigital rebrand"
---

# Tasks: Responsive Design & TaxDigital Rebrand

**Input**: Design documents from `/specs/008-responsive-rebrand/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: No test tasks generated — spec does not request TDD approach. Verification is via browser DevTools viewport emulation per `quickstart.md`.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup

**Purpose**: Confirm the active branch and development environment before implementation begins.

- [x] T001 Confirm dev server starts on branch `008-responsive-rebrand`: run `npm run dev`, verify app loads at `http://localhost:3000` with no console errors

**Checkpoint**: Dev server running — implementation can begin.

---

## Phase 3: User Story 1 — Mobile Sidebar Drawer (Priority: P1) 🎯 MVP

**Goal**: On viewports < 768px, the sidebar is hidden by default. A hamburger icon in the header opens a full-width drawer overlay with a semi-transparent backdrop. Tapping a nav item or the backdrop closes the drawer. On ≥ 768px, existing expand/collapse behaviour is fully preserved.

**Independent Test**: Open DevTools → set viewport to 375px → load `/dashboard` → verify: no sidebar visible, hamburger icon visible in header, tap hamburger → drawer slides in from left with backdrop → tap a nav item → drawer closes and navigates.

- [x] T002 [US1] Add `isMobileOpen: boolean` state and handlers to `src/components/dashboard/DashboardShell.tsx`: add `const [isMobileOpen, setIsMobileOpen] = useState(false)`, a `useEffect` that collapses `isSidebarOpen` when viewport drops below 1024px (`window.matchMedia('(min-width: 1024px)')`), and thread `isMobileOpen`, `onMobileMenuToggle={() => setIsMobileOpen(v => !v)}`, and `onMobileClose={() => setIsMobileOpen(false)}` as props to `<Header>` and `<Sidebar>`
- [x] T003 [US1] Add hamburger button to `src/components/dashboard/Header.tsx`: add `onMobileMenuToggle: () => void` to `HeaderProps`; render a `<button className="flex md:hidden ...">` with a three-line SVG icon at the left of the header before the brand text; calls `onMobileMenuToggle` on click
- [x] T004 [US1] Convert `src/components/dashboard/Sidebar.tsx` to dual-mode responsive: add `isMobileOpen: boolean` and `onMobileClose: () => void` to `SidebarProps`; on `md+` keep existing `sticky top-0 h-screen w-60/w-14` behaviour; on `< md` render as `fixed inset-y-0 left-0 z-50 w-60` with `translate-x-0`/`-translate-x-full` CSS transition based on `isMobileOpen`; add a backdrop `<div className="fixed inset-0 z-40 bg-black/40 md:hidden">` that calls `onMobileClose` on click; call `onMobileClose` when any nav `<Link>` is clicked on mobile

**Checkpoint**: At 375px, sidebar drawer works end-to-end. At 768px+, existing sidebar toggle is unaffected. User Story 1 independently testable.

---

## Phase 4: User Story 2 — TaxDigital Brand Rename (Priority: P2)

**Goal**: Every visible product brand label in the UI reads "TaxDigital". All FBR tax authority references (FBR API, compliance labels, invoice numbers) are untouched.

**Independent Test**: Visit `/login`, `/dashboard`, any invoice page → browser tab reads "TaxDigital"; auth logo reads "TaxDigital"; header reads "TaxDigital"; sidebar badge reads "TD" and label reads "TaxDigital". No brand reference to "FBR Portal" or "FBR Invoicing" visible anywhere.

- [x] T005 [P] [US2] Update root app metadata title from `"FBR Digital Invoicing Portal"` to `"TaxDigital"` in `src/app/layout.tsx`; update auth layout logo heading from `"FBR Invoicing"` to `"TaxDigital"` in `src/app/(auth)/layout.tsx`
- [x] T006 [P] [US2] Update login page subtitle from `"Welcome back to FBR Digital Invoicing Portal"` to `"Welcome back to TaxDigital"` in `src/app/(auth)/login/page.tsx`; update register page subtitle from `"Get started with FBR Digital Invoicing Portal"` to `"Get started with TaxDigital"` in `src/app/(auth)/register/page.tsx`
- [x] T007 [P] [US2] Update dashboard header brand text from `"FBR Digital Invoicing Portal"` to `"TaxDigital"` in `src/components/dashboard/Header.tsx`
- [x] T008 [P] [US2] Update sidebar logo badge from `"FBR"` to `"TD"` and app label from `"FBR Portal"` to `"TaxDigital"` in `src/components/dashboard/Sidebar.tsx`
- [x] T009 [P] [US2] Update page metadata `title` field from `"... | FBR Digital Invoicing"` to `"... | TaxDigital"` in all 8 dashboard pages: `src/app/(dashboard)/clients/page.tsx`, `src/app/(dashboard)/invoices/page.tsx`, `src/app/(dashboard)/invoices/drafts/page.tsx`, `src/app/(dashboard)/invoices/new/page.tsx`, `src/app/(dashboard)/invoices/[id]/page.tsx`, `src/app/(dashboard)/invoices/[id]/print/page.tsx`, `src/app/(dashboard)/settings/business-profile/page.tsx`, `src/app/(dashboard)/settings/hs-codes/page.tsx`
- [x] T010 [P] [US2] Update email sender name from `"FBR Portal <onboarding@resend.dev>"` to `"TaxDigital <onboarding@resend.dev>"` and invitation body text from `"FBR Digital Invoicing Portal"` to `"TaxDigital"` in `src/lib/email.ts`

**Checkpoint**: All brand labels show "TaxDigital". Zero "FBR Portal" / "FBR Invoicing" in rendered UI. User Story 2 independently testable.

---

## Phase 5: User Story 3 — Tablet Invoice Form (Priority: P3)

**Goal**: On 768px viewport, invoice creation form is fully accessible without horizontal overflow. Invoice detail page Seller/Buyer cards stack correctly on narrow viewports. Line items table scrolls horizontally within its container (not the page).

**Independent Test**: Open DevTools → set viewport to 768px → navigate to `/invoices/new` → complete all visible form sections without horizontal page scroll. Navigate to any invoice detail page → verify Seller/Buyer cards stack to single column below 640px.

- [x] T011 [US3] Add `overflow-x-auto` wrapper div around `<LineItemsTable>` inside the "Line Items" section card in `src/app/(dashboard)/invoices/invoice-form-client.tsx`; change action buttons container from `className="flex gap-4"` to `className="flex flex-wrap gap-4"` so the three action buttons wrap to the next line on narrow viewports
- [x] T012 [US3] Add `overflow-x-auto` wrapper inside `LineItemsTable`'s rendered `<table>` so the table itself scrolls horizontally rather than the page in `src/components/invoices/LineItemsTable.tsx` — wrap the `<table>` element in `<div className="overflow-x-auto">` and ensure the table has `min-w-[640px]` or equivalent so it does not collapse too aggressively
- [x] T013 [US3] Fix invoice detail page responsive layout in `src/app/(dashboard)/invoices/[id]/page.tsx`: change Seller/Buyer grid from `grid grid-cols-2` to `grid grid-cols-1 sm:grid-cols-2`; change invoice header actions container from `flex justify-between items-start` to `flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3` so the status badge and Print Invoice button stack on narrow viewports

**Checkpoint**: Invoice form and detail page fully usable at 768px and 375px without horizontal page scroll. User Story 3 independently testable.

---

## Phase 6: User Story 4 — Mobile List & Dashboard Views (Priority: P4)

**Goal**: Invoices list, drafts list, and clients list tables all scroll horizontally within their containers on mobile. Dashboard metric cards already use a responsive grid — no changes needed there.

**Independent Test**: Open DevTools → set viewport to 375px → visit `/invoices`, `/invoices/drafts`, `/clients` → verify page has no horizontal scroll; table content scrolls within its bounded container.

- [x] T014 [P] [US4] Wrap invoices list `<table>` in `<div className="overflow-x-auto">` inside the `rounded-xl overflow-hidden` container in `src/app/(dashboard)/invoices/page.tsx` — change `overflow-hidden` to `overflow-x-auto overflow-y-hidden` on the outer div, or add an inner wrapper
- [x] T015 [P] [US4] Wrap drafts table `<table>` in `<div className="overflow-x-auto">` in `src/app/(dashboard)/invoices/drafts/DraftsClient.tsx`
- [x] T016 [P] [US4] Wrap clients table `<table>` in `<div className="overflow-x-auto">` in `src/app/(dashboard)/clients/page.tsx`

**Note**: Dashboard `DashboardContent.tsx` metric cards already use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` — no change required (SC-005 already satisfied).

**Checkpoint**: All list pages scroll correctly on mobile with zero horizontal page overflow. User Story 4 independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Type safety verification, padding consistency, and full cross-viewport sign-off.

- [x] T017 [P] Add consistent responsive horizontal padding to page-level wrappers that lack it: verify `src/app/(dashboard)/invoices/page.tsx` (`max-w-[1100px] mx-auto p-6` — consider `px-4 sm:p-6`), `src/app/(dashboard)/invoices/drafts/page.tsx`, and `src/app/(dashboard)/clients/page.tsx` all have `px-4` minimum horizontal padding so content does not touch viewport edges on mobile
- [x] T018 Run TypeScript type check `npx tsc --noEmit` from repository root and resolve any type errors introduced in T002–T016 — expected: new `onMobileMenuToggle` and `onMobileClose` props must be typed in all component interfaces
- [x] T019 [P] Cross-viewport sign-off per `specs/008-responsive-rebrand/quickstart.md`: test all 4 user story acceptance scenarios at 375px, 768px, and 1280px using browser DevTools device emulation — document any remaining failures

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 3 (US1)**: Depends on Phase 1 completion. T003 and T004 depend on T002 (props interface defined first)
- **Phase 4 (US2)**: Independent of all other phases — can start any time after Phase 1; all US2 tasks are parallelizable
- **Phase 5 (US3)**: Independent of US1 and US2 — can start after Phase 1
- **Phase 6 (US4)**: Independent of US1, US2, US3 — can start after Phase 1
- **Phase 7 (Polish)**: Depends on Phase 3–6 completion

### User Story Dependencies

- **User Story 1 (P1)**: T002 → {T003, T004} (T003/T004 depend on T002)
- **User Story 2 (P2)**: T005–T010 fully independent of each other and other stories
- **User Story 3 (P3)**: T011 → T012 (T012 modifies the component that T011 wraps); T013 independent
- **User Story 4 (P4)**: T014, T015, T016 fully independent of each other

### Within Each User Story

- US1: T002 must complete before T003 and T004 begin (props threading)
- US2: All tasks are parallel — run simultaneously
- US3: T011 then T012 (inner and outer wrapper, same code area); T013 parallel
- US4: All tasks are parallel — run simultaneously

---

## Parallel Example: User Story 2

```bash
# All brand rename tasks can launch simultaneously (different files):
Task: "T005 — Update root layout.tsx and auth layout.tsx"
Task: "T006 — Update login/page.tsx and register/page.tsx"
Task: "T007 — Update Header.tsx brand text"
Task: "T008 — Update Sidebar.tsx badge and label"
Task: "T009 — Update all 8 dashboard page metadata titles"
Task: "T010 — Update email.ts sender and body"
```

## Parallel Example: User Story 4

```bash
# All table overflow tasks can launch simultaneously (different files):
Task: "T014 — Wrap invoices table in overflow-x-auto"
Task: "T015 — Wrap drafts table in overflow-x-auto"
Task: "T016 — Wrap clients table in overflow-x-auto"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 3: User Story 1 (T002 → T003, T004)
3. **STOP AND VALIDATE**: Verify mobile drawer at 375px using DevTools
4. App is now usable on mobile (core blocker resolved)

### Incremental Delivery

1. T001 → foundation ready
2. T002–T004 (US1) → mobile access works → **Demo: mobile drawer**
3. T005–T010 (US2) → brand reads TaxDigital → **Demo: brand update**
4. T011–T013 (US3) → tablet form usable → **Demo: tablet invoice form**
5. T014–T016 (US4) → lists readable on mobile → **Demo: full mobile flow**
6. T017–T019 → polish, types clean, sign-off

### Parallel Team Strategy

With multiple developers (after T001):

- Developer A: US1 mobile drawer (T002 → T003, T004)
- Developer B: US2 brand rename (T005–T010 in parallel)
- Developer C: US3 + US4 (T011–T016)
- All converge at Phase 7 (T017–T019)

---

## Notes

- [P] tasks = different files, no dependencies — safe to run simultaneously
- [Story] label maps each task to its user story for traceability
- Each user story is independently completable and demonstrable
- No tests requested in spec — verification via DevTools viewport emulation
- `InvoiceHeader.tsx` grids already use `grid-cols-1 md:grid-cols-2` — no changes needed
- `DashboardContent.tsx` metric cards already use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` — no changes needed
- Invoice detail `[id]/page.tsx` line items already have `overflow-x-auto` — no changes needed there
- FBR authority labels in `InvoicePrint.tsx`, `InvoiceSummary.tsx`, and `invoice-form-client.tsx` MUST NOT be changed
- Print page (`/invoices/[id]/print`) is excluded from responsive changes per spec Assumptions
