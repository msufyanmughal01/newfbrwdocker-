# Tasks: Sidebar Toggle with Settings Button

**Input**: Design documents from `/specs/007-sidebar-toggle/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/component-api.md ✅

**Tests**: Not requested in spec — no test tasks generated.

**Organization**: Tasks grouped by user story. All 3 user stories modify `src/components/dashboard/Sidebar.tsx` sequentially. Foundational tasks (DashboardShell + layout) must complete first.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in every description

---

## Phase 1: Setup

**Purpose**: Confirm development environment and branch are ready before touching any source files.

- [x] T001 Confirm branch is `007-sidebar-toggle` (run `git branch`) and dev server starts cleanly (`npm run dev`) — no source changes needed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the `DashboardShell` client wrapper and wire it into `layout.tsx`. This is the prerequisite for all three user stories — nothing else can proceed until this is done.

**⚠️ CRITICAL**: All user story work is blocked until this phase is complete.

- [x] T002 Create `src/components/dashboard/DashboardShell.tsx` as a `"use client"` component with `useState(true)` for `isSidebarOpen`, a `toggleSidebar` callback, and renders `<Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />`, `<Header userName={userName} />`, and `<main className="flex-1 overflow-auto bg-transparent p-6">{children}</main>` inside `<div className="flex h-screen">`

- [x] T003 Update `src/app/(dashboard)/layout.tsx` to import `DashboardShell` and replace the inline `<div className="flex h-screen">...</div>` block (including the `<Sidebar />` and `<Header />` renders) with `<DashboardShell userName={session.user.name}>{children}</DashboardShell>` — remove now-unused `Sidebar` and `Header` imports from this file (depends on T002)

- [x] T004 Add `interface SidebarProps { isOpen: boolean; onToggle: () => void }` to `src/components/dashboard/Sidebar.tsx` and update the `Sidebar` function signature to accept `{ isOpen, onToggle }: SidebarProps` (depends on T003)

**Checkpoint**: After T002–T004, the dashboard should still render correctly (sidebar always-open behaviour unchanged). Confirm at `http://localhost:3000/dashboard`.

---

## Phase 3: User Story 1 — Toggle Sidebar Open and Closed (Priority: P1) 🎯 MVP

**Goal**: A toggle button opens and closes the sidebar. The sidebar animates between 240px (expanded, icons + labels) and 56px (collapsed, icons only). The sidebar state persists across page navigations in the same session.

**Independent Test**: Click the toggle button — sidebar collapses to icon-only strip (~56px); click again — sidebar expands to full width (~240px) showing labels. Navigate to another dashboard page — sidebar remains in the same state.

### Implementation for User Story 1

- [x] T005 [US1] On the `<aside>` element in `src/components/dashboard/Sidebar.tsx`, replace the static `className="flex w-[240px] flex-col shrink-0 h-screen sticky top-0 border-r border-[var(--border)]"` with a dynamic class string: add `transition-all duration-200 ease-in-out overflow-hidden` and switch width between `w-60` (expanded) and `w-14` (collapsed) based on `isOpen` (depends on T004)

- [x] T006 [US1] In the logo/brand header `<div className="p-5 border-b border-[var(--border)]">` in `src/components/dashboard/Sidebar.tsx`, add a toggle `<button>` after the logo row that calls `onToggle`, renders a left-chevron SVG (←) when `isOpen` and a right-chevron SVG (→) when `!isOpen`, and has `aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}` with appropriate Tailwind classes for styling (`ml-auto`, `rounded-md`, hover state) (depends on T005)

- [x] T007 [US1] In the logo/brand row in `src/components/dashboard/Sidebar.tsx`, wrap the brand text block (`<h2>FBR Portal</h2>` and `<p>Digital Invoicing</p>`) so it only renders when `isOpen` — use a conditional `{isOpen && <div>...</div>}` — so in collapsed state only the `FBR` icon square shows (depends on T006)

- [x] T008 [US1] In the nav item `<Link>` render in `src/components/dashboard/Sidebar.tsx`, add `whitespace-nowrap` to prevent wrapping during transition, and conditionally render the label text `{item.label}` only when `isOpen` — use `{isOpen && <span>{item.label}</span>}` (depends on T007)

**Checkpoint (US1 complete)**: Sidebar toggles between expanded (240px, icons + labels) and collapsed (56px, icons only) with smooth animation. State persists across page navigations. `aria-label` on toggle button updates correctly.

---

## Phase 4: User Story 2 — Settings Button Fixed at Sidebar Bottom (Priority: P2)

**Goal**: The Settings navigation item is removed from the main nav list and added as a pinned bottom section with a border separator, visible in both expanded and collapsed states.

**Independent Test**: View the sidebar — Settings button is at the bottom, separated by a border from the main nav items. Clicking it navigates to `/settings/business-profile`. This section is visible in both expanded (icon + label) and collapsed (icon only) states.

### Implementation for User Story 2

- [x] T009 [US2] In `src/components/dashboard/Sidebar.tsx`, remove the Settings entry (`href: "/settings/business-profile"`) from the `navItems` array — the HS Codes entry stays in the main nav list (depends on T008)

- [x] T010 [US2] In `src/components/dashboard/Sidebar.tsx`, replace the existing footer `<div className="p-4 border-t border-[var(--border)]">` (which shows `v1.0.0`) with a new footer section that contains: a `<Link href="/settings/business-profile">` styled identically to the existing nav item links (with active state detection for `/settings/business-profile` and `/settings/hs-codes` paths), showing the gear SVG icon — conditionally show the "Settings" label text next to the icon only when `isOpen`, and update the active state check to use `pathname.startsWith("/settings")` (depends on T009)

- [x] T011 [US2] In the Settings bottom link in `src/components/dashboard/Sidebar.tsx`, ensure the link has the same active/inactive styling logic as main nav items: `bg-[var(--primary-subtle)] text-[var(--primary)]` when active, `text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]` when inactive (depends on T010)

**Checkpoint (US2 complete)**: Settings pinned at sidebar bottom with border separator. Active highlight works when on any `/settings/*` path. Settings button visible and functional in both expanded and collapsed sidebar states.

---

## Phase 5: User Story 3 — Collapsed Sidebar Icon-Only Mode with Tooltips (Priority: P3)

**Goal**: When the sidebar is collapsed, every navigation icon shows a native browser tooltip (via `title` attribute) with the item's name on hover. This makes the collapsed sidebar fully navigable without labels.

**Independent Test**: Collapse the sidebar, then hover over each icon — a tooltip appears with the correct page name. Click each icon — navigation occurs correctly.

### Implementation for User Story 3

- [x] T012 [US3] In the `<Link>` element for each main nav item in `src/components/dashboard/Sidebar.tsx`, add `title={item.label}` to the Link element so the browser shows a native tooltip on hover in all states (collapsed and expanded) (depends on T011)

- [x] T013 [US3] On the Settings bottom `<Link>` element in `src/components/dashboard/Sidebar.tsx`, add `title="Settings"` and `aria-label="Settings"` to ensure the tooltip and accessibility label are present in collapsed mode (depends on T012)

**Checkpoint (US3 complete)**: All nav icons in collapsed state show browser tooltips. Collapsed sidebar is fully navigable using only icons + tooltips.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final quality checks, overflow fix, and verification that all acceptance criteria from spec.md are met.

- [x] T014 [P] In `src/components/dashboard/DashboardShell.tsx`, add `min-w-0` to the content wrapper `<div className="flex flex-1 flex-col">` to prevent flex overflow when page content is wider than available space after sidebar collapse (depends on T004)

- [x] T015 Run `npm run typecheck` from repo root and fix any TypeScript errors introduced by the new `SidebarProps` interface or DashboardShell — all errors must reach zero

- [x] T016 [P] Run `npm run lint` from repo root and fix any ESLint warnings introduced by the new/modified components

- [x] T017 Manually run through the full verification checklist from `specs/007-sidebar-toggle/quickstart.md` — confirm all 10 items pass: toggle, state persistence, tooltips, Settings at bottom, active state, aria-label, typecheck, lint

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user stories**
- **Phase 3 (US1 - Toggle)**: Depends on Phase 2 completion (T002, T003, T004)
- **Phase 4 (US2 - Settings Bottom)**: Depends on Phase 3 completion (US1 changes to Sidebar.tsx must land first to avoid conflicts in same file)
- **Phase 5 (US3 - Tooltips)**: Depends on Phase 4 completion (US2 changes to Sidebar.tsx must land first)
- **Phase 6 (Polish)**: Depends on Phases 3–5 completion; T014 and T016 can run in parallel with each other

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational (Phase 2) — no other story dependency
- **US2 (P2)**: Starts after US1 — shares `Sidebar.tsx` with US1; sequential to avoid conflicts
- **US3 (P3)**: Starts after US2 — shares `Sidebar.tsx` with US1 and US2; sequential to avoid conflicts

> **Note**: All three user stories modify `src/components/dashboard/Sidebar.tsx`. They are sequential (not parallel) within the same file. Independent parallelism only applies to `DashboardShell.tsx` vs `layout.tsx` vs `Sidebar.tsx` (separate files).

### Within Each Phase (Sidebar.tsx tasks)

- T005 → T006 → T007 → T008 (sequential, same file, build on each other)
- T009 → T010 → T011 (sequential, same file, build on each other)
- T012 → T013 (sequential, same file)

### Parallel Opportunities

| Parallel Group | Tasks | Why Parallel |
|---------------|-------|-------------|
| Foundation files | T002 conceptually | `DashboardShell.tsx` is a new file |
| After US3 complete | T014 + T016 | Different files: DashboardShell.tsx + lint run |

---

## Parallel Example: Foundational Phase

```bash
# T002 (new file) and T003 (different file) can conceptually proceed once T002 is ready:
Task: "Create DashboardShell.tsx" (new file - T002)
  ↓ complete
Task: "Update layout.tsx" (different file from DashboardShell - T003)
Task: "Add SidebarProps to Sidebar.tsx" (different file from layout - T004) [can start with T003]
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002, T003, T004)
3. Complete Phase 3: User Story 1 (T005–T008)
4. **STOP and VALIDATE**: Toggle button works, sidebar collapses/expands, state persists
5. Optional: Demo before continuing to US2 and US3

### Incremental Delivery

1. Setup + Foundational → Dashboard layout wired to DashboardShell
2. US1 → Sidebar toggle works → **Deliverable #1**
3. US2 → Settings at bottom → **Deliverable #2**
4. US3 → Tooltips in collapsed mode → **Deliverable #3**
5. Polish → Typecheck + lint + verification → **Ready to merge**

### Single Developer Sequence (Recommended)

```
T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008
     → T009 → T010 → T011 → T012 → T013 → T014 → T015 → T016 → T017
```

---

## Summary

| Metric | Count |
|--------|-------|
| Total tasks | 17 |
| Setup (Phase 1) | 1 |
| Foundational (Phase 2) | 3 |
| US1 - Toggle (Phase 3) | 4 |
| US2 - Settings Bottom (Phase 4) | 3 |
| US3 - Tooltips (Phase 5) | 2 |
| Polish (Phase 6) | 4 |
| Files created | 1 (`DashboardShell.tsx`) |
| Files modified | 2 (`layout.tsx`, `Sidebar.tsx`) |
| Tests generated | 0 (not requested) |
| Parallel opportunities | T014 + T016 in Polish phase |

**Suggested MVP scope**: Phases 1–3 (T001–T008) — sidebar toggle functional with 7 tasks.

---

## Notes

- [P] tasks = can execute simultaneously with other tasks (different files or independent operations)
- [Story] label maps each task to its user story for traceability
- All Sidebar.tsx tasks are sequential — same file, each task builds on the previous
- Verify dev server renders correctly after T004 before continuing to US1
- Commit after each phase checkpoint to make rollback easier
- Avoid skipping the typecheck step (T015) — the new `SidebarProps` interface must be satisfied by the `Sidebar` caller in `DashboardShell.tsx`
