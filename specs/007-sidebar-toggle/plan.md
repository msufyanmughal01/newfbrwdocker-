# Implementation Plan: Sidebar Toggle with Settings Button

**Branch**: `007-sidebar-toggle` | **Date**: 2026-02-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-sidebar-toggle/spec.md`

---

## Summary

Add a toggle button to the dashboard sidebar that collapses it to an icon-only strip and expands it back to full width. Move the Settings navigation item to a pinned bottom section of the sidebar, separated from the main nav. The implementation requires a new `DashboardShell` client component to hold sidebar state, with minimal changes to `Sidebar.tsx` and `layout.tsx`.

---

## Technical Context

**Language/Version**: TypeScript 5.x, React 19
**Primary Dependencies**: Next.js 16.1.6 (App Router), Tailwind CSS v4, next-themes
**Storage**: N/A — sidebar state is in-memory React state (no persistence needed per spec)
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Web (dashboard, desktop-first)
**Project Type**: Web application — Next.js App Router with Server and Client components
**Performance Goals**: Sidebar toggle transition completes in under 300ms (CSS transition, no JS animation library)
**Constraints**: No new dependencies; smallest viable diff; must pass `typecheck` and `lint`
**Scale/Scope**: 3 files modified/created; pure UI feature; no data layer changes

---

## Constitution Check

*GATE: Must pass before proceeding to implementation.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Clarity Above All | ✅ PASS | Component names (`DashboardShell`, `Sidebar`) clearly reveal purpose; props `isOpen`/`onToggle` are self-documenting |
| II. Consistency Is Mandatory | ✅ PASS | Follows existing pattern: client components with `"use client"`, Tailwind classes, CSS variables for theming |
| III. Simplicity Over Complexity | ✅ PASS | 1 new file, 2 modified files. Props over Context. CSS transitions over JS animation library. |
| IV. Purpose-Driven Development | ✅ PASS | Every change maps to a specific FR in the spec. No speculative code. |
| V. Quality Cannot Be Compromised | ✅ PASS | Accessibility attributes (`aria-label`, `title`) required; typecheck must pass |
| VI. Transparency of Changes | ✅ PASS | Changes documented here; implementation notes in code where patterns deviate |
| VII. Scalability of Structure | ✅ PASS | New component `DashboardShell` is additive; existing Sidebar shape preserved with new props |
| VIII. Security Is Not Optional | ✅ PASS | No auth changes; no user input; no data exposure |
| IX. Data Integrity | ✅ PASS | No financial or persistent data involved |
| X. Testability | ✅ PASS | `DashboardShell` and `Sidebar` are independently testable via props |

**Gate Result**: ✅ ALL PASS — proceed to implementation.

---

## Project Structure

### Documentation (this feature)

```text
specs/007-sidebar-toggle/
├── plan.md              ← This file
├── spec.md              ← Feature requirements
├── research.md          ← Phase 0: decisions and rationale
├── data-model.md        ← Component state model
├── quickstart.md        ← Developer guide
├── contracts/
│   └── component-api.md ← Component prop contracts
├── checklists/
│   └── requirements.md  ← Spec quality checklist
└── tasks.md             ← Phase 2 output (from /sp.tasks)
```

### Source Code Changes

```text
src/
├── app/
│   └── (dashboard)/
│       └── layout.tsx              ← MODIFIED: delegate to DashboardShell
└── components/
    └── dashboard/
        ├── DashboardShell.tsx      ← NEW: client wrapper, holds sidebar state
        └── Sidebar.tsx             ← MODIFIED: isOpen/onToggle props, collapsed mode, Settings at bottom
```

**Structure Decision**: Single project, web application. All changes stay within `src/components/dashboard/` and `src/app/(dashboard)/`. No new directories needed outside of the existing source structure.

---

## Architecture Design

### Approach: Client Wrapper with Props Drilling

The dashboard `layout.tsx` is a Next.js Server Component. Sidebar toggle state is interactive and must live in a Client Component. The solution:

1. **`DashboardShell.tsx`** (new, `"use client"`) — holds `isSidebarOpen` state, renders the flex container, passes `isOpen` + `onToggle` to `Sidebar` and `userName` to `Header`.
2. **`layout.tsx`** (modified) — remains a Server Component. Handles auth, then delegates rendering to `DashboardShell`. Passes `session.user.name` as a prop.
3. **`Sidebar.tsx`** (modified) — becomes a controlled component. Accepts `isOpen` and `onToggle` props. Renders two modes: expanded (labels visible) and collapsed (icons + tooltips only). Settings item moves to the bottom section.

### Data Flow

```text
layout.tsx (Server)
  └─ DashboardShell (Client, holds state)
       ├─ Sidebar (Client, controlled by isOpen/onToggle)
       │    ├─ Toggle button [calls onToggle]
       │    ├─ Nav items [collapsed ↔ expanded]
       │    └─ Settings bottom section
       └─ Header (Client)
            └─ main > {children}
```

### Sidebar Toggle Animation

```text
Expanded (w-60 = 240px)
  │ transition-all duration-200 ease-in-out
  ▼
Collapsed (w-14 = 56px)
```

- `aside` element: `transition-all duration-200 ease-in-out overflow-hidden`
- Nav labels: `whitespace-nowrap` + fade out via `opacity-0` / `hidden` when `!isOpen`
- Toggle chevron: rotates or swaps icon based on `isOpen`

---

## Implementation Phases

### Phase 1: Create DashboardShell.tsx

**File**: `src/components/dashboard/DashboardShell.tsx` (new)

- `"use client"` directive
- `useState(true)` for `isSidebarOpen`
- `toggleSidebar` callback using functional update
- Renders `<Sidebar isOpen onToggle>` + `<Header>` + `<main>`
- Content area div uses `min-w-0` to prevent flex overflow with long content

**Acceptance**: Component renders the full dashboard layout; toggling `isSidebarOpen` via `toggleSidebar` changes the state.

---

### Phase 2: Modify layout.tsx

**File**: `src/app/(dashboard)/layout.tsx`

- Import `DashboardShell`
- Replace inline `<div className="flex h-screen">...</div>` with `<DashboardShell userName={session.user.name}>{children}</DashboardShell>`
- Remove `Sidebar` and `Header` imports (now imported by DashboardShell)

**Acceptance**: Dashboard loads correctly with no visual regressions; auth redirect still works.

---

### Phase 3: Modify Sidebar.tsx

**File**: `src/components/dashboard/Sidebar.tsx`

Changes:
1. Add `SidebarProps` interface: `{ isOpen: boolean; onToggle: () => void }`
2. Update `navItems` — remove the two Settings-related entries (`/settings/business-profile`, `/settings/hs-codes`) — wait, re-reading spec: only the Settings one moves to bottom. HS Codes stays in main nav. Remove just the Settings entry from navItems.
3. Add toggle button in the logo/brand header area with:
   - Left chevron SVG when `isOpen` (to collapse)
   - Right chevron SVG when `!isOpen` (to expand)
   - `aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}`
4. Sidebar `aside` element width: `isOpen ? "w-60" : "w-14"` with `transition-all duration-200 ease-in-out overflow-hidden`
5. Logo/brand area: hide text labels when `!isOpen`
6. Nav items: hide text labels when `!isOpen`; add `title={item.label}` to `<Link>` for tooltip when collapsed
7. Add bottom Settings section:
   - Border-top separator
   - Settings link with icon + label (when open) or icon + title tooltip (when collapsed)
   - Active state detection for settings paths

**Acceptance**: Sidebar collapses to 56px icon-only strip; expands to 240px with labels; Settings visible at bottom; tooltips work in collapsed mode; typecheck passes.

---

## Non-Functional Requirements

| NFR | Approach |
|-----|----------|
| Accessibility | `aria-label` on toggle button; `title` attributes for tooltips; keyboard-navigable links |
| Performance | CSS-only transition (no JS animation); no re-renders on navigation (state in layout shell) |
| No new dependencies | Only React hooks + Tailwind classes used |
| Type safety | `SidebarProps` interface; no `any` types |

---

## Risk Analysis

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Content overflow in collapsed sidebar during animation | Low | `overflow-hidden` on `aside` prevents content bleed |
| Text wrapping during width transition | Low | `whitespace-nowrap` on nav labels |
| Server/Client component boundary error | Low | `DashboardShell` is clearly `"use client"`; `layout.tsx` stays server |

---

## Definition of Done

- [ ] `DashboardShell.tsx` created with correct state management
- [ ] `layout.tsx` updated to use `DashboardShell`
- [ ] `Sidebar.tsx` accepts `isOpen`/`onToggle` props
- [ ] Sidebar collapses to 56px, expands to 240px with animation
- [ ] Toggle button visible in both states with correct `aria-label`
- [ ] Nav icons show `title` tooltip in collapsed state
- [ ] Settings item pinned at sidebar bottom with border separator
- [ ] `npm run typecheck` produces zero errors
- [ ] `npm run lint` produces no new warnings
- [ ] No visual regressions on existing dashboard pages
