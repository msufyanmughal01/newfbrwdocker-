# Feature Specification: FBR Digital Invoicing Platform — Full Compliance Upgrade

**Feature Branch**: `005-fbr-compliance-platform`
**Created**: 2026-02-19
**Status**: Draft
**Input**: User description: Full 7-phase platform upgrade covering master data, business profile, draft workflow isolation, analytics, FBR API integration, UI modernization, and full testing.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Business Owner Configures Profile & Auto-Fills Invoices (Priority: P1)

A business owner signs up, completes their business profile (name, NTN, address, logo, FBR token), and from that point forward every new invoice is automatically pre-filled with their seller information. The seller data remains editable per invoice instance without altering the saved profile.

**Why this priority**: The business profile is the foundational master record — without it, invoice auto-fill, FBR submission, and compliance cannot function.

**Independent Test**: Create a new user account, fill the business profile, open a new invoice, and verify all seller fields are pre-populated correctly.

**Acceptance Scenarios**:

1. **Given** a new user signs up, **When** the signup process completes, **Then** a blank business profile record is automatically created and linked to the user account.
2. **Given** a completed business profile, **When** the user opens New Invoice, **Then** all seller fields are pre-filled from the saved profile.
3. **Given** a pre-filled invoice, **When** the user edits seller data on the invoice, **Then** the business profile record is NOT modified.
4. **Given** the Business Settings page, **When** the user uploads a logo, **Then** the logo is stored and appears on generated invoices.
5. **Given** a business profile with a stored FBR token, **When** FBR submission is triggered, **Then** the stored token is used automatically without prompting the user.

---

### User Story 2 — HS Code & Client Master Data Selection (Priority: P1)

A user selects predefined HS codes from a dropdown and picks a saved client from the client master list to auto-fill buyer information in one click. New clients are saved permanently for future reuse.

**Why this priority**: Master data (HS codes, clients) is the building block for accurate and fast invoice creation. Miscoded HS codes cause FBR rejection.

**Independent Test**: Pre-populate HS codes in the master table, open invoice creation, select an HS code from the dropdown and a saved client from the list, verify all fields populate correctly.

**Acceptance Scenarios**:

1. **Given** predefined HS codes in the master table, **When** the user clicks the HS code field, **Then** a searchable dropdown of all available HS codes is displayed.
2. **Given** a saved client in the client master, **When** the user selects that client, **Then** all buyer fields are populated in one action.
3. **Given** new client details entered in an invoice, **When** the user saves the client, **Then** the client is permanently added to the client master for future invoices.
4. **Given** the HS code dropdown, **When** the user types a search term, **Then** results filter in real time to matching codes and descriptions.

---

### User Story 3 — Draft Workflow: Create, Manage, Convert (Priority: P2)

A user can save an incomplete invoice as a draft, navigate to the dedicated Draft Invoices page (separate from New Invoice), edit or delete drafts, search and filter them, and convert a draft to a final invoice.

**Why this priority**: Draft isolation is a critical UX correctness issue — the existing popup bug causes data leakage and user confusion. The draft workflow must be fully independent.

**Independent Test**: Open New Invoice (confirm no popup appears), partially fill data and save as draft, navigate to Drafts page, verify draft appears with edit/delete/convert options, verify no state leaks back to New Invoice.

**Acceptance Scenarios**:

1. **Given** the New Invoice route, **When** the page loads, **Then** no draft popup or draft-loading dialog appears.
2. **Given** an in-progress invoice, **When** the user saves it as a draft, **Then** the draft is stored and the user can continue creating a new blank invoice.
3. **Given** the Draft Invoices page, **When** it loads, **Then** all saved drafts are listed with date, buyer name, and total.
4. **Given** a draft on the Drafts page, **When** the user clicks Edit, **Then** the draft opens with all previously entered data intact.
5. **Given** a draft, **When** the user clicks Convert to Final Invoice, **Then** the invoice status changes to Active and the draft is removed from the Drafts list.
6. **Given** a draft, **When** the user deletes it, **Then** the draft is permanently removed with no recovery option.
7. **Given** multiple drafts, **When** the user searches by buyer name or invoice number, **Then** only matching drafts are displayed.

---

### User Story 4 — Dashboard with Date-Range Analytics (Priority: P2)

A user views a dashboard with From–To date selectors and sees accurate, dynamically updated metrics: This Month Revenue, Total Invoices, Sales Tax Paid, Revenue Excluding Sales Tax — all displayed as visual metric cards.

**Why this priority**: Financial visibility is core to business decision-making, and incorrect analytics undermine trust in the entire platform.

**Independent Test**: Submit several invoices across different dates, navigate to the dashboard, change the date range, and verify all metric cards update to reflect only invoices within the selected range.

**Acceptance Scenarios**:

1. **Given** the Dashboard page, **When** it loads, **Then** it displays the current month's date range pre-selected with accurate metrics.
2. **Given** a custom date range selection, **When** the user selects From and To dates, **Then** all metric cards recalculate immediately without a page reload.
3. **Given** invoices with sales tax, **When** the dashboard aggregates them, **Then** Sales Tax Paid matches the sum of all invoice tax fields exactly.
4. **Given** no invoices in the selected range, **When** the dashboard aggregates, **Then** all metrics display zero without errors.
5. **Given** the dashboard metrics, **When** compared against database invoice records, **Then** every figure has 0% variance.

---

### User Story 5 — FBR API Submission with IRN Generation (Priority: P3)

A user submits a finalized invoice to FBR. The system validates the invoice data against FBR schema requirements, submits using the stored FBR token, receives an IRN (Invoice Reference Number), stores it, and prevents any further modification to the submitted invoice.

**Why this priority**: FBR submission is the compliance output of the entire system. It must be correct, auditable, and immutable after success.

**Independent Test**: Create a complete valid invoice, trigger FBR submission, verify IRN is returned and stored, verify the invoice becomes read-only, verify audit log shows the full request and response.

**Acceptance Scenarios**:

1. **Given** a completed invoice, **When** FBR submission is triggered, **Then** the system validates all required fields before sending the request.
2. **Given** a valid FBR submission, **When** the API returns success, **Then** the IRN is stored against the invoice and displayed to the user.
3. **Given** a successfully submitted invoice, **When** any user attempts to edit it, **Then** the system rejects the modification and shows an immutability notice.
4. **Given** a network failure during submission, **When** the error is caught, **Then** the system retries automatically and logs each attempt.
5. **Given** an invalid FBR token, **When** submission is attempted, **Then** the user receives a clear error message with guidance to update the token in Business Settings.
6. **Given** a rejected FBR submission, **When** the API returns a rejection code, **Then** the rejection reason is displayed to the user and the invoice is NOT marked as submitted.
7. **Given** any FBR API call (success or failure), **When** it completes, **Then** a complete audit log entry is created with timestamp, invoice reference, and full payload.

---

### User Story 6 — Modern Futuristic UI Across All Pages (Priority: P3)

All pages display a consistent, modern, colorful, card-based UI with proper spacing, typography hierarchy, smooth transitions, and fully responsive layout across desktop and mobile.

**Why this priority**: Production-grade visual consistency is a delivery requirement. UI inconsistencies damage credibility with compliance-focused users.

**Independent Test**: Navigate each page on desktop (1440px) and mobile (375px), verify design consistency, card layout, color palette, and transition smoothness.

**Acceptance Scenarios**:

1. **Given** any page in the application, **When** viewed at 1440px width, **Then** content is in a card-based layout with a consistent color palette and typography hierarchy.
2. **Given** any page, **When** viewed at 375px (mobile), **Then** layout is fully responsive with no horizontal scrolling or overflow.
3. **Given** any navigation action, **When** the route changes, **Then** smooth visual transitions are applied without jarring jumps.
4. **Given** all pages compared side by side, **When** reviewed for design language, **Then** font sizes, colors, spacing, and component styles are consistent across all pages.

---

### Edge Cases

- What happens when a user attempts FBR submission with an incomplete business profile (missing NTN)?
- What happens if FBR API is unreachable — how long does the retry window last and how many retries occur?
- What happens if a user uploads a logo file exceeding the size limit?
- How does the system handle duplicate client names when the client has no NTN?
- What happens to dashboard metrics if an invoice is cancelled after submission (if FBR allows voiding)?
- What happens when the date range From date is set after the To date on the dashboard?
- What happens if a user tries to convert a draft that references a deleted client?

---

## Requirements *(mandatory)*

### Functional Requirements

**Master Data — HS Codes**

- **FR-001**: System MUST maintain an HS Code master table with code and description fields.
- **FR-002**: Invoice line items MUST use a searchable dropdown to select HS codes from the master table only (no free-text entry of HS codes).
- **FR-003**: Authorized users MUST be able to add and edit HS codes in the master table from an admin or settings area.

**Business Profile**

- **FR-004**: System MUST auto-create a blank business profile record upon new user signup, linked to the authenticated user.
- **FR-005**: Business profile MUST store: business name, NTN/registration number, address, logo/image, FBR token, and all required compliance fields.
- **FR-006**: Business profile MUST support logo/image upload with secure storage.
- **FR-007**: FBR token stored in the business profile MUST be protected — never exposed in client-side code or logs.
- **FR-008**: Business profile data MUST auto-fill into the seller section of every new invoice upon creation.
- **FR-009**: Seller fields in an invoice MUST be editable per invoice instance without modifying the saved business profile.

**Client Master**

- **FR-010**: System MUST maintain a Client master table with buyer fields: name, NTN, address, and contact information.
- **FR-011**: Invoice buyer section MUST support one-click selection from the client master to auto-fill all buyer fields.
- **FR-012**: Users MUST be able to save new clients to the client master from within the invoice creation flow.

**Invoice Status System**

- **FR-013**: Every invoice MUST have a status field with values: Draft, Active, Submitted, Finalized.
- **FR-014**: Invoices with status Submitted or Finalized MUST be immutable — no field edits permitted.

**Draft Workflow Isolation**

- **FR-015**: The New Invoice page MUST initialize with a completely blank form — no draft loading, popup, or pre-populated draft state.
- **FR-016**: Users MUST be able to save any in-progress invoice as a Draft from within the invoice form.
- **FR-017**: The Draft Invoices page MUST be a fully independent route (not a modal or popup) that lists all saved drafts.
- **FR-018**: Draft Invoices page MUST support: Edit draft, Delete draft, Convert to Final Invoice (status → Active), Search by buyer name or invoice number, and Filter by date.
- **FR-019**: No state MUST be shared or leaked between the New Invoice route and the Draft Invoices route.

**Dashboard & Analytics**

- **FR-020**: Dashboard MUST display a From–To date range selector with the current calendar month as the default.
- **FR-021**: Dashboard MUST display metric cards for: This Month Revenue, Total Invoices Count, Sales Tax Paid, and Revenue Excluding Sales Tax.
- **FR-022**: All dashboard metrics MUST dynamically recalculate when the selected date range changes.
- **FR-023**: Dashboard metric calculations MUST match the underlying invoice database records with 0% variance.

**FBR API Integration**

- **FR-024**: FBR API endpoints MUST be implemented exactly as defined in the official FBR PDF documentation — no field deviations.
- **FR-025**: System MUST validate all required invoice fields against the FBR schema before attempting submission.
- **FR-026**: System MUST map invoice fields to FBR-specified field names precisely as documented.
- **FR-027**: FBR authentication MUST use the business profile's stored FBR token.
- **FR-028**: System MUST present FBR error responses to the user with clear messages including rejection reason and guidance.
- **FR-029**: System MUST store the IRN returned by FBR against the invoice upon successful submission.
- **FR-030**: System MUST implement automatic retry logic for transient network failures during FBR submission.
- **FR-031**: System MUST log every FBR API request and response as an append-only audit record with: timestamp, invoice reference, request payload, response payload, and outcome.
- **FR-032**: System MUST validate tax calculations against FBR rules before submission.
- **FR-033**: System MUST prevent modification of any invoice field after successful FBR submission.

**UI Requirements**

- **FR-034**: All pages MUST use a consistent modern color palette, card-based layout, and clear typography hierarchy.
- **FR-035**: Application MUST be fully responsive on desktop (minimum 1280px) and mobile (minimum 375px).
- **FR-036**: All page navigation transitions MUST include smooth visual animations.

**Testing Requirements**

- **FR-037**: Application MUST pass functional tests covering: invoice lifecycle, draft workflow, client auto-fill, HS code selection, and business profile auto-fill.
- **FR-038**: FBR API integration MUST be tested for: successful submission, invalid token handling, rejected invoice handling, and network failure retry.
- **FR-039**: Application MUST pass integration tests for: signup → business profile auto-save, invoice → FBR submission, and dashboard aggregation accuracy.
- **FR-040**: Regression tests MUST run after each implementation phase to confirm no existing features are broken.

---

### Key Entities

- **BusinessProfile**: Linked one-to-one with an authenticated user. Stores: business name, NTN, address, logo URL, FBR token (protected), and compliance fields. Acts as the source for invoice seller auto-fill.
- **HSCode**: Master lookup table. Stores: HS code identifier and description. Used exclusively via dropdown selection in invoice line items.
- **Client**: Persistent buyer record. Stores: name, NTN, address, and contact details. Reusable across multiple invoices.
- **Invoice**: Core transactional record. Stores: seller snapshot (copied from business profile at creation time), buyer snapshot (copied from client selection), line items, totals, tax amounts, status (Draft/Active/Submitted/Finalized), IRN, and FBR submission metadata.
- **InvoiceLineItem**: Child of Invoice. Stores: HS code reference, item description, quantity, unit price, applicable tax rate, and calculated line total.
- **FBRAuditLog**: Append-only compliance record. Stores: invoice reference, timestamp, FBR API endpoint called, full request payload, full response payload, retry count, and outcome (success/failure).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Business profile auto-fill populates 100% of seller fields on every new invoice without any manual user input.
- **SC-002**: HS code selection dropdown responds within 300ms for master tables up to 10,000 entries.
- **SC-003**: Client auto-fill populates all buyer fields with a single selection action — no additional steps required.
- **SC-004**: New Invoice page loads with zero draft popups or pre-loaded draft state — confirmed across 100% of test runs.
- **SC-005**: Draft Invoices page supports full create/edit/delete/convert workflow with no cross-route state contamination — verified in isolation testing.
- **SC-006**: Dashboard metrics match database aggregations with 0% variance across all tested date ranges and invoice volumes.
- **SC-007**: FBR API submission succeeds with valid invoice data and returns a stored IRN — verified in FBR test/sandbox environment.
- **SC-008**: All edit attempts on submitted invoices are rejected 100% of the time after successful FBR submission.
- **SC-009**: FBR audit log captures 100% of API interactions with complete request and response payloads.
- **SC-010**: All pages display without layout errors on desktop (1440px) and mobile (375px) — verified across all routes.
- **SC-011**: Full regression test suite passes with zero regressions after each implementation phase completes.
- **SC-012**: Application operates without crashes or compliance errors across all 7 feature areas under normal and boundary conditions.

---

## Constraints

- Draft Invoices page MUST be an independent route — never a modal or popup.
- FBR API implementation MUST strictly follow the official FBR PDF documentation — no field deviations are permitted.
- Seller auto-fill MUST NOT overwrite the saved business profile unless the user explicitly saves from the Business Settings page.
- Dashboard metric calculations MUST match invoice database records exactly.
- Successfully submitted invoices MUST be immutable — no exceptions.
- FBR token MUST be protected at rest and never exposed in client-side code, logs, or API responses.
- Application MUST remain scalable and production-ready throughout all phases.

---

## Assumptions

- FBR API PDF documentation will be provided before Phase 5 implementation begins; all endpoints, schema definitions, and field names will be taken directly from that document without deviation.
- FBR integration will initially target the FBR sandbox/test environment for validation before production deployment.
- User authentication is already implemented (existing feature); business profile links to the authenticated user session.
- "Active" invoice status means created and validated, not yet submitted to FBR. "Submitted" means FBR-submitted with IRN received. "Finalized" means closed/paid.
- Logo/image upload follows standard web practice: maximum 5MB, PNG/JPG/JPEG formats accepted.
- Dashboard date range defaults to the current calendar month on page load.
- Client master deduplication uses NTN as the primary unique key; where NTN is absent, the client name is used.
- Existing invoice creation form (from prior features 002/003/004) will be updated in-place rather than rewritten.

---

## Dependencies

- Existing user authentication system (must be stable and functioning before Phase 1 work begins).
- FBR API PDF documentation (required before Phase 5 FBR integration begins).
- Secure credential storage capability for FBR token protection.
- Existing invoice creation form (002-invoice-creation-form branch — Phase 2 integration point).
- Existing FBR API integration work (003-fbr-api-integration branch — Phase 5 extension point).
- Existing UI/UX work (004-invoice-platform-ux branch — Phase 6 extension point).
