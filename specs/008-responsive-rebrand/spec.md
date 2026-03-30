# Feature Specification: Responsive Design & App Rebrand to TaxDigital

**Feature Branch**: `008-responsive-rebrand`
**Created**: 2026-02-26
**Status**: Draft
**Input**: User description: "do the whole app responsive for mobile and any other device and change the name of the app to taxdigital"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mobile User Accesses the App (Priority: P1)

A user on a smartphone opens TaxDigital, logs in, navigates the dashboard, views invoices, and creates a new invoice — all without needing to pinch-zoom or scroll horizontally. The sidebar collapses into a drawer that slides in from a hamburger menu button in the header.

**Why this priority**: Mobile users are blocked entirely from using the app today — the fixed sidebar and non-responsive layouts make core workflows unusable on small screens. This is the most critical usability gap.

**Independent Test**: Can be fully tested on a 375px-wide viewport by logging in, navigating to Invoices, and creating a new invoice — delivering full app usability on mobile.

**Acceptance Scenarios**:

1. **Given** a viewport width of 375px (mobile), **When** a user loads the dashboard, **Then** the sidebar is hidden by default and a hamburger menu icon is visible in the header
2. **Given** the hamburger menu is tapped, **When** the sidebar drawer opens, **Then** it overlays the content with a backdrop and contains all navigation items
3. **Given** a user is on any page on mobile, **When** they tap a nav item in the drawer, **Then** the drawer closes and the page navigates correctly
4. **Given** a viewport under 640px, **When** any page is displayed, **Then** no horizontal scrolling occurs and all content is readable without zooming

---

### User Story 2 - App Branding Shows TaxDigital (Priority: P2)

A user sees "TaxDigital" as the app's name in the browser tab, the login screen, the sidebar logo, and the top header — replacing all "FBR Portal" / "FBR Invoicing" / "FBR Digital Invoicing Portal" brand labels.

**Why this priority**: The rebrand is a direct business requirement. All visible UI brand text must be updated while keeping all FBR tax authority integration labels (e.g. "Submit to FBR", "FBR Invoice Number") unchanged.

**Independent Test**: Can be fully tested by visiting the login page, dashboard, and any invoice page and verifying all brand labels read "TaxDigital".

**Acceptance Scenarios**:

1. **Given** a user opens the browser, **When** any page loads, **Then** the browser tab title reads "TaxDigital"
2. **Given** a user is on the login page, **When** the page renders, **Then** the app logo/heading shows "TaxDigital" and the subtitle reads "Digital Invoicing Portal"
3. **Given** a user is on the dashboard, **When** the sidebar is visible, **Then** the logo badge shows "TD" and the app name reads "TaxDigital"
4. **Given** a user is viewing the header bar, **When** the header renders, **Then** it reads "TaxDigital" — not "FBR Digital Invoicing Portal"
5. **Given** any FBR tax authority functional label (e.g. "FBR Status", "Submit to FBR", "FBR Invoice No."), **When** those elements render, **Then** they remain unchanged — only brand/product name labels are updated

---

### User Story 3 - Tablet User Uses the Invoice Form (Priority: P3)

A user on a tablet (768px–1024px viewport) creates a new invoice. The invoice form, line items table, and buyer search all fit neatly within the viewport without overflow. The sidebar remains visible in collapsed icon mode.

**Why this priority**: Tablets are a common device for business users. The form is complex and the layout must adapt gracefully to medium viewports.

**Independent Test**: Can be fully tested on an iPad-sized viewport (768px) by navigating to New Invoice and completing the full form — delivering a functional invoice creation experience on tablets.

**Acceptance Scenarios**:

1. **Given** a viewport of 768px, **When** the New Invoice form loads, **Then** all form fields are visible and usable without horizontal scrolling
2. **Given** a viewport of 768px, **When** the line items table is displayed, **Then** the table either scrolls horizontally within a contained scroll area or stacks into a readable card layout
3. **Given** a viewport of 768px, **When** the sidebar is visible, **Then** it displays in icon-only collapsed mode by default

---

### User Story 4 - Mobile User Views Invoice List & Dashboard (Priority: P4)

A user on mobile views the Invoices list page and the Dashboard metrics. Data tables reformat to a card or vertically stacked layout on narrow screens, and dashboard metric cards stack into a single-column grid.

**Why this priority**: Read-only views are the most frequent use case. Tables and metric cards must degrade gracefully on mobile.

**Independent Test**: Can be tested independently on 375px by visiting /dashboard and /invoices — visible data without horizontal overflow constitutes a pass.

**Acceptance Scenarios**:

1. **Given** a viewport of 375px, **When** the invoices list page renders, **Then** the table either scrolls within a bounded container or renders as stacked cards
2. **Given** a viewport of 375px, **When** the dashboard renders, **Then** metric cards stack in a single column and no card overflows its container
3. **Given** a viewport of 375px, **When** the clients page renders, **Then** client data is accessible without horizontal scrolling

---

### Edge Cases

- What happens when the sidebar drawer is open and the user rotates from portrait to landscape? The drawer closes automatically when the viewport width crosses 768px.
- How does the app handle very long user names in the header on mobile? The name is truncated with an ellipsis; the avatar always remains visible.
- What happens to the print invoice page on mobile? Print pages are designed for paper output (A4/letter) and are excluded from responsive changes; a banner may indicate this is a print-only view.
- How does the invoice form line items row behave on mobile? The row scrolls horizontally within its bounded container — the page itself does not scroll sideways.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: App name in the browser tab title MUST read "TaxDigital" across all pages
- **FR-002**: Auth pages (login, register, forgot password, reset password, setup organisation) MUST display "TaxDigital" as the app brand heading, replacing "FBR Invoicing"
- **FR-003**: The sidebar logo badge MUST display "TD" and the app label MUST read "TaxDigital" when the sidebar is expanded
- **FR-004**: The dashboard header MUST display "TaxDigital" instead of "FBR Digital Invoicing Portal"
- **FR-005**: FBR tax authority references in functional labels (e.g., "Submit to FBR", "FBR Invoice Number", "FBR Status", "FBR Error") MUST remain unchanged
- **FR-006**: On viewports narrower than 768px, the sidebar MUST be hidden by default and a hamburger/menu icon MUST appear in the header
- **FR-007**: Tapping the hamburger icon MUST open a sidebar drawer that slides in from the left and overlays the page content with a semi-transparent backdrop
- **FR-008**: Tapping any navigation item in the mobile drawer MUST close the drawer and navigate to the selected page
- **FR-009**: Tapping the backdrop outside the mobile drawer MUST close the drawer
- **FR-010**: On viewports 768px and wider, the existing sidebar toggle behaviour (expand/collapse icon-only mode) MUST be preserved unchanged
- **FR-011**: All data tables (invoices list, clients list) MUST be contained within a horizontally-scrollable wrapper on mobile so the page itself does not scroll horizontally
- **FR-012**: Dashboard metric cards MUST stack in a single column on viewports narrower than 640px
- **FR-013**: The New Invoice form MUST be usable on viewports from 375px wide — all input fields, buttons, and the line items area MUST be accessible
- **FR-014**: The app MUST NOT require horizontal page-level scrolling on any viewport 375px or wider (print pages excluded)
- **FR-015**: The header on mobile MUST show the hamburger icon alongside the existing user avatar and logout controls

### Key Entities

- **Viewport breakpoints**: Mobile (< 768px), Tablet (768px–1023px), Desktop (≥ 1024px)
- **Sidebar drawer**: A mobile-only overlay panel containing full navigation, triggered by the hamburger icon; dismissed by tapping a nav item or the backdrop
- **Brand labels**: UI text that identifies the product (page titles, logo text, browser tab) — distinct from FBR authority references
- **FBR authority labels**: Functional labels tied to Pakistan's Federal Board of Revenue API integration — not to be changed

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All pages render without horizontal scrolling on a 375px-wide viewport (iPhone SE size)
- **SC-002**: All brand-facing text across all pages reads "TaxDigital" — zero remaining instances of "FBR Invoicing", "FBR Portal", or "FBR Digital Invoicing Portal" as a product brand label in the rendered UI
- **SC-003**: The sidebar drawer on mobile opens and closes with a single tap — no layout shift or flicker
- **SC-004**: The invoice creation flow can be completed end-to-end on a 375px viewport without requiring zoom or horizontal page scrolling
- **SC-005**: Dashboard and invoices list are fully readable on a 375px viewport with all key data (invoice number, status, amount) visible
- **SC-006**: Tablet (768px) viewport renders the sidebar in collapsed icon mode and all forms are accessible without horizontal scrolling

## Assumptions

- FBR functional references (API labels, submission status labels) are intentionally kept as "FBR" — they refer to the government authority, not the app brand
- Print invoice pages (`/invoices/[id]/print`) are excluded from responsive requirements — they are designed for paper output
- The existing dark-mode/light-mode colour scheme and visual design tokens are preserved; this feature only adds responsive behaviour and updates brand text
- "TaxDigital" is written as one word, PascalCase, as the canonical spelling for the app name
- The sidebar abbreviation badge uses "TD" (initials of TaxDigital) as the collapsed logo mark
- No new pages or routes are required — only existing pages need responsive updates
