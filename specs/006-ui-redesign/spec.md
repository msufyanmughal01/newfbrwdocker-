# Feature Specification: Premium UI Redesign with Dark/Light Mode

**Feature Branch**: `006-ui-redesign`
**Created**: 2026-02-21
**Status**: Draft
**Input**: User description: Full UI redesign of FBR Digital Invoicing Portal — premium, modern interface with dark/light mode toggle using CSS variable design system, next-themes, and DM Sans typography.

---

## Overview

The FBR Digital Invoicing Portal currently uses hardcoded Tailwind color classes (bg-white, text-gray-*, border-gray-*, from-slate-*) that do not support theme switching. This feature replaces the entire visual layer with a professional design system built on CSS custom properties, enabling seamless dark/light mode toggling while keeping all business logic, API integrations, and data models completely untouched.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Theme Toggle Works Reliably (Priority: P1)

An authenticated user visits the portal dashboard and sees a theme toggle button in the header. They click it and the entire interface instantly switches between dark and light mode without any page reload, flash of incorrect theme, or layout shift.

**Why this priority**: The entire redesign delivers zero value if the theme toggle doesn't work correctly. This is the core deliverable and must be verified first.

**Independent Test**: Open the dashboard in a browser, click the toggle button in the header. Verify the interface switches to the opposite theme within 200ms and all components (sidebar, tables, cards, forms) reflect the new theme correctly.

**Acceptance Scenarios**:

1. **Given** the portal is in dark mode, **When** the user clicks the theme toggle, **Then** the entire interface switches to light mode within 200ms with no visible flash.
2. **Given** the portal is in light mode, **When** the user clicks the theme toggle, **Then** the interface switches to dark mode and the toggle icon updates to reflect the new state.
3. **Given** the user previously selected dark mode, **When** they reload the page or navigate to another section, **Then** the theme preference is persisted and dark mode is still active.
4. **Given** a user's OS is set to dark mode, **When** they open the portal for the first time, **Then** dark mode is applied by default.

---

### User Story 2 — Dashboard Looks Professional in Both Modes (Priority: P1)

A portal user navigates to the dashboard and sees a polished, premium interface: metric cards with accent icons and hover animations, a clean sidebar with SVG nav icons, a header with breadcrumb and user controls — all rendered correctly in both dark and light mode.

**Why this priority**: The dashboard is the first screen users see after login. Its visual quality sets the tone for the entire portal experience.

**Independent Test**: Load the dashboard in both dark and light mode. Verify metric cards, sidebar navigation, header, and content area all display correctly with no color inconsistencies, broken layouts, or hardcoded white/gray colors visible.

**Acceptance Scenarios**:

1. **Given** dark mode is active, **When** the dashboard loads, **Then** the background is deep navy (#080c14), surfaces use translucent glass effect, and indigo accent colors are visible on primary elements.
2. **Given** light mode is active, **When** the dashboard loads, **Then** the background is light gray (#f8f9fc), surfaces are white (#ffffff), and the same indigo primary color is used consistently.
3. **Given** either mode is active, **When** the user hovers over a metric card, **Then** the card subtly lifts (translate-y) and a shadow deepens to indicate interactivity.
4. **Given** either mode is active, **When** the user looks at the sidebar, **Then** active nav item is highlighted with a primary-subtle background and primary text color, all other items use muted styling.

---

### User Story 3 — Invoice Creation Form Is Fully Styled (Priority: P2)

A user navigates to create a new invoice. The form sections appear as bordered cards with consistently styled inputs, labels, buttons, and section dividers — all using the CSS variable system so they look correct in both dark and light mode.

**Why this priority**: Invoice creation is the core workflow. Poorly styled inputs or invisible labels would block the primary user task.

**Independent Test**: Navigate to New Invoice in both modes. Fill out buyer info, add a line item, check that all inputs, selects, textareas, and buttons are clearly visible and styled correctly.

**Acceptance Scenarios**:

1. **Given** dark mode is active, **When** the user views the invoice form, **Then** all input fields have a visible background (surface-2 tone), clearly readable text, and a focused state that highlights with an indigo ring.
2. **Given** light mode is active, **When** the user views the invoice form, **Then** inputs are on a light background with dark text, and focus states are visible.
3. **Given** either mode, **When** the user hovers over the primary "Submit" button, **Then** the button slightly lifts and its shadow deepens.

---

### User Story 4 — Tables Display Correctly in Both Modes (Priority: P2)

A user views the invoices list, drafts list, clients list, or HS codes list. Each table renders with rounded container, properly styled header row, alternating hover states on rows, and all status badges use semantic colors.

**Why this priority**: Tables are the most used data-viewing surfaces in the portal. Broken table styling severely impacts readability.

**Independent Test**: Navigate to Invoices, Drafts, Clients, and HS Codes pages in both modes. Verify the table container, header, rows, and badges all display correctly.

**Acceptance Scenarios**:

1. **Given** either mode, **When** a table is displayed, **Then** rows have a subtle hover background change (surface-2) on mouse-over.
2. **Given** an invoice has "draft" status, **When** displayed in the status badge, **Then** the badge shows a muted dot color with muted text.
3. **Given** an invoice has "validated" or "issued" status, **When** displayed in the status badge, **Then** the badge shows green (positive) dot and text.
4. **Given** an invoice has "failed" status, **When** displayed, **Then** the badge shows red (error) styling.

---

### User Story 5 — Auth Pages Are Consistent with Design System (Priority: P3)

A visitor opens the login, register, forgot-password, or reset-password page. The form inputs, labels, error messages, and buttons all use the CSS variable system and work in both dark and light mode.

**Why this priority**: Auth pages are the entry point to the portal. While they have existing glass card styling, cleaning up hardcoded colors ensures consistency.

**Independent Test**: Open login page in both modes. Verify input fields, labels, error messages, and social login buttons use the design system tokens rather than hardcoded gray/white classes.

**Acceptance Scenarios**:

1. **Given** dark mode, **When** the login page loads, **Then** no white backgrounds or gray borders are visible — all use CSS variable tokens.
2. **Given** either mode, **When** the user submits invalid credentials, **Then** the error message uses `var(--error)` color and `var(--error-bg)` background.
3. **Given** either mode, **When** the user focuses an input, **Then** a primary-colored focus ring appears around the field.

---

### Edge Cases

- What happens when JavaScript is disabled or slow to load (SSR)? The `suppressHydrationWarning` on `<html>` prevents hydration mismatch, and `defaultTheme="dark"` ensures the correct theme renders server-side.
- What happens on a system that doesn't support CSS custom properties? All CSS variables have meaningful fallbacks through the design system hierarchy.
- What happens when a user clears localStorage? The portal falls back to the system OS preference, then to dark mode as the configured default.
- How does the theme toggle behave when `resolvedTheme` is undefined (initial render)? The button should render in a neutral/placeholder state until the theme resolves client-side to prevent flicker.
- What if a component still has hardcoded Tailwind color classes mixed with CSS var classes? The hardcoded classes take precedence and will break the theme. The requirement is zero hardcoded color classes in UI components.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a `ThemeProvider` component wrapping the entire app that enables class-based dark/light mode switching via `next-themes`.
- **FR-002**: System MUST include a `ThemeToggle` button in the dashboard header that switches between dark and light mode on click, showing a sun icon in dark mode and moon icon in light mode.
- **FR-003**: System MUST persist the user's theme selection across page navigations and browser sessions.
- **FR-004**: System MUST apply `suppressHydrationWarning` on the root `<html>` element to prevent server/client theme mismatch warnings.
- **FR-005**: The global CSS MUST define a complete set of semantic CSS custom properties for both `.light` and `.dark` class contexts, covering: background layers (bg, bg-subtle, surface 1/2/3), border tiers (border, border-strong), text tiers (foreground, foreground-muted, foreground-subtle), primary, accent, semantic status colors (positive, warning, error, info), and shadow variants.
- **FR-006**: The Sidebar component MUST be redesigned with a 240px width, SVG-based nav icons (no emojis), active/hover states using CSS variable tokens, and a gradient logo area.
- **FR-007**: The Header component MUST include the ThemeToggle, user avatar, username, and sign-out button, with a frosted-glass background using CSS variables.
- **FR-008**: The MetricCard component MUST use CSS variable tokens for all styling (surface background, border, shadow) and include hover lift animation.
- **FR-009**: All form inputs, selects, and textareas across the portal MUST use the unified input styling: surface-2 background, border token, primary focus ring.
- **FR-010**: ALL hardcoded Tailwind color utilities (bg-white, bg-gray-*, text-gray-*, border-gray-*, from-slate-*, bg-green-*, etc.) MUST be removed from all UI component and page files and replaced with CSS variable-based classes.
- **FR-011**: A reusable `Badge` component MUST be created with semantic status variants (draft, issued/validated, failed, submitting/validating) using CSS variable tokens and a dot indicator.
- **FR-012**: Modals (e.g., ClientFormModal) MUST use `bg-[var(--bg-subtle)]` for the panel, never `bg-white`.
- **FR-013**: Auth page components (LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm, SetupOrganizationForm, SocialLoginButton) MUST be updated to use CSS variable styling.
- **FR-014**: All business logic, API routes, database schema, authentication logic, and TypeScript interfaces MUST remain completely unchanged.
- **FR-015**: The TypeScript compiler MUST report zero errors after all UI changes (`npx tsc --noEmit` passes).

### Constraints

- No changes allowed to: `src/lib/`, any `src/app/api/` routes, database schema files, or any file containing business logic, FBR API calls, or Drizzle ORM queries.
- No external icon library may be introduced — all icons must be inline SVG.
- No additional npm packages beyond `next-themes` may be added.

### Key Entities

- **Design Token**: A CSS custom property (e.g., `--bg`, `--primary`, `--error`) defined in both `.light` and `.dark` class contexts that maps a semantic name to a color/shadow value.
- **Theme**: Either "dark" or "light" mode, stored via `next-themes` in localStorage and applied as a class on `<html>`.
- **Component**: A React file in `src/components/` or a page in `src/app/` that renders UI — must use only CSS variable tokens for color styling.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Theme toggle switches the entire interface in under 200ms with no visible layout shift or flash of incorrect theme.
- **SC-002**: Zero hardcoded Tailwind color classes (bg-white, text-gray-*, bg-gray-*, border-gray-*, from-slate-*) remain in any UI component or page file after implementation.
- **SC-003**: TypeScript compilation completes with zero errors (`npx tsc --noEmit` exits with code 0).
- **SC-004**: All 13 listed pages and all 12 listed components render visually correct in both dark and light mode — no invisible text, invisible inputs, or broken layouts.
- **SC-005**: Theme preference persists across page reload — if user selected dark mode, dark mode is still active after browser refresh.
- **SC-006**: All invoice status badges display with correct semantic colors: draft (muted), issued/validated (green), failed (red), submitting/validating (blue) — verified in both modes.
- **SC-007**: No console hydration warnings or errors related to theme mismatches in the browser developer tools.
- **SC-008**: All existing API functionality (invoice creation, FBR submission, buyer lookup, draft management) continues to work correctly after UI changes — no regressions introduced.

---

## Assumptions

- Tailwind CSS v4 is already configured in the project with the `@import "tailwindcss"` syntax.
- `next-themes` v0.x or v1.x is compatible with the current Next.js version in the project.
- DM Sans and DM Mono fonts are loaded from Google Fonts CDN and available in the build.
- The existing auth layout's glass card visual works well without further structural changes — only color token updates are needed.
- The `defaultTheme="dark"` is the desired default, as the design system was built with dark mode as primary.
- `enableSystem` on the ThemeProvider means first-time visitors will match their OS preference; returning visitors keep their stored preference.

---

## Out of Scope

- No new pages or routes are created.
- No UI animations beyond the specified hover lift on MetricCard and fade-up page mount animation.
- No responsive/mobile layout changes beyond what the existing layout supports.
- No accessibility audit or WCAG compliance work.
- No performance optimization (bundle size, code splitting).
- No changes to any file in `src/lib/`, `src/app/api/`, or database schema files.
