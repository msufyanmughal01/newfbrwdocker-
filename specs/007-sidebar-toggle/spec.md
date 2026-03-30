# Feature Specification: Sidebar Toggle with Settings Button

**Feature Branch**: `007-sidebar-toggle`
**Created**: 2026-02-22
**Status**: Draft
**Input**: User description: "i want you to do the sidebar open and close via button and in the sidebar the setting button in the bottom"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Toggle Sidebar Open and Closed (Priority: P1)

A user working on the dashboard wants to maximize screen space when reviewing invoices or data-heavy pages. They click a toggle button to collapse the sidebar, gaining more horizontal space. When they need to navigate, they click the button again to expand the sidebar and see full navigation labels.

**Why this priority**: Core navigation usability. This is the primary feature requested and directly impacts every user's daily workflow by allowing them to control the layout.

**Independent Test**: Can be fully tested by clicking the toggle button and verifying the sidebar collapses/expands, delivering the screen-space optimization value independently of the settings button.

**Acceptance Scenarios**:

1. **Given** the sidebar is fully expanded, **When** the user clicks the toggle button, **Then** the sidebar collapses to a narrow icon-only strip and the main content area expands to fill the freed space.
2. **Given** the sidebar is collapsed, **When** the user clicks the toggle button, **Then** the sidebar expands to its full width showing both icons and navigation labels.
3. **Given** the sidebar is in either state, **When** the user navigates to a different page, **Then** the sidebar remains in the same open/closed state (state persists across navigation).

---

### User Story 2 - Settings Button Fixed at Sidebar Bottom (Priority: P2)

A user needs quick access to Settings at any time during their workflow. The Settings navigation item is anchored at the bottom of the sidebar, visually separated from the main navigation list, making it always discoverable and consistently positioned regardless of how many nav items exist above it.

**Why this priority**: Improves Settings discoverability and follows common dashboard UX patterns (VS Code, Slack, Linear) where Settings is always at the bottom.

**Independent Test**: Can be tested independently by verifying the Settings button appears at the bottom of the sidebar, separated from main nav items, in both expanded and collapsed sidebar states.

**Acceptance Scenarios**:

1. **Given** the sidebar is expanded, **When** the user views the sidebar, **Then** a Settings button appears at the bottom of the sidebar, visually separated from the main navigation items above it, showing both an icon and a "Settings" label.
2. **Given** the sidebar is collapsed, **When** the user views the collapsed sidebar, **Then** the Settings button remains visible at the bottom as an icon-only button with a tooltip showing "Settings" on hover.
3. **Given** the user clicks the Settings button, **When** on any page, **Then** they are navigated to the Settings page.

---

### User Story 3 - Collapsed Sidebar Icon-Only Mode (Priority: P3)

A power user who knows the navigation by icon wants to operate in collapsed mode permanently. Each navigation icon in the collapsed sidebar shows a tooltip with the page name on hover, so the user can still navigate without guessing.

**Why this priority**: Enhances the collapsed mode experience so it's fully functional, not just a hidden state.

**Independent Test**: Can be tested independently by collapsing the sidebar and hovering over each icon to verify tooltips appear with the correct page name.

**Acceptance Scenarios**:

1. **Given** the sidebar is collapsed, **When** the user hovers over any navigation icon, **Then** a tooltip appears showing the navigation item's name.
2. **Given** the sidebar is collapsed, **When** the user clicks any navigation icon, **Then** they are navigated to that page correctly.

---

### Edge Cases

- What happens when the toggle button is in the collapsed state — the toggle button must remain visible and accessible even when the sidebar is narrow.
- How does the system handle the sidebar state on initial page load? Default to expanded state.
- What happens if the sidebar is collapsed and a navigation label is needed for accessibility? Tooltips and aria-labels must be present.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The sidebar MUST have a toggle button that opens and closes it when clicked.
- **FR-002**: The toggle button MUST be visible and accessible in both the expanded and collapsed sidebar states.
- **FR-003**: When collapsed, the sidebar MUST show only icons (no text labels) for all navigation items.
- **FR-004**: When expanded, the sidebar MUST show both icons and text labels for all navigation items.
- **FR-005**: The sidebar MUST transition smoothly between expanded and collapsed states with a visible animation.
- **FR-006**: The sidebar's open/closed state MUST persist across page navigations within the same browser session.
- **FR-007**: The Settings navigation item MUST be positioned at the bottom of the sidebar, visually separated from the main navigation list.
- **FR-008**: The Settings button at the bottom MUST be visible in both expanded (icon + label) and collapsed (icon only) states.
- **FR-009**: When the sidebar is collapsed, hovering over any navigation icon MUST display a tooltip with the item's name.
- **FR-010**: The main content area MUST expand to fill the space freed when the sidebar collapses.

### Assumptions

- The existing Settings nav items (Business Profile, HS Codes) remain as-is in the main nav, and an additional dedicated Settings button is added to the sidebar bottom section as a fixed anchor.
- Sidebar state is stored in-memory (React state or context) within the session — localStorage persistence is a future enhancement.
- The toggle button will be placed at the top of the sidebar near the logo/branding area.
- Collapsed sidebar width will be narrow enough to show icons only (approximately 56-64px).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can toggle the sidebar open and closed in a single click, with the transition completing visibly in under 300ms.
- **SC-002**: The main content area gains additional horizontal space when the sidebar is collapsed, with no content overflow or layout breaks.
- **SC-003**: The Settings button is reachable from the bottom of the sidebar without scrolling, regardless of the number of navigation items above it.
- **SC-004**: All navigation items remain fully functional in both sidebar states — zero broken links or missing routes.
- **SC-005**: The sidebar state does not reset when the user navigates between different dashboard pages within the same browser session.

## Dependencies & Constraints

- Depends on the existing `Sidebar` component (`src/components/dashboard/Sidebar.tsx`) and dashboard layout (`src/app/(dashboard)/layout.tsx`).
- The toggle state must be shared between the Sidebar component and the layout so the main content area can adjust its width accordingly.
- No new external libraries required — uses existing CSS transitions and React state management.
