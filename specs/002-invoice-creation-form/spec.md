# Feature Specification: Invoice Creation Form

**Feature Branch**: `002-invoice-creation-form`
**Created**: 2026-02-14
**Status**: Draft
**Input**: User description: "Invoice creation form with dynamic line items, real-time calculations, schema-based validation, and draft saving"

## Clarifications

### Session 2026-02-14

- Q: What is the realistic maximum number of line items that should be supported per invoice? → A: Up to 100 line items per invoice
- Q: Should incomplete invoices automatically save as drafts without user action? → A: Yes, auto-save every 60 seconds
- Q: How long should saved drafts be retained before automatic deletion? → A: Indefinite (never auto-delete)
- Q: Are there any known mandatory FBR fields or data formats that should be included in the initial invoice schema? → A: Yes, FBR Digital Invoicing API v1.12 specification (see dataformat.md)
- Q: Should the initial implementation support both Sale Invoices and Debit Notes, or only Sale Invoices? → A: Both Sale Invoices and Debit Notes from start

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Sale Invoice with Line Items (Priority: P1)

As an invoice creator, I need to create a new sale invoice by entering customer details and adding line items, so that I can bill customers for products or services.

**Why this priority**: This is the core functionality - without the ability to create and submit a basic invoice, the feature delivers no value. This represents the minimum viable product.

**Independent Test**: Can be fully tested by navigating to invoice creation page, entering customer information, adding at least one line item with description/quantity/price, and submitting the invoice. Delivers a complete, valid invoice.

**Acceptance Scenarios**:

1. **Given** I am on the invoice creation page, **When** I enter customer details (name, address, contact), **Then** the form accepts and displays the information
2. **Given** I have entered customer details, **When** I add a line item with description, quantity, and unit price, **Then** the system displays the line item in the invoice
3. **Given** I have added line items, **When** I submit the invoice, **Then** the system creates an invoice record with all entered data
4. **Given** I have entered valid invoice data, **When** I submit the form, **Then** I receive confirmation that the invoice was created successfully

---

### User Story 1b - Create Debit Note (Priority: P1)

As an invoice creator, I need to create a debit note by referencing an existing invoice and adjusting line items, so that I can correct or adjust previously issued invoices.

**Why this priority**: Debit notes are a mandatory FBR requirement for invoice corrections. Without this capability, users cannot properly handle invoice adjustments, making the system incomplete for regulatory compliance.

**Independent Test**: Can be fully tested by selecting "Debit Note" type, providing an existing invoice reference number, entering adjusted line items, and submitting. Delivers a valid debit note record.

**Acceptance Scenarios**:

1. **Given** I am on the invoice creation page, **When** I select "Debit Note" as invoice type, **Then** the form requires an invoice reference number
2. **Given** I am creating a debit note, **When** I enter a valid invoice reference number, **Then** the system accepts the reference
3. **Given** I am creating a debit note, **When** I add line items with adjustments, **Then** the system creates a debit note record linked to the original invoice

---

### User Story 2 - Real-Time Calculation of Totals (Priority: P1)

As an invoice creator, I need to see real-time calculations of subtotals, taxes, and grand totals as I add or modify line items, so that I can verify the invoice amounts before submission.

**Why this priority**: Accurate calculations are critical for financial data. Without this, users cannot trust the invoice amounts, making the feature unusable for real business purposes.

**Independent Test**: Can be tested by adding/modifying line items and observing that subtotal, tax, and grand total update immediately without page refresh. Delivers accurate financial calculations.

**Acceptance Scenarios**:

1. **Given** I have added a line item, **When** I enter quantity and unit price, **Then** the line item total is calculated and displayed instantly
2. **Given** I have multiple line items, **When** I modify any line item, **Then** the subtotal updates to reflect all line items
3. **Given** I have a subtotal, **When** tax rate is applied, **Then** the tax amount is calculated and displayed
4. **Given** I have subtotal and tax, **When** calculations complete, **Then** the grand total (subtotal + tax) is displayed

---

### User Story 3 - Dynamic Line Item Management (Priority: P2)

As an invoice creator, I need to add, remove, and edit multiple line items dynamically, so that I can build invoices with varying numbers of products or services.

**Why this priority**: While basic invoice creation (P1) could work with a single line item, real-world invoices require multiple items. This enhances usability but isn't needed for initial MVP validation.

**Independent Test**: Can be tested by adding multiple line items, removing specific items, and editing existing items. Delivers flexible invoice composition.

**Acceptance Scenarios**:

1. **Given** I am creating an invoice, **When** I click "Add Line Item", **Then** a new empty line item row appears
2. **Given** I have multiple line items, **When** I click "Remove" on a specific line item, **Then** that line item is removed and totals recalculate
3. **Given** I have existing line items, **When** I edit any field in a line item, **Then** the changes are reflected immediately and totals update
4. **Given** I add or remove line items, **When** totals recalculate, **Then** there is no noticeable UI lag or delay

---

### User Story 4 - Form Validation and Error Prevention (Priority: P2)

As an invoice creator, I need the system to validate my input and prevent invalid submissions, so that I don't create invoices with incomplete or incorrect data.

**Why this priority**: Prevents data quality issues and reduces errors, but initial testing can proceed with manual validation. Becomes critical before production use.

**Independent Test**: Can be tested by attempting to submit incomplete or invalid data and verifying that appropriate error messages appear. Delivers data quality assurance.

**Acceptance Scenarios**:

1. **Given** I attempt to submit an invoice, **When** required customer fields are empty, **Then** the system displays validation errors and prevents submission
2. **Given** I am entering line item data, **When** I enter invalid data (negative quantity, non-numeric price), **Then** the system shows inline validation errors
3. **Given** I attempt to submit an invoice, **When** no line items are present, **Then** the system prevents submission and indicates at least one line item is required
4. **Given** validation errors exist, **When** I correct the errors, **Then** the error messages disappear and I can submit the form

---

### User Story 5 - Draft Saving (Priority: P3)

As an invoice creator, I need to save incomplete invoices as drafts, so that I can resume work later without losing my progress if interrupted.

**Why this priority**: Quality-of-life improvement that prevents data loss, but not essential for initial functionality validation. Can be added after core features are stable.

**Independent Test**: Can be tested by partially completing an invoice, saving as draft, navigating away, and returning to resume. Delivers workflow continuity.

**Acceptance Scenarios**:

1. **Given** I am creating an invoice, **When** I work on it for 60 seconds, **Then** the system automatically saves it as a draft
2. **Given** I am creating an invoice, **When** I click "Save Draft" manually, **Then** the current invoice state is saved immediately
3. **Given** I have a saved draft, **When** I navigate away and return later, **Then** I can resume editing from where I left off
4. **Given** I have an incomplete invoice, **When** my session is interrupted, **Then** I can recover my work through the last auto-saved draft
5. **Given** the system is auto-saving, **When** a save completes, **Then** I see a visual indicator of the save status

---

### Edge Cases

- What happens when a user enters extremely large quantities or prices (boundary testing for calculations)?
- How does the system handle rapid consecutive line item additions/removals (race conditions)?
- What happens when a user attempts to submit an invoice with all zero amounts?
- How does the form behave when customer name contains special characters or extremely long text?
- What happens if calculations result in values exceeding maximum safe integer limits?
- How does the system handle concurrent editing if the same invoice draft is opened in multiple tabs?
- What happens when a user attempts to add more than 100 line items?
- How does the system handle a large number of accumulated drafts per user?
- What happens to drafts when an invoice is successfully submitted?
- How does the system validate that a referenced invoice number (for Debit Notes) actually exists?
- Can a Debit Note reference another Debit Note, or only Sale Invoices?

## Requirements *(mandatory)*

### Functional Requirements

#### Invoice Creation

- **FR-001**: System MUST allow users to select invoice type (Sale Invoice or Debit Note)
- **FR-002**: System MUST provide a form for creating new invoices with customer information and line items
- **FR-003**: System MUST allow users to enter customer details including name, address, and contact information
- **FR-004**: System MUST capture seller tax registration details (NTN or CNIC)
- **FR-005**: System MUST capture buyer tax registration details (NTN or CNIC)
- **FR-006**: System MUST capture buyer registration type (Registered or Unregistered)
- **FR-007**: System MUST require invoice reference number when invoice type is Debit Note
- **FR-008**: System MUST accept and validate customer data before allowing invoice submission

#### Line Item Management

- **FR-009**: System MUST allow users to add multiple line items to an invoice
- **FR-010**: System MUST allow users to remove any line item from an invoice
- **FR-011**: System MUST allow users to edit existing line items
- **FR-012**: Each line item MUST capture: product description, HS code, quantity, unit of measurement, unit price, discount (optional)
- **FR-013**: Each line item MUST capture tax-related fields: tax rate, sales tax amount, extra tax (optional), further tax (optional)
- **FR-014**: Each line item MUST support sale type classification (e.g., "Goods at standard rate")
- **FR-015**: System MUST support up to 100 line items per invoice

#### Calculations

- **FR-016**: System MUST automatically calculate line item totals (quantity × unit price - discount)
- **FR-017**: System MUST calculate line item sales tax based on tax rate and taxable value
- **FR-018**: System MUST automatically calculate invoice subtotal (sum of all line item values excluding tax)
- **FR-019**: System MUST calculate total tax amount (sum of sales tax + extra tax + further tax across all items)
- **FR-020**: System MUST calculate grand total (subtotal + total tax)
- **FR-021**: All calculations MUST update in real-time as users modify invoice data
- **FR-022**: Calculations MUST maintain precision appropriate for financial data (minimum 4 decimal places for quantities, 2 for amounts)

#### Validation

- **FR-023**: System MUST validate that required seller fields are completed (NTN/CNIC, business name, province, address)
- **FR-024**: System MUST validate that required buyer fields are completed (NTN/CNIC, business name, province, address, registration type)
- **FR-025**: System MUST validate NTN format (7 digits) and CNIC format (13 digits)
- **FR-026**: System MUST validate that invoice reference number is provided when invoice type is Debit Note
- **FR-027**: System MUST validate invoice reference number format (22 digits for NTN-based, 28 digits for CNIC-based invoices)
- **FR-028**: System MUST validate that at least one line item exists before invoice submission
- **FR-029**: System MUST validate that quantity values are positive numbers (up to 4 decimal places)
- **FR-030**: System MUST validate that price and tax values are non-negative numbers
- **FR-031**: System MUST validate that HS codes conform to expected format
- **FR-032**: System MUST validate that tax rates match available FBR tax rates
- **FR-033**: System MUST provide inline validation feedback for each field
- **FR-034**: System MUST prevent submission of invoices that fail validation

#### Data Persistence

- **FR-035**: System MUST automatically save incomplete invoices as drafts every 60 seconds
- **FR-036**: System MUST allow users to manually save drafts via "Save Draft" action
- **FR-037**: System MUST display visual feedback indicating draft save status (saving/saved)
- **FR-038**: System MUST allow users to resume editing saved drafts
- **FR-039**: System MUST retain drafts indefinitely without automatic deletion
- **FR-040**: System MUST allow users to manually delete their own drafts
- **FR-041**: System MUST persist invoice data in FBR-compatible JSON format (per dataformat.md specification)
- **FR-042**: System MUST preserve invoice type (Sale Invoice or Debit Note) in saved drafts

#### Performance

- **FR-043**: Form MUST load within 1 second on local development environment
- **FR-044**: Calculation updates MUST occur within 100 milliseconds of data entry
- **FR-045**: Adding/removing line items MUST not cause perceivable UI lag

#### Architecture Requirements

- **FR-046**: Form architecture MUST support integration with FBR Digital Invoicing API v1.12
- **FR-047**: Data schema MUST accommodate all mandatory and optional FBR fields per dataformat.md specification
- **FR-048**: System MUST support integration with FBR reference data APIs (Province, HS Code, Tax Rate, UOM)
- **FR-049**: Tax calculation logic MUST be configurable to accommodate FBR tax rule changes

### Key Entities *(include if feature involves data)*

- **Invoice**: Represents a complete billing document. Contains: invoice type (Sale Invoice or Debit Note), invoice date, invoice reference number (for Debit Notes), customer information, line items, calculated totals, and metadata. Relationships: has many LineItems, belongs to one Customer (buyer), issued by one Seller. For Debit Notes: references one original Invoice.

- **LineItem**: Represents a single product or service being billed. Contains: HS code, product description, quantity (4 decimals), unit of measurement, unit price, discount, tax rate, sales tax amount, extra tax, further tax, sale type, and calculated total. Relationships: belongs to one Invoice.

- **Customer**: Represents the entity being billed (buyer). Contains: business name, NTN or CNIC (tax registration), province, address, registration type (Registered/Unregistered), and optional contact information (email, phone). Relationships: can have many Invoices.

- **Seller**: Represents the entity issuing the invoice. Contains: business name, NTN or CNIC (tax registration), province, and address. Relationships: issues many Invoices.

- **TaxConfiguration**: Represents tax calculation rules including tax rate and applicability logic. Used by Invoice to calculate tax amounts. (Extensible for future multi-jurisdiction support)

- **InvoiceDraft**: Represents a saved incomplete invoice that can be resumed later. Contains the same data structure as Invoice but with different persistence status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Invoice form loads within 1 second on local development environment (measured via browser performance tools)

- **SC-002**: Line item calculations update within 100 milliseconds of user input (measured via browser performance monitoring)

- **SC-003**: Users can add and remove line items without perceivable UI lag (measured via interaction response time)

- **SC-004**: System prevents all invalid invoice submissions through validation (measured via test cases attempting invalid submissions)

- **SC-005**: Invoice data consistently follows defined schema structure (measured via schema validation tests on all generated payloads)

- **SC-006**: Form architecture supports backend and FBR integration without requiring refactoring of core components (validated via architecture review against integration requirements)

- **SC-007**: Users can successfully create and submit a valid invoice with multiple line items in under 2 minutes (measured via user testing of complete workflow)

- **SC-008**: 100% of invoice calculations are mathematically accurate to 2 decimal places (measured via automated calculation testing with known values)

## Assumptions

1. **Tax Calculation**: Initially supporting single tax rate applied to entire invoice; multi-rate tax logic (per-item or jurisdiction-based) will be added in future iterations

2. **Currency**: All amounts are in a single currency (likely PKR - Pakistani Rupee for FBR context); multi-currency support is out of scope

3. **Authentication**: Users accessing the invoice creation form are already authenticated through existing auth system

4. **Numbering**: Invoice numbering/ID generation will be handled by backend system in future integration; form focuses on data collection only

5. **Payment Terms**: Initial version captures core billing data; payment terms, due dates, and discount logic are deferred to future iterations

6. **Data Storage**: Draft saving uses browser storage initially; migration to server-side persistence will occur during backend integration

7. **Responsive Design**: Primary focus on desktop and tablet screens; mobile optimization may require additional iteration

8. **Offline Capability**: Initial version requires online connectivity; offline-first sync will be implemented in future phase

## Constraints

1. **Technology Stack**: Implementation must align with existing Next.js App Router architecture with TypeScript

2. **Component Modularity**: All components must be reusable and maintainable for future feature extensions

3. **No Hardcoded Business Logic**: Tax rates, validation rules, and calculation logic must be configurable

4. **State Management**: Must use standard React state management (hooks); no heavy state management libraries initially

5. **Backend Decoupling**: Form logic must not be tightly coupled to backend implementation details

6. **FBR Compatibility**: Architecture must anticipate future FBR integration requirements (specific data formats, validation rules, syncing mechanisms)

7. **Performance Budget**: Must meet specified performance criteria (1s load, <100ms calculations) on standard development hardware

8. **Accessibility**: Form must be keyboard navigable and screen-reader compatible (following WCAG guidelines)

## Out of Scope

- Backend API implementation for invoice persistence
- Invoice editing functionality (edit existing invoices)
- Invoice deletion or archival
- Bulk invoice creation
- Invoice templates or presets
- PDF generation or printing
- Email delivery of invoices
- Payment processing integration
- Multi-currency support
- Advanced discount calculations
- Invoice approval workflows
- Audit trail or version history

## Dependencies

- Existing authentication system (users must be logged in to create invoices)
- Dashboard layout and navigation structure (invoice creation page integrates into existing dashboard)
- Future backend API specification (form data structure must align with API contracts)
- FBR Digital Invoicing API v1.12 specification (dataformat.md) for payload structure and field requirements
- FBR reference data APIs: Province Code API, Item Code API (HS codes), Rate ID API, UOM API, SRO Schedule API

## Risks and Mitigations

1. **Risk**: Real-time calculations may cause performance issues with many line items
   - **Mitigation**: Implement debouncing for calculation triggers; test with high line item counts (50+)

2. **Risk**: Draft saving in browser storage may be lost if user clears cache
   - **Mitigation**: Clearly communicate storage limitations to users; prioritize server-side persistence in early iteration

3. **Risk**: Form architecture may not align with future FBR requirements
   - **Mitigation**: Review FBR documentation early; build extensible schema with additional fields capability

4. **Risk**: Complex validation logic may become difficult to maintain
   - **Mitigation**: Use schema-based validation with centralized rule definitions; comprehensive test coverage
