# Research: Sidebar Toggle with Settings Button

**Feature**: 007-sidebar-toggle
**Date**: 2026-02-22
**Phase**: 0 — Pre-design research

---

## Decision 1: Sidebar State Management Strategy

**Decision**: React component state in a dedicated `DashboardShell` client wrapper component, passed via props to Sidebar.

**Rationale**:
- The dashboard layout (`layout.tsx`) is a Next.js Server Component. State cannot live there directly.
- A client wrapper component (`DashboardShell.tsx`) holds `isSidebarOpen: boolean` with `useState`. It renders the flex layout, passes props to `Sidebar`.
- Only 1 level of prop drilling (Shell → Sidebar). Context would be over-engineering for 2 consumers.
- State persists across page navigations automatically because Next.js App Router keeps client components mounted during route transitions within the same layout segment.

**Alternatives considered**:

| Alternative | Rejected Because |
|-------------|-----------------|
| React Context (SidebarContext) | Unnecessary abstraction for 2 consumers at 1 level depth; adds a file with no benefit |
| localStorage persistence | Future enhancement per spec assumptions; adds complexity before it's needed |
| URL search params | Changes the URL on every toggle; unexpected behavior for a layout preference |
| CSS-only toggle (checkbox hack) | Not accessible; no React state means no controlled behavior |

---

## Decision 2: Collapsed Sidebar Width

**Decision**: 56px (`w-14` in Tailwind) for collapsed state; 240px (`w-60`) for expanded.

**Rationale**:
- 56px is wide enough for a 24px icon centered with 16px padding on each side.
- 240px matches the existing sidebar width (`w-[240px]`) — no change to expanded state.
- These are standard dashboard collapsed/expanded widths (VS Code: 48px, Linear: 56px).

**Alternatives considered**:

| Alternative | Rejected Because |
|-------------|-----------------|
| 48px collapsed | Slightly too tight; icon padding feels cramped |
| 64px collapsed | Wastes 8px more than needed |

---

## Decision 3: Toggle Button Placement

**Decision**: A chevron/arrow button inside the Sidebar at the top, positioned in the logo/brand area row, flush right edge of the sidebar.

**Rationale**:
- Always visible in both states since it's part of the sidebar itself.
- Follows the pattern used in VS Code, Notion, Linear — toggle button is part of the sidebar header.
- In collapsed state, the button becomes a "→" (expand) chevron; in expanded state, "←" (collapse).

**Alternatives considered**:

| Alternative | Rejected Because |
|-------------|-----------------|
| Button in the Header component | Would require the Header to know about sidebar state, adding coupling |
| Floating button outside sidebar | Poor visual cohesion; harder to implement cleanly |
| Click on sidebar edge/drag | Complex UX; not mobile-friendly |

---

## Decision 4: Tooltip Implementation

**Decision**: Native HTML `title` attribute for collapsed sidebar tooltips as the minimal implementation.

**Rationale**:
- No new library required (aligns with constitution principle: no unapproved dependencies).
- `title` attribute provides native browser tooltips on hover, adequate for desktop dashboard use.
- The spec requires tooltips (FR-009) but does not specify custom styling.

**Alternatives considered**:

| Alternative | Rejected Because |
|-------------|-----------------|
| Custom CSS tooltip (via `::before`/`::after`) | Extra CSS complexity for the same functional outcome |
| Third-party tooltip library | Unapproved dependency; violates constitution constraint |

---

## Decision 5: Settings Button at Bottom — Approach

**Decision**: Move the two Settings-related nav items (`/settings/business-profile`, `/settings/hs-codes`) out of the main `navItems` array. Add a dedicated Settings section rendered in the sidebar footer, separated by a border. Show a single "Settings" entry linking to `/settings/business-profile`, with HS Codes kept in the main nav OR consolidated under Settings.

**Refined Approach**: Keep `HS Codes` in main nav (it's a lookup tool, not a settings preference). Add a single `Settings` bottom button linking to `/settings/business-profile`. Remove the Settings and HS Codes entries from navItems if they duplicate.

**Actually**: Reading the spec more carefully — FR-007 says "The Settings navigation item MUST be positioned at the bottom". The existing Sidebar already has a Settings nav item in the main list. The change is to move it from the main list to the bottom section. HS Codes stays in the main nav.

**Rationale**:
- Matches spec requirement FR-007 exactly — Settings is anchored at bottom.
- Consistent with industry convention (VS Code, Slack, Linear, Notion all do this).
- The visual separator (border-top) between main nav and Settings section makes the hierarchy clear.

---

## Decision 6: Animation / Transition

**Decision**: CSS transition on the `width` property of the sidebar `aside` element, with `overflow: hidden` to clip content during transition.

**Rationale**:
- Tailwind `transition-all duration-200` handles width animation smoothly.
- `overflow-hidden` on the sidebar prevents label text from wrapping during the collapse transition.
- `whitespace-nowrap` on nav item labels ensures they are clipped cleanly, not wrapped.
- No JavaScript animation library needed.

---

## Summary of Resolved Unknowns

| Unknown | Resolution |
|---------|-----------|
| Where does sidebar state live? | `DashboardShell.tsx` client wrapper, `useState` |
| Do we need Context? | No — 1 level of props is sufficient |
| Collapsed width? | 56px (`w-14`) |
| Toggle button placement? | Inside sidebar header row, chevron icon |
| Tooltip approach? | Native `title` attribute |
| Settings at bottom — what exactly changes? | Move Settings entry from main navItems to dedicated bottom section; HS Codes stays in main nav |
| Animation approach? | CSS `transition-all duration-200` on sidebar width |
