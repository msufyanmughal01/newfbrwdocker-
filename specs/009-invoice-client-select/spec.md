# Feature Specification: Invoice Form — Saved Client Selector

**Feature Branch**: `009-invoice-client-select`
**Created**: 2026-02-26
**Status**: Draft
**Input**: User description: "i have saved the client info but i am unable to select that there is no option to select from the saved client in the create invoice form"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Browse and Select a Saved Client (Priority: P1)

A user who regularly invoices the same clients has saved those clients in the Clients section. When creating a new invoice, they want to pick a client from their saved list without typing anything — the selected client should instantly fill in all buyer fields on the invoice.

**Why this priority**: This is the core reported problem. The current search-only widget is buried under the Business Name field and requires the user to know they must type 2+ characters. There is no visible dropdown or browse option, making the feature effectively invisible. Fixing discoverability of saved client selection is the highest-value change.

**Independent Test**: Navigate to Create Invoice → Buyer Information section → click a visible "Select saved client" control → all saved clients appear → select one → all buyer fields populate automatically. Can be verified without any other story being complete.

**Acceptance Scenarios**:

1. **Given** the user has at least one saved client, **When** they open the Create Invoice form and view the Buyer Information section, **Then** they see a clearly labelled control to select from their saved clients without having to type anything first.

2. **Given** the saved client picker is visible, **When** the user opens it, **Then** all their saved clients are listed (sorted alphabetically) and can be selected with a single click.

3. **Given** the user selects a saved client, **When** the selection is made, **Then** the following buyer fields are instantly populated: Business Name, NTN/CNIC, Province, Address, and Registration Type.

4. **Given** the user selects a saved client whose record has no NTN/CNIC or address, **When** the selection is made, **Then** only the available fields are filled; empty fields remain blank and editable.

---

### User Story 2 — Search Saved Clients by Name (Priority: P2)

A user with a long list of saved clients needs to quickly narrow the list by typing a name fragment, without scrolling through all entries.

**Why this priority**: Once the browse mode exists (P1), search within it becomes the natural next step for users with many clients.

**Independent Test**: Open the saved client picker → type at least 1 character → list filters in real time to matching clients. Delivers value independently once P1 browse mode exists.

**Acceptance Scenarios**:

1. **Given** the client picker is open, **When** the user types into a search field inside the picker, **Then** the list filters to clients whose name contains the typed text (case-insensitive).

2. **Given** the user types a search term that matches no saved clients, **When** the list updates, **Then** a clear "No clients found" message is shown with a link or button to add a new client.

---

### User Story 3 — Clear a Selected Client (Priority: P3)

After selecting a saved client, the user realises they chose the wrong one and wants to reset the buyer fields and pick again.

**Why this priority**: Correcting a mistaken selection must be easy; without it the user is forced to manually clear every field.

**Independent Test**: Select a saved client → a clear/reset action is visible → clicking it removes the selection and clears all auto-filled buyer fields. Can be tested independently once P1 is done.

**Acceptance Scenarios**:

1. **Given** a saved client has been selected and buyer fields are populated, **When** the user triggers the clear action, **Then** all auto-filled fields return to blank and the picker resets to allow a new selection.

2. **Given** the picker has been cleared, **When** the user opens the picker again, **Then** the full client list is shown with no previous selection highlighted.

---

### Edge Cases

- What happens when the user has zero saved clients? The picker shows an empty state with a prompt to add clients first, with a link to the Clients page.
- What happens if a saved client's province value does not match a valid FBR province? The Province field is left blank and the user must select one manually.
- What happens if the user manually edits a field after selecting a saved client? The edited field updates normally; the saved client selection indicator clears to avoid implying the client record is still in control.
- What happens when the client list cannot be loaded (network error)? The picker shows an error state; all buyer fields remain manually editable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Buyer Information section MUST display a dedicated, prominently placed control labelled to indicate it selects from saved clients — visible without any prior user interaction.
- **FR-002**: The saved client picker MUST show all of the user's saved (non-deleted) clients when opened, sorted alphabetically by business name, without requiring any search input first.
- **FR-003**: The saved client picker MUST support inline text filtering that narrows results as the user types, with no minimum character requirement.
- **FR-004**: Selecting a client from the picker MUST auto-fill the following fields: Business Name, NTN/CNIC (if saved), Province (if saved and valid), Address (if saved), and Registration Type (if saved).
- **FR-005**: After a client is selected, the form MUST show a visible indicator of which client is selected, and provide a one-click action to clear the selection.
- **FR-006**: Clearing the selection MUST reset all fields that were auto-filled by that selection to blank.
- **FR-007**: When the user has no saved clients, the picker MUST display an empty state with a navigable link to the Clients page.
- **FR-008**: The picker MUST be operable via keyboard navigation (open, filter, select, and close without requiring a mouse).
- **FR-009**: The existing FBR buyer registry search (BuyerSearch) MUST remain fully functional and unaffected by this change.

### Key Entities

- **Client (saved)**: A user-owned buyer record with fields: Business Name (required), NTN/CNIC (optional), Province (optional), Address (optional), Registration Type (optional). Managed on the Clients page.
- **Buyer Fields (invoice form)**: The set of fields on the Create Invoice form that describe the buyer: Business Name, NTN/CNIC, Province, Address, Registration Type. These are the target of the auto-fill action.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users who have at least one saved client can select that client and have all buyer fields populated within 5 seconds of opening the Create Invoice form, with zero manual typing required.
- **SC-002**: The saved client picker is visible and operable without any prior user action — no hidden trigger, no minimum typing, no scrolling required to find it.
- **SC-003**: 100% of non-empty client fields (Business Name, NTN/CNIC, Province, Address, Registration Type) are correctly propagated to the corresponding invoice buyer fields upon selection.
- **SC-004**: Users with 50 or more saved clients can filter to the correct client within 3 keystrokes.
- **SC-005**: The existing FBR buyer registry search remains fully functional and is not broken by this change.

## Assumptions

- The `/api/clients` endpoint already returns all fields needed for auto-fill; no new backend API changes are required.
- "Saved clients" refers exclusively to clients managed on the Clients page, not the FBR buyer registry (`buyer_registry` table).
- The existing `ClientSearch` component (search-only, 2+ character minimum) will be upgraded to support browse mode; the FBR `BuyerSearch` component is out of scope and remains unchanged.
- If a saved client has a province value that is not a valid FBR province option, it is silently skipped and the Province field is left empty.
- Registration Type values stored in the client record are limited to "Registered" and "Unregistered"; any other stored value is silently ignored during auto-fill.
