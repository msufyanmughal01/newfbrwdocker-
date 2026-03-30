# Feature Specification: Smart Invoice Platform UX Enhancement

**Feature Branch**: `004-invoice-platform-ux`
**Created**: 2026-02-17
**Status**: Draft

---

## Overview

This feature transforms the FBR Digital Invoicing Portal from a manual-entry workflow into a structured, profile-driven platform. Users should be able to create compliant FBR invoices with minimal repetitive input by drawing on saved business profiles, client records, and pre-configured master data. A dedicated analytics dashboard and a modernised design system complete the upgrade.

**Builds on**: 002-invoice-creation-form, 003-fbr-api-integration (existing invoice form and FBR submission pipeline are already in place).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Business Profile Setup & Auto-Fill (Priority: P1)

A business owner sets up their company profile once (business name, NTN, address, province, logo, FBR token). From that point forward, every new invoice automatically pre-loads the seller section from the stored profile. The owner can still edit seller fields on a per-invoice basis without overwriting the master profile.

**Why this priority**: Without the business profile, every invoice requires full manual re-entry of seller information. This is the highest-friction bottleneck in the current workflow and a prerequisite for the auto-fill story.

**Independent Test**: Navigate to Settings → Business Profile, fill all fields, save. Create a new invoice — verify seller fields are pre-populated with saved values. Edit one seller field on the invoice and submit — confirm the master profile is unchanged in Settings.

**Acceptance Scenarios**:

1. **Given** a new user has just signed up, **When** they visit Settings for the first time, **Then** a Business Profile form is presented with empty fields ready to fill.
2. **Given** a saved business profile exists, **When** the user opens the New Invoice form, **Then** all seller fields (name, NTN, province, address) are automatically populated from the profile.
3. **Given** seller fields are pre-populated on the invoice form, **When** the user edits a field and submits the invoice, **Then** the master profile remains unchanged.
4. **Given** a user updates their business profile in Settings, **When** they next create an invoice, **Then** the updated values appear.
5. **Given** a new account is created at signup, **When** the user first accesses the system, **Then** a blank business profile record has already been created for their account.

---

### User Story 2 — Client Registry & One-Click Buyer Auto-Fill (Priority: P1)

Users save their regular clients (business name, NTN/CNIC, province, address, registration type) in a Client Registry. When creating an invoice, they can search and select a client from the registry, which instantly fills all buyer fields. New clients can be added directly from the invoice form or from a dedicated Clients page.

**Why this priority**: Client selection eliminates the single largest source of repeated typing (buyer details) and reduces the risk of inconsistency in NTN numbers across invoices issued to the same buyer.

**Independent Test**: Add a client named "Test Enterprises" with NTN "1234567" via the Clients page. Open a new invoice, search "Test" in the buyer field, select the client — verify all buyer fields populate correctly and match the saved record.

**Acceptance Scenarios**:

1. **Given** a client exists in the registry, **When** the user types 2+ characters in the buyer search field, **Then** matching client names appear in a dropdown within 1 second.
2. **Given** a matching client appears, **When** the user selects it, **Then** business name, NTN/CNIC, province, address, and registration type are all populated instantly.
3. **Given** a buyer is not in the registry, **When** the user fills buyer fields manually and submits successfully, **Then** the buyer is offered to be saved to the Client Registry.
4. **Given** the Clients page, **When** the user adds a new client, **Then** it becomes immediately available for selection in any new invoice.
5. **Given** a client record is edited in the registry, **When** the user creates a new invoice and selects that client, **Then** the updated details populate the invoice.

---

### User Story 3 — Draft Invoice Workflow Separation (Priority: P2)

Draft invoices are kept in a clearly separate view from submitted and issued invoices. The Drafts page lists only in-progress invoices, while the Invoices page shows only submitted and issued ones. Users can resume, edit, and delete drafts from the dedicated Drafts view.

**Why this priority**: Mixing draft and finalised invoices causes confusion and increases the risk of accidentally submitting unfinished work. Separation is essential for operational clarity once invoice volumes grow.

**Independent Test**: Create an invoice and save as draft without submitting. Navigate to the Drafts page — confirm the draft appears there. Navigate to the Invoices (submitted) page — confirm the draft does not appear. Resume the draft, complete and submit it — confirm it moves to the Invoices page and disappears from Drafts.

**Acceptance Scenarios**:

1. **Given** an invoice is saved as a draft, **When** the user views the Drafts page, **Then** the draft appears with last-saved timestamp and a "Resume" action.
2. **Given** a draft invoice, **When** the user resumes it, **Then** all previously entered fields are restored exactly.
3. **Given** a draft, **When** the user deletes it, **Then** it is permanently removed and no longer appears in any invoice list.
4. **Given** the Invoices (submitted/issued) list, **When** it loads, **Then** no draft invoices appear in the list.
5. **Given** a submitted invoice, **When** viewed, **Then** no "Edit" or save-as-draft option is available (immutability maintained).

---

### User Story 4 — Analytics Dashboard with Date Filtering (Priority: P2)

The dashboard displays key revenue and tax metrics for any custom date range the user selects. Metrics include: This Month Revenue, Total Invoices, Sales Tax Paid, and Revenue Excluding Sales Tax. A trend chart provides a visual overview of invoice activity over the selected period.

**Why this priority**: Without date-filtered analytics, users have no visibility into their financial performance, which is a core expectation for any invoicing product.

**Independent Test**: Issue 3 invoices on different dates. Open the dashboard. Set date range to include 2 of those invoices. Verify totals reflect only the 2 invoices in range. Change range to include all 3. Verify totals update to match.

**Acceptance Scenarios**:

1. **Given** the dashboard, **When** the user sets a custom date range, **Then** all metric cards and charts update to show data only within that range.
2. **Given** issued invoices in the selected date range, **When** the dashboard loads, **Then** "This Month Revenue", "Total Invoices", "Sales Tax Paid", and "Revenue Excluding Sales Tax" are all shown.
3. **Given** no invoices in the selected date range, **When** the dashboard loads, **Then** all metrics show zero and the chart shows an empty state with a descriptive message.
4. **Given** the dashboard, **When** the user changes the date range, **Then** the metrics and chart update without a full page reload.
5. **Given** dashboard metrics, **When** verified against individual invoice records, **Then** the totals match the sum of the corresponding invoices.

---

### User Story 5 — Modern Futuristic UI Design System (Priority: P3)

The entire portal adopts a unified modern design: consistent spacing and typography, glassmorphism card layouts, smooth transitions, and fully responsive layouts for desktop and tablet. The design system is applied consistently across all modules (dashboard, invoice form, settings, clients, drafts).

**Why this priority**: Design consistency improves usability and perception of professionalism. It is delivered last as it builds on stable functionality in the other stories.

**Independent Test**: Load each major page (dashboard, new invoice, invoices list, drafts, settings, clients) on both a 1440px desktop and a 768px tablet viewport. Verify all pages use the same card style, spacing scale, and typography. Verify no horizontal scroll on tablet.

**Acceptance Scenarios**:

1. **Given** any page in the portal, **When** viewed, **Then** cards, buttons, and typography follow the same visual style as every other page.
2. **Given** a 768px viewport, **When** any page loads, **Then** all content is accessible without horizontal scrolling and touch targets are at least 44px.
3. **Given** a page transition or state change, **When** triggered, **Then** a smooth visual transition (fade or slide) occurs without layout jumps.
4. **Given** any form or list with more than 10 rows, **When** rendering, **Then** the page remains responsive with no visible lag.

---

### Edge Cases

- What happens if the business profile is incomplete when the user opens a new invoice? → Seller fields pre-fill only available fields; empty fields are editable and highlighted.
- What if a client's NTN in the registry no longer matches FBR records? → Invoice can still be created; NTN Verifier badge will show the current FBR status.
- What if a user's saved draft references a client that was deleted? → Draft loads with buyer fields intact as saved; client registry link is severed silently.
- What if the date range on the dashboard spans more than 12 months? → Metrics and chart still render correctly; chart aggregates by month instead of day.
- What if two users on the same account modify the business profile simultaneously? → Last-write-wins; the saved state is always the most recently submitted values.
- What if a user's FBR token stored in the profile expires? → Token field in Settings shows an "Expired / Unverified" warning; invoices can still be saved as drafts but FBR submission will fail until updated.

---

## Requirements *(mandatory)*

### Functional Requirements

**Business Profile**

- **FR-001**: System MUST provide a Business Profile settings page where authenticated users can enter and save: business name, NTN/CNIC, province, address, and a logo/image.
- **FR-002**: System MUST store the FBR API token as part of the business profile in a protected manner (not visible in plain text after saving).
- **FR-003**: System MUST automatically create a blank business profile record when a new user account is created.
- **FR-004**: System MUST pre-populate the seller section of every new invoice form with values from the saved business profile.
- **FR-005**: System MUST allow per-invoice editing of pre-filled seller fields without modifying the master business profile.

**Client Registry**

- **FR-006**: System MUST provide a Clients page where users can create, view, edit, and delete client records (business name, NTN/CNIC, province, address, registration type).
- **FR-007**: System MUST allow buyers to be selected from the Client Registry during invoice creation via a searchable dropdown (minimum 2 characters to trigger search).
- **FR-008**: System MUST auto-populate all buyer fields on invoice selection of a registered client.
- **FR-009**: System MUST offer to save a manually entered buyer to the Client Registry after a successful FBR invoice submission.

**Draft Workflow**

- **FR-010**: System MUST provide a dedicated Drafts page showing only invoices with draft status.
- **FR-011**: System MUST exclude draft invoices from the Invoices (submitted/issued) list.
- **FR-012**: System MUST allow users to resume, edit, and delete draft invoices from the Drafts page.
- **FR-013**: System MUST ensure that once an invoice is submitted (issued), it cannot be moved back to draft status.

**Analytics Dashboard**

- **FR-014**: Dashboard MUST provide a date range selector (start date and end date).
- **FR-015**: Dashboard MUST display the following metrics filtered by the selected date range: Total Invoices, Total Revenue (excluding sales tax), Total Sales Tax, Net Revenue (excluding sales tax).
- **FR-016**: Dashboard MUST display a trend chart showing invoice activity over the selected date range.
- **FR-017**: Dashboard metrics MUST update whenever the date range selection changes.
- **FR-018**: Dashboard metric values MUST match the aggregate of corresponding issued invoices in the system.

**Design System**

- **FR-019**: All portal pages MUST use a consistent visual design: shared card style, spacing scale, and typography.
- **FR-020**: All pages MUST be fully usable on viewports from 768px width upward without horizontal scrolling.
- **FR-021**: All interactive elements (buttons, links, dropdowns) MUST have a minimum touch target size of 44×44 pixels.

### Key Entities

- **BusinessProfile**: Linked 1:1 to a user account. Fields: business name, NTN/CNIC, province, address, logo image reference, FBR token (protected), created/updated timestamps.
- **Client**: Linked to a user account (many per user). Fields: business name, NTN/CNIC, province, address, registration type (Registered/Unregistered), created/updated timestamps.
- **DraftInvoice**: An invoice with status `draft`. Editable, resumable, deletable. Never appears in issued invoice lists.
- **IssuedInvoice**: An invoice with status `issued`. Immutable after FBR submission. Appears in issued invoice list and analytics.
- **DashboardMetric**: A computed aggregate (not stored). Derived on demand from issued invoices filtered by date range.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Business profile auto-fills seller fields in 100% of new invoice forms where a profile has been saved.
- **SC-002**: Client selection auto-populates all buyer fields instantly (within 500ms of selection).
- **SC-003**: HS codes are selectable within 1 click from the dropdown during invoice creation (no free-text required).
- **SC-004**: Draft invoices are completely isolated — zero draft invoices appear in the submitted/issued invoice list.
- **SC-005**: Dashboard metrics update within 2 seconds of a date range change.
- **SC-006**: Revenue and sales tax totals shown on the dashboard match the sum of individual issued invoice values with 100% accuracy.
- **SC-007**: Signup automatically creates a business profile record — verified by checking the profile page immediately after new account creation.
- **SC-008**: All portal pages pass a visual consistency check with no deviations in card style, typography, or spacing across modules.
- **SC-009**: Invoice creation time (form fill to FBR submission) is reduced by at least 50% compared to full manual entry, as measured by average task completion time with auto-fill active.
- **SC-010**: All pages render correctly on 768px viewport width with no horizontal scroll.

---

## Assumptions

- The existing FBR submission pipeline (validate → post → issue) remains unchanged; this feature only adds profile, client, draft UI, and analytics layers on top.
- The FBR token stored in the business profile supersedes the current `.env` variable approach for multi-user deployments.
- "Logo/image" upload assumes a file upload capability will be added; images are stored as references (e.g., file path or URL), not raw binary in the database.
- The analytics dashboard aggregates only issued invoices (not drafts or failed submissions).
- "Draft" and "issued" statuses already exist in the invoice schema from 003-fbr-api-integration; this feature adds UI separation, not new statuses.
- Client Registry is separate from the buyer_registry (which is auto-populated from FBR submissions). Clients are explicitly saved by the user; buyer_registry is auto-saved post-submission.

---

## Out of Scope

- Multi-user / team access (multiple users sharing one business profile) — single-user per account only.
- Invoice PDF generation or email delivery — print-to-PDF via browser print dialog remains the delivery method.
- Product/service catalogue management — HS codes come from FBR reference data, not a user-defined product list.
- Automated FBR token renewal or management — user must manually update the token in Settings when it expires.
