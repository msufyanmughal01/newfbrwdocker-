# Feature Specification: TaxDigital Platform Overhaul — Homepage, Admin & Bulk Invoice

**Feature Branch**: `011-homepage-admin-bulk`
**Created**: 2026-03-25
**Status**: Draft
**Input**: User description: "TaxDigital platform overhaul — set light mode as default, build modern landing page, update admin user-creation flow to allow manual password entry, implement 4-step bulk invoice workflow (template download → upload → FBR NTN verification → submit), wire up sidebar and invoices page, and ensure all tests pass."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Visitor Lands on Homepage and Learns About the Product (Priority: P1)

A potential business owner visits the root URL (`/`) for the first time. They are not logged in. They see a polished marketing landing page that explains TaxDigital's value proposition, features, how to get access, and how to contact the admin.

**Why this priority**: This is the first impression of the product. Without a credible homepage, prospective clients cannot discover or understand the platform. It directly drives user acquisition.

**Independent Test**: Open the root URL without a session. Verify the landing page loads with all required sections, and clicking "Get Started" takes the visitor to the login page.

**Acceptance Scenarios**:

1. **Given** a visitor with no active session, **When** they visit `/`, **Then** the landing page renders with navbar, hero, features, how-it-works, contact, and footer sections.
2. **Given** a visitor on the landing page, **When** they click "Sign In" in the navbar, **Then** they are taken to `/login`.
3. **Given** a logged-in user, **When** they visit `/`, **Then** they are automatically redirected to `/dashboard`.
4. **Given** a visitor, **When** they click "Contact Us" or "Book a Demo Call", **Then** the page scrolls smoothly to the contact form section.
5. **Given** a visitor, **When** they submit the contact form with valid data, **Then** a success message replaces the form confirming submission.
6. **Given** a visitor, **When** they click "Book a Call Instead", **Then** a booking page opens in a new tab.

---

### User Story 2 — Admin Creates a New User Account with a Custom Password (Priority: P1)

The admin navigates to the admin panel, enters a new user's full name and email, either generates a random strong password or types a custom one, reviews the generated password in a visible field, optionally edits it, then clicks "Create Account." After creation, the admin sees the exact credentials (name, email, and the password they confirmed) to hand to the new user.

**Why this priority**: TaxDigital uses admin-controlled user registration. The admin must be able to see and communicate the password to new users. The current flow generates passwords server-side without showing them to the admin, blocking onboarding.

**Independent Test**: Log in as admin, create a new user by generating a password, edit one character, click Create Account, and verify the credentials card shows the edited password — not the original generated one.

**Acceptance Scenarios**:

1. **Given** the admin is on the admin panel, **When** they click "Generate Password", **Then** a strong random password appears in the password input field and remains editable.
2. **Given** a generated password is showing, **When** the admin manually changes a character, **Then** the modified password is retained as-is.
3. **Given** the admin has filled name, email, and password, **When** they click "Create Account", **Then** the account is created using exactly the password in the field.
4. **Given** account creation succeeds, **When** the credentials card appears, **Then** it shows the name, email, and the exact password that was in the field at the time of submission.
5. **Given** the admin has not filled one of name, email, or password, **When** they attempt to submit, **Then** the "Create Account" button is disabled.
6. **Given** an invalid admin key, **When** the admin page is accessed, **Then** a 404 response is returned.

---

### User Story 3 — User Submits Bulk Invoices via 4-Step Workflow (Priority: P1)

A logged-in business user needs to submit many invoices at once. They download an Excel template with example data, fill in their actual invoice rows, upload the file, wait for field validation, then verify each buyer's NTN against the FBR registry, then submit only the FBR-verified rows.

**Why this priority**: Manual invoice creation is impractical for businesses that issue hundreds of invoices per month. The bulk workflow is a core differentiator for the platform.

**Independent Test**: Download the template, fill in 3 rows (2 with valid NTNs, 1 with an invalid NTN), upload, run NTN verification, submit — and confirm only the 2 verified rows are submitted.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the bulk upload page, **When** they click "Download Template", **Then** an `.xlsx` file downloads with column headers and one example data row.
2. **Given** a downloaded template, **When** the user fills in data and uploads it, **Then** the system validates all required fields and shows a results table with "Valid" or "Invalid" status per row.
3. **Given** field validation has completed, **When** the user clicks "Verify All NTNs with FBR", **Then** each unique BuyerNTN from field-valid rows is checked against the FBR registry.
4. **Given** NTN verification completes, **When** the results table updates, **Then** each row shows either "FBR Registered" (green) or "Not Registered" (red).
5. **Given** verified rows exist, **When** the user clicks "Submit to FBR" and confirms, **Then** only rows with verified NTNs are submitted to FBR.
6. **Given** submission completes, **When** the result card appears, **Then** it shows how many invoices were submitted successfully and how many failed, with error details for failures.
7. **Given** no field-valid rows exist after upload, **When** the user reaches Step 3, **Then** the "Verify All NTNs" button is disabled.

---

### User Story 4 — App Loads in Light Mode by Default (Priority: P2)

A new visitor or user who has never set a theme preference opens the application. The app renders in light mode with no flash of dark mode before light mode is applied.

**Why this priority**: The app currently defaults to dark mode. Light mode is required for professional business use and white-label readiness. A dark mode flash on first load degrades the first impression.

**Independent Test**: Clear localStorage and open the app in a fresh browser session. Verify the page renders in light mode immediately with no dark flash.

**Acceptance Scenarios**:

1. **Given** no theme stored in localStorage, **When** the app loads, **Then** it renders in light mode with no visible flash.
2. **Given** a user has explicitly set dark mode previously, **When** the app loads, **Then** it respects the stored preference.
3. **Given** a user has explicitly set light mode, **When** the app reloads, **Then** light mode persists.

---

### User Story 5 — Sidebar and Invoices Page Include Bulk Upload Access (Priority: P2)

A logged-in user navigates to the invoices section and can easily find and access the bulk upload feature from both the sidebar navigation and the invoices list page header.

**Why this priority**: Without clear navigation to bulk upload, users cannot discover the feature, rendering it unused.

**Independent Test**: Navigate to the dashboard and confirm a "Bulk Upload" link appears in the sidebar under invoices, and confirm the invoices list page has a "Bulk Upload" button in its header.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they look at the sidebar, **Then** they see a "Bulk Upload" link under the invoices section.
2. **Given** a logged-in user on `/invoices`, **When** they view the page header, **Then** they see a "Bulk Upload" button.
3. **Given** the login page, **When** a visitor views it, **Then** there is no Google sign-in button and no self-registration link — only a "Forgot password?" link and a "Back to home" link.
4. **Given** the register page, **When** visited directly, **Then** it redirects to the login page.

---

### Edge Cases

- What happens when a user uploads a file with more than 500 rows? The system should reject the file or skip rows beyond 500 with a clear warning.
- What happens when an NTN field is empty in an uploaded row? The row should be flagged as field-invalid during validation and excluded from NTN verification.
- What happens when the FBR NTN verification service is unreachable? Rows should be marked "Could not verify" and excluded from submission.
- What happens when the admin types a password shorter than 8 characters and clicks "Create Account"? The server should reject it with a clear error.
- What happens if an uploaded file contains only the header row and no data? The system should show an empty results table with a message like "No data rows found."
- What happens when the contact form is submitted without required fields? HTML5 required validation prevents submission.

---

## Requirements *(mandatory)*

### Functional Requirements

**Theme**

- **FR-001**: The application MUST default to light mode when no theme preference is stored.
- **FR-002**: The theme default MUST be applied before first paint — no dark flash on load.
- **FR-003**: Stored user theme preferences MUST be respected on subsequent visits.

**Landing Page**

- **FR-004**: The root URL `/` MUST redirect authenticated users to `/dashboard`.
- **FR-005**: The root URL `/` MUST display a marketing landing page for unauthenticated visitors.
- **FR-006**: The landing page MUST include a sticky navbar with logo, "Contact Us" scroll anchor, and "Sign In" button linking to `/login`.
- **FR-007**: The landing page hero MUST contain a headline, subtitle, "Get Started" button to `/login`, "Book a Demo Call" button scrolling to the contact section, and three key statistics.
- **FR-008**: The landing page MUST include a features section with six feature cards.
- **FR-009**: The landing page MUST include a "How It Works" section with three numbered steps.
- **FR-010**: The landing page MUST include a contact section with `id="contact"` containing a form with Full Name, Business Name, Email, optional Phone, and Message fields.
- **FR-011**: The contact form MUST show a success state on submission and reset all fields.
- **FR-012**: The landing page MUST include a footer with logo, navigation links, and copyright text.
- **FR-013**: All landing page colors MUST use CSS custom properties — no hardcoded color values.

**Admin User Creation**

- **FR-014**: The admin panel form MUST include Full Name, Email, and Password fields.
- **FR-015**: A "Generate Password" button MUST produce a strong random password and fill it into the password field.
- **FR-016**: The generated password MUST remain editable so the admin can modify it before account creation.
- **FR-017**: The password field MUST include a show/hide toggle.
- **FR-018**: The "Create Account" button MUST be disabled when any required field is empty.
- **FR-019**: The credentials display after creation MUST show the exact password submitted (not a regenerated one).
- **FR-020**: The create-user API endpoint MUST receive the password in the request body rather than generating one server-side.
- **FR-021**: Passwords shorter than 8 characters MUST be rejected by the API with an appropriate error message.

**Bulk Invoice Workflow**

- **FR-022**: The bulk upload page MUST present a 4-step workflow indicator.
- **FR-023**: Step 1 (Download Template) MUST generate and download an Excel file with column headers and an example data row.
- **FR-024**: Step 2 (Upload File) MUST accept `.xlsx`, `.xls`, and `.csv` files via drag-and-drop or file picker.
- **FR-025**: The upload API MUST perform field-only validation and MUST NOT call the FBR NTN API.
- **FR-026**: Upload results MUST be shown in a table with row, invoice number, buyer NTN, buyer name, status, and errors columns.
- **FR-027**: Step 3 (Verify FBR Registration) MUST check each unique BuyerNTN from field-valid rows against the FBR NTN registry.
- **FR-028**: NTN verification results MUST update the results table with a "FBR Registered" or "Not Registered" badge per row.
- **FR-029**: Step 4 (Submit to FBR) MUST only include rows that are both field-valid and NTN-verified.
- **FR-030**: A confirmation dialog MUST appear before submission, stating the count of invoices and that the action is irreversible.
- **FR-031**: Post-submission results MUST show submitted count, failed count, and per-row FBR error messages for failures.
- **FR-032**: The page MUST show a recent batch history table below the workflow.

**Navigation & Auth Pages**

- **FR-033**: The sidebar MUST contain a "Bulk Upload" navigation link under the invoices group.
- **FR-034**: The invoices list page header MUST contain a "Bulk Upload" button.
- **FR-035**: The login page MUST NOT contain a Google sign-in button or a self-registration link.
- **FR-036**: The register route MUST redirect to `/login`.

**Quality Gates**

- **FR-037**: All TypeScript errors MUST be resolved before delivery.
- **FR-038**: All ESLint warnings and errors MUST be resolved before delivery.
- **FR-039**: All automated tests MUST pass with zero failures before delivery.

### Key Entities

- **BulkInvoiceBatch**: A processed upload session — tracks filename, total rows, field-valid count, NTN-verified count, submitted count, failed count, status, and the array of processed invoice rows.
- **InvoiceRow**: One row within a batch — contains the raw data fields, field validation result, errors list, NTN verification status and message, FBR submission result, and current status (validated / invalid / ready / ntn-failed / submitted / failed).
- **Credential**: Ephemeral display object after admin creates a user — contains name, email, and the plaintext password shown once.
- **ContactSubmission**: Landing page form data (name, business name, email, phone, message) — simulated submission with no persistence in this release.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new visitor understands the product offering and reaches the contact form in under 30 seconds of arriving at the homepage.
- **SC-002**: The app renders in light mode on first visit with zero visible dark-mode flash across Chrome, Firefox, and Safari.
- **SC-003**: An admin creates a new user account with a chosen password in under 60 seconds from opening the admin panel.
- **SC-004**: The credentials card after user creation shows the exact password the admin used — verifiable by comparing the card value against the value typed/generated in the form.
- **SC-005**: The bulk workflow clearly separates field-invalid rows, NTN-unverified rows, and ready-to-submit rows — zero eligible rows are accidentally excluded and zero ineligible rows are accidentally included in any submission.
- **SC-006**: `tsc --noEmit` exits with zero errors after all changes.
- **SC-007**: ESLint exits with zero errors and zero warnings after all changes.
- **SC-008**: All automated test suites pass with zero failures after all changes.
- **SC-009**: A sidebar "Bulk Upload" link and an invoices-page "Bulk Upload" button are present and navigable.

---

## Constraints

- Auth API routes (`src/app/api/auth/`) MUST NOT be modified.
- Organization, member, and invitation database tables MUST NOT be dropped or altered.
- `src/lib/fbr/post-invoice.ts` MUST NOT be modified — it is read-only; only called.
- All UI colors MUST reference CSS variables — no inline hex, rgb, or hsl literals.
- NTN verification MUST be a separate server-side step from field validation (separate API routes).
- Passwords shorter than 8 characters MUST be rejected server-side.

---

## Assumptions

1. The existing CSS variable design system defines all required variables. Any missing variables (e.g. `--bg-subtle`, `--positive-bg`, `--error-bg`) will be added to `globals.css` as needed.
2. The `bulkInvoiceBatch` schema table already exists or will be created as part of a prior migration.
3. The FBR NTN verification endpoint (`/api/fbr/verify-ntn`) already exists; its exact response shape will be read from source before implementation.
4. The contact form submission is fully simulated in this release — no backend persistence or email sending required.
5. The "Book a Call" button uses a placeholder URL; the real Calendly link is a separate configuration concern.
6. The `xlsx` library is available as a project dependency or will be added without version conflicts.
7. Better-auth supports direct password provisioning via `signUpEmail` without triggering an email-verification step.
8. The admin panel access control (ADMIN_SECRET_KEY) is already configured in the environment.
