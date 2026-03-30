# Feature Specification: FBR API Integration & End-to-End Invoice Submission

**Feature Branch**: `003-fbr-api-integration`
**Created**: 2026-02-17
**Status**: Draft
**Input**: Full FBR Digital Invoicing API v1.12 specification (PRAL, July 2025) + user requirements

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Submit Invoice to FBR and Receive Invoice Number (Priority: P1)

As an invoice creator, I need to submit a completed invoice to FBR and receive an official FBR invoice number, so that the invoice is legally recognized and compliant with digital invoicing regulations.

**Why this priority**: This is the core regulatory requirement. Without FBR submission, the entire invoicing system has no legal standing. Every other module exists to support this outcome.

**Independent Test**: Can be fully tested by creating a valid sale invoice, clicking Submit, and receiving a FBR-issued invoice number (22 or 28 digits) displayed on screen. Delivers a legally compliant invoice record.

**Acceptance Scenarios**:

1. **Given** I have a complete, valid invoice with all required FBR fields, **When** I click "Submit Invoice", **Then** the system first calls the FBR Validate API and shows "Validating with FBR..." status
2. **Given** FBR validation passes (statusCode "00"), **When** validation completes, **Then** the system calls the FBR Post API and shows "Submitting to FBR..." status
3. **Given** FBR Post API succeeds, **When** the invoice is accepted, **Then** the system displays the FBR-issued invoice number (e.g., "7000007DI1747119701593") prominently on screen
4. **Given** the invoice is submitted successfully, **When** the process completes, **Then** the invoice status changes to "Issued" and the FBR invoice number is stored permanently in the database
5. **Given** the FBR Post API returns an error, **When** submission fails, **Then** the system displays the specific FBR error message and allows the user to correct and resubmit

---

### User Story 2 — Print Invoice with QR Code and FBR Logo (Priority: P1)

As an invoice creator, I need to print the submitted invoice with the mandatory FBR QR code and logo, so that the printed document is FBR-compliant and verifiable by buyers.

**Why this priority**: FBR mandates that every issued invoice must have a QR code and the FBR Digital Invoicing logo printed on it. This is a hard regulatory requirement, not optional.

**Independent Test**: Can be fully tested by opening a submitted invoice (with FBR invoice number), clicking "Print Invoice", and verifying the printout shows the QR code (1.0 × 1.0 inch), FBR logo, and all invoice details. Delivers a compliant printed document.

**Acceptance Scenarios**:

1. **Given** an invoice has been issued (has FBR invoice number), **When** I click "Print Invoice", **Then** a print-optimized layout opens with the FBR logo and QR code visible
2. **Given** the print layout is open, **When** I examine the QR code, **Then** it is version 2.0 (25×25 modules), exactly 1.0 × 1.0 inch in printed size
3. **Given** the print layout is open, **When** I examine the content, **Then** it includes: seller/buyer details, all line items with amounts, subtotal, taxes, grand total, FBR invoice number, and invoice date
4. **Given** I click "Print", **When** the browser print dialog opens, **Then** the layout renders correctly without UI chrome (buttons, navigation) appearing on the printed page

---

### User Story 3 — Search HS Codes and Auto-Populate UOM (Priority: P2)

As an invoice creator, I need to search for HS (Harmonized System) codes while creating a line item and have the unit of measurement auto-populated, so that I enter correct product codes without memorizing them.

**Why this priority**: HS codes are mandatory FBR fields and incorrect codes cause submission rejection. Auto-population from live FBR data reduces errors significantly. Second priority because the form works with static data but live search improves accuracy.

**Independent Test**: Can be fully tested by typing a partial HS code or product name in the HS Code field on a line item, selecting a result from the dropdown, and verifying the UOM field is automatically filled. Delivers accurate FBR-compliant product classification.

**Acceptance Scenarios**:

1. **Given** I am on the line item form, **When** I type at least 3 characters in the HS Code field, **Then** a dropdown shows matching HS codes and descriptions from FBR data
2. **Given** the HS code dropdown is showing results, **When** I select a code, **Then** the HS Code field is filled and the UOM field is automatically set to the FBR-approved unit for that code
3. **Given** I search for an HS code, **When** results are loading, **Then** a loading indicator is shown in the dropdown
4. **Given** no HS code matches my search, **When** the search completes, **Then** the dropdown shows "No matching HS codes found"

---

### User Story 4 — Verify Buyer NTN Status via STATL (Priority: P2)

As an invoice creator, I need to verify whether a buyer's NTN is active and registered in the FBR system before submitting, so that I avoid invoice rejection due to invalid buyer details.

**Why this priority**: FBR error code 0002 (Invalid Buyer Registration) is one of the most common rejection reasons. Real-time verification prevents wasted submissions and catches invalid NTNs before they reach FBR.

**Independent Test**: Can be fully tested by entering a buyer NTN and clicking "Verify NTN", seeing the real-time status (Active/Inactive/Registered/Unregistered) displayed next to the field. Delivers confidence in buyer data before submission.

**Acceptance Scenarios**:

1. **Given** I have entered a buyer NTN/CNIC, **When** I leave the NTN field (blur event), **Then** the system calls the FBR STATL API and shows "Verifying..." status
2. **Given** STATL returns active status, **When** verification completes, **Then** a green checkmark and "Active" label appears next to the NTN field
3. **Given** STATL returns inactive status, **When** verification completes, **Then** a warning icon and "Inactive NTN — Verify before submitting" message appears
4. **Given** Get_Reg_Type returns registration type, **When** verification completes, **Then** the Buyer Registration Type field is auto-set to "Registered" or "Unregistered"
5. **Given** the STATL API is unavailable, **When** verification times out, **Then** a non-blocking warning "Could not verify NTN — proceeding manually" is shown

---

### User Story 5 — View and Reuse Frequent Buyers and Sellers (Priority: P3)

As an invoice creator, I need to select from a registry of previously used buyers and sellers when creating an invoice, so that I don't re-enter the same customer details every time.

**Why this priority**: Quality-of-life improvement that speeds up invoice creation for repeat customers. Not required for regulatory compliance but significantly reduces errors and creation time.

**Independent Test**: Can be fully tested by typing in the Buyer Business Name field and seeing autocomplete suggestions from previously saved buyers, then selecting one to auto-fill all buyer fields. Delivers faster invoice creation.

**Acceptance Scenarios**:

1. **Given** I start typing in the Buyer Business Name field, **When** I have typed 2+ characters, **Then** an autocomplete dropdown shows matching buyers from the registry
2. **Given** the buyer dropdown is visible, **When** I select a buyer, **Then** all buyer fields (NTN/CNIC, business name, province, address, registration type) are auto-filled
3. **Given** I complete and submit an invoice successfully, **When** the invoice is issued, **Then** the buyer details are saved/updated in the registry for future use
4. **Given** I want to use seller defaults, **When** I open a new invoice, **Then** the seller fields are pre-filled with the organization's registered seller details

---

### User Story 6 — View FBR Validation Errors with Clear Guidance (Priority: P2)

As an invoice creator, I need to see clear, actionable error messages when FBR rejects a validation request, so that I can quickly identify and fix the specific issue without guessing what went wrong.

**Why this priority**: FBR has 100+ error codes. Without mapping these to human-readable messages, users cannot self-serve error resolution, requiring support intervention for every rejection.

**Independent Test**: Can be fully tested by submitting an invoice that is missing required fields (e.g., no HS code), seeing the FBR error code displayed with the specific field highlighted and a plain-English explanation. Delivers self-service error resolution.

**Acceptance Scenarios**:

1. **Given** FBR validation returns errors, **When** the response arrives, **Then** each error is displayed with: the affected field/item, the FBR error code, and a plain-English explanation
2. **Given** an error applies to a specific line item (e.g., error code 0044 "Provide HS Code"), **When** the error is shown, **Then** the corresponding line item row is highlighted in red
3. **Given** an error applies to the invoice header (e.g., error code 0003 "Provide invoice type"), **When** the error is shown, **Then** the corresponding header field is highlighted in red
4. **Given** all errors are displayed, **When** I correct a field, **Then** the error indicator for that field clears

---

### Edge Cases

- What happens if FBR Validate API times out (>30 seconds)? → Show timeout error, allow retry
- What happens if FBR Post API succeeds but response parsing fails? → Store raw response, show success, log parsing error
- What if FBR returns a valid response with mixed item statuses (some valid, some invalid)? → Show per-item status, allow user to correct invalid items and resubmit
- What if the same invoice is submitted twice? → FBR returns error; system detects duplicate and shows "Already submitted" message
- What if STATL API is down? → Non-blocking warning, allow manual entry
- What if an HS code search returns 1000+ results? → Limit display to top 20, show "Type more to narrow results"
- What if the QR code data exceeds version 2.0 capacity? → Log warning, use version 3 as fallback while maintaining 1.0×1.0 inch size
- What if the FBR Bearer token expires? → Return 401, show "FBR session expired — contact administrator" message
- What if a buyer is unregistered but has a CNIC? → Allow CNIC entry, skip STATL active check (STATL is for registered NTN only)

---

## Requirements *(mandatory)*

### Functional Requirements

#### FBR API Integration

- **FR-001**: System MUST authenticate every FBR API call with a Bearer token from environment variable `FBR_API_TOKEN`
- **FR-002**: System MUST support both Sandbox (`_sb` suffix URLs) and Production FBR endpoints, switchable via environment variable `FBR_ENV` (values: `sandbox` | `production`)
- **FR-003**: System MUST call the FBR Validate API (`validateinvoicedata`) before calling the Post API
- **FR-004**: System MUST only call the FBR Post API (`postinvoicedata`) if validation returns statusCode "00" (Valid)
- **FR-005**: System MUST store the FBR-issued invoice number returned by the Post API in the database
- **FR-006**: System MUST handle FBR HTTP status codes: 200 (OK), 401 (Unauthorized), 500 (Internal Server Error)
- **FR-007**: System MUST include `scenarioId` field when calling Sandbox APIs

#### Invoice Status Lifecycle

- **FR-008**: Invoice status MUST follow this lifecycle: `draft` → `validating` → `validated` → `submitting` → `issued` | `failed`
- **FR-009**: System MUST display the current invoice status visually during the submission process
- **FR-010**: System MUST store the FBR invoice number when status becomes `issued`
- **FR-011**: System MUST store FBR error details when status becomes `failed`

#### Reference Data APIs

- **FR-012**: System MUST fetch Provinces from FBR API and cache results in the database
- **FR-013**: System MUST fetch HS Codes from FBR API and cache results in the database
- **FR-014**: System MUST fetch UOMs from FBR API and cache results in the database
- **FR-015**: System MUST fetch Tax Rates from FBR SaleTypeToRate API (parameterized by date, transaction type, province) and cache results
- **FR-016**: System MUST fetch SRO Schedule data from FBR API and cache results
- **FR-017**: System MUST fetch Transaction Types from FBR API and cache results
- **FR-018**: System MUST fetch Document Types from FBR API and cache results
- **FR-019**: Cached reference data MUST have a configurable TTL (default: 24 hours for HS codes, 1 hour for tax rates)
- **FR-020**: System MUST fall back to static reference data if FBR reference APIs are unavailable

#### HS Code Mapping

- **FR-021**: System MUST provide a searchable HS code input that searches by code or description (minimum 3 characters to trigger search)
- **FR-022**: System MUST display HS code search results showing both code and description
- **FR-023**: System MUST auto-populate the UOM field when an HS code is selected (using FBR HS_UOM API)
- **FR-024**: HS code search results MUST be limited to 20 entries per search

#### Buyer/Seller Registry

- **FR-025**: System MUST store buyer details after every successful invoice submission
- **FR-026**: System MUST provide buyer autocomplete in the invoice form using the registry
- **FR-027**: System MUST pre-fill seller fields from the organization's registered profile
- **FR-028**: System MUST call the FBR STATL API to verify buyer NTN/CNIC status when the field loses focus
- **FR-029**: System MUST call the FBR Get_Reg_Type API to auto-detect buyer registration type (Registered/Unregistered)
- **FR-030**: Buyer registry entries MUST be scoped to the user's organization (multi-tenant)

#### Validation Engine

- **FR-031**: System MUST map all FBR Sales error codes (0001–0402) to user-friendly messages
- **FR-032**: System MUST map all FBR Purchase error codes (0156–0177) to user-friendly messages
- **FR-033**: System MUST display per-item validation errors linked to the specific line item row
- **FR-034**: System MUST display header-level validation errors linked to the specific form field
- **FR-035**: System MUST allow users to correct errors and resubmit without re-entering all data

#### Tax Calculation Engine Enhancement

- **FR-036**: System MUST support scenario-based tax rules for all 28 FBR scenarios (SN001–SN028)
- **FR-037**: Scenario SN008 (3rd Schedule Goods): Tax calculated at fixed rates per unit, not percentage
- **FR-038**: Scenario SN017/SN018 (FED in ST Mode): FED charged as part of sales tax calculation
- **FR-039**: Scenario SN012 (Petroleum): Petroleum Levy rates applied per unit
- **FR-040**: System MUST validate that calculated tax matches FBR's expected calculation before submission

#### QR Code and Printing

- **FR-041**: System MUST generate a QR code for every issued invoice (FBR invoice number encoded)
- **FR-042**: QR code MUST be version 2.0, 25×25 modules, rendered at exactly 1.0 × 1.0 inch when printed
- **FR-043**: System MUST display the FBR Digital Invoicing System logo alongside the QR code on printed invoices
- **FR-044**: Print layout MUST include: seller info, buyer info, all line items, totals, FBR invoice number, QR code, FBR logo
- **FR-045**: Print layout MUST suppress navigation, buttons, and UI chrome when printed (print media query)

### Non-Functional Requirements

- **NFR-001**: FBR API calls MUST complete within 30 seconds; if not, show a timeout error
- **NFR-002**: FBR Bearer token MUST never be exposed in client-side code or browser network requests (all FBR calls through server-side routes)
- **NFR-003**: STATL NTN verification MUST complete within 5 seconds or show non-blocking timeout
- **NFR-004**: HS code search results MUST appear within 500 milliseconds of query execution
- **NFR-005**: Reference data cache MUST be populated on application startup (or first request) without blocking the UI

### Key Entities

- **FBRSubmission**: Tracks each attempt to submit to FBR. Contains: invoiceId, validationResponse, postResponse, fbrInvoiceNumber, status (validating/validated/submitting/issued/failed), errorCodes, attemptedAt, issuedAt. Relationships: belongs to one Invoice.

- **FBRReferenceCache**: Stores cached FBR reference data. Contains: dataType (province/hscode/uom/taxrate/sro/transtype/doctype), data (JSONB), fetchedAt, expiresAt. Supports all 12 reference API types.

- **BuyerRegistry**: Stores frequent buyers per organization. Contains: organizationId, ntnCnic, businessName, province, address, registrationType, statlStatus, statlCheckedAt, lastUsedAt, useCount. Relationships: belongs to one Organization.

- **SellerProfile**: The organization's own seller details (from existing org profile). Used to pre-fill seller fields. Relationships: one per Organization (extends existing profile).

---

## Success Criteria *(mandatory)*

- **SC-001**: An invoice submitted to FBR receives an official FBR invoice number and the number is displayed within 60 seconds of clicking "Submit Invoice"

- **SC-002**: 100% of FBR error codes (0001–0402) display a plain-English explanation rather than a raw numeric code

- **SC-003**: HS code search returns matching results within 1 second for any 3+ character query

- **SC-004**: Buyer NTN verification result (active/inactive/registration type) is displayed within 5 seconds of entering an NTN

- **SC-005**: Printed invoices display a scannable QR code and FBR logo that meet FBR's mandatory print specifications

- **SC-006**: Invoice submission failure rate due to preventable field errors drops to zero after pre-validation catches all format issues before calling FBR

- **SC-007**: A repeat buyer's invoice can be created 70% faster using the buyer registry autocomplete compared to manual entry

- **SC-008**: All FBR reference data (provinces, HS codes, UOMs, tax rates) is available within 2 seconds of the form loading

---

## Assumptions

1. **FBR Bearer Token**: The token (`FBR_API_TOKEN`) will be provided via environment variables. Implementation will not include the token management UI (out of scope).

2. **Sandbox First**: Initial implementation targets FBR Sandbox environment. The same code works for Production by changing the `FBR_ENV` environment variable.

3. **Server-Side Only**: All FBR API calls are made from Next.js API routes (server-side). The Bearer token is never sent to the browser.

4. **QR Code Content**: The QR code encodes the FBR invoice number. If FBR specifies a different encoding format (URL, JSON payload), it will be updated when clarified by FBR.

5. **FBR Logo**: The FBR Digital Invoicing System logo will be stored as a static asset in the project. If FBR provides an official download URL, it will be used instead.

6. **Reference Data Caching**: Cached in PostgreSQL (same Neon database) using a simple TTL pattern. Redis is out of scope for Phase 1.

7. **Buyer Registry Scope**: Registry stores buyers after successful invoice submission. No separate buyer management UI in this phase.

8. **Scenario Selection**: The user selects a Scenario ID for sandbox testing from a dropdown. In production, scenarioId is not required by FBR.

9. **STATL for NTN Only**: STATL API checks registered NTN holders. For CNIC buyers or unregistered buyers, STATL check is skipped.

10. **Calculation Precision**: Tax calculations follow existing 2-decimal-place precision. FBR scenario-specific calculations (3rd schedule, petroleum) use the same rounding rules.

---

## Constraints

1. **Technology Stack**: Next.js App Router, TypeScript, Drizzle ORM — consistent with `002-invoice-creation-form`
2. **Security**: FBR Bearer token stored in `.env` only, never in code or client-side bundles
3. **No Breaking Changes**: All changes must be backwards-compatible with the existing invoice form (Phase 2 extends Phase 1)
4. **FBR API Compliance**: Request/response structure must exactly match FBR API v1.12 specification
5. **Print Spec Compliance**: QR code dimensions (1.0×1.0 inch, version 2.0 / 25×25) are non-negotiable FBR mandates
6. **Environment Parity**: Sandbox and Production logic must be identical except for the API endpoint URL

---

## Out of Scope

- FBR Purchase Invoice submission (this spec covers Sales only)
- Multi-currency support
- Token management UI (requesting new tokens from PRAL)
- Invoice amendment/cancellation via FBR API
- FBR portal login or taxpayer registration
- Bulk invoice submission
- FBR reporting or analytics
- PDF generation (print layout only, no PDF download)
- Email delivery of invoices
- Credit Note submission

---

## Dependencies

- `002-invoice-creation-form` — existing invoice form, Zod schemas, calculation functions, DB schema (invoices, line_items)
- FBR API Bearer Token (`FBR_API_TOKEN`) — must be obtained from PRAL before live testing
- `qrcode` npm library — for QR code generation
- Existing PostgreSQL (Neon) database — for reference data caching and registry

---

## Risks and Mitigations

1. **Risk**: FBR APIs may be slow or have rate limits → **Mitigation**: Implement 30-second timeout, cache all reference data, show progress indicators during API calls

2. **Risk**: FBR error codes may change between API versions → **Mitigation**: Error code catalog stored as a data file (not hardcoded), easy to update

3. **Risk**: QR code format may be more complex than just encoding the invoice number → **Mitigation**: Build QR module with configurable content; update content format without changing print layout

4. **Risk**: STATL API may have usage limits → **Mitigation**: Cache STATL results per NTN for 24 hours; only re-verify if NTN changes
