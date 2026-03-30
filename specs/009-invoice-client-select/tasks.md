# Tasks: Invoice Form — Saved Client Selector

**Input**: Design documents from `specs/009-invoice-client-select/`
**Branch**: `009-invoice-client-select`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/client-api.md ✅ | quickstart.md ✅
**Tests**: Not requested in spec — no test tasks generated.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- No new project dependencies, no migrations, no API changes

---

## Phase 1: Setup

**Purpose**: No new infrastructure required. Verify baseline before modification.

- [x] T001 Read and review existing `src/components/invoices/ClientSearch.tsx` in full to understand current state, props, and auto-fill logic before any changes
- [x] T002 Read and review existing `src/components/invoices/InvoiceHeader.tsx` in full to locate the Business Name grid cell and current placement of `<ClientSearch>`

**Checkpoint**: Baseline understood — ready to begin component upgrade.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: State and data-fetching infrastructure needed by ALL three user stories. Must be complete before any user story phase.

**⚠️ CRITICAL**: User story phases depend on this foundation.

- [x] T003 Add `allClients: ClientResult[]`, `filteredClients: ClientResult[]`, and `error: string | null` state variables to `src/components/invoices/ClientSearch.tsx`
- [x] T004 Add `handleOpen()` async function in `src/components/invoices/ClientSearch.tsx` that fetches `GET /api/clients` (no query param), sets `allClients` and `filteredClients` to the result, sets `loading` false, and sets `error` on failure
- [x] T005 Remove the `value.length < 2` early-return guard from `handleInputChange` in `src/components/invoices/ClientSearch.tsx` (was preventing any display without typing)

**Checkpoint**: Foundation ready — component can now load all clients and state structure supports all three user stories.

---

## Phase 3: User Story 1 — Browse and Select a Saved Client (Priority: P1) 🎯 MVP

**Goal**: User opens Create Invoice, sees a clearly labelled control, opens it with one click, sees all their saved clients listed, and selects one to auto-fill all buyer fields instantly.

**Independent Test**: Navigate to `/invoices/new` → Buyer Information section → click the client picker trigger → all saved clients appear without typing → select one → Business Name, NTN/CNIC, Province, Address, Registration Type all populate correctly.

### Implementation

- [x] T006 [US1] Replace the `<input type="text">` search trigger with a styled click-to-open button (e.g., "Select a saved client ▾") in `src/components/invoices/ClientSearch.tsx` that calls `handleOpen()` on click and sets `isOpen` to true
- [x] T007 [US1] Render the dropdown list from `filteredClients` (not `results`) when `isOpen === true` in `src/components/invoices/ClientSearch.tsx`, preserving the existing `handleSelect(client)` button per item
- [x] T008 [US1] Add loading state display inside the dropdown while `handleOpen()` fetch is in progress in `src/components/invoices/ClientSearch.tsx`
- [x] T009 [US1] Add empty state inside the dropdown when `allClients.length === 0` and not loading: show message "No saved clients yet" with a link `<a href="/clients">Go to Clients page</a>` in `src/components/invoices/ClientSearch.tsx`
- [x] T010 [US1] Add error state inside the dropdown when `error` is non-null: show message "Could not load clients. Enter buyer details manually." in `src/components/invoices/ClientSearch.tsx`
- [x] T011 [US1] Verify `handleSelect(client)` still correctly calls `form.setValue()` for all five buyer fields (businessName, ntnCnic, address, province, registrationType) with the null/type guards from the original implementation in `src/components/invoices/ClientSearch.tsx`

**Checkpoint**: User Story 1 fully functional — browse and select works end-to-end. Validate independently using the test criteria above before proceeding.

---

## Phase 4: User Story 2 — Search/Filter Saved Clients (Priority: P2)

**Goal**: When the picker is open, the user can type any character to instantly filter the displayed list by business name — no minimum character requirement, no network round-trip.

**Independent Test**: Open client picker → type 1 character → list narrows to matching clients (case-insensitive) → clear input → full list returns. No API call is made during filtering.

### Implementation

- [x] T012 [US2] Add a filter `<input type="text">` field at the top of the open dropdown in `src/components/invoices/ClientSearch.tsx` that updates `query` state on change (autofocus when dropdown opens)
- [x] T013 [US2] Implement client-side filter in `handleInputChange`: set `filteredClients = allClients.filter(c => c.businessName.toLowerCase().includes(value.toLowerCase()))` in `src/components/invoices/ClientSearch.tsx` — no API call, no debounce needed
- [x] T014 [US2] Show "No clients match '[query]'" message when `filteredClients.length === 0` and `query` is non-empty (distinct from the zero-clients empty state) in `src/components/invoices/ClientSearch.tsx`
- [x] T015 [US2] Reset `filteredClients` to `allClients` and clear `query` when the dropdown closes (click-outside or selection) in `src/components/invoices/ClientSearch.tsx`

**Checkpoint**: User Stories 1 AND 2 both work independently — browse and filter both functional.

---

## Phase 5: User Story 3 — Clear Selected Client (Priority: P3)

**Goal**: After selecting a saved client, the user can clear the selection with one click — all auto-filled buyer fields reset to blank and the picker returns to its initial state.

**Independent Test**: Select any saved client → all buyer fields populate → click "Clear" → all fields return to blank → picker trigger button is shown again ready for a new selection.

### Implementation

- [x] T016 [US3] Add a "✕ Clear" button next to the selected-name chip in `src/components/invoices/ClientSearch.tsx` that calls `handleClear()` on click
- [x] T017 [US3] Update `handleClear()` in `src/components/invoices/ClientSearch.tsx` to reset: `selectedName = ''`, `allClients = []`, `filteredClients = []`, `query = ''`, `isOpen = false`, `error = null` — and call `form.setValue()` to clear `buyerBusinessName`, `buyerNTNCNIC`, `buyerAddress` (existing behaviour — verify province and registrationType are also cleared)
- [x] T018 [US3] Verify that after clearing, clicking the trigger again re-fetches `GET /api/clients` (calls `handleOpen()` fresh) in `src/components/invoices/ClientSearch.tsx`

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Layout & Polish

**Purpose**: Relocate the component to a visible position, add keyboard nav, run final validation.

- [x] T019 In `src/components/invoices/InvoiceHeader.tsx`, move `<ClientSearch form={form} />` out of the Business Name grid cell and into a new full-width `<div>` row placed at the top of the Buyer Information section (above the Registration Type radio group)
- [x] T020 In `src/components/invoices/InvoiceHeader.tsx`, remove the `<div className="mb-2">` wrapper and `<p className="text-xs...">From saved clients:</p>` label that previously surrounded `<ClientSearch>` inside the Business Name cell
- [x] T021 In `src/components/invoices/InvoiceHeader.tsx`, add a clear section label above the relocated `<ClientSearch>` (e.g., `<p className="text-sm font-medium mb-2">Quick-fill from saved clients</p>`)
- [x] T022 In `src/components/invoices/ClientSearch.tsx`, add keyboard support: `Escape` closes the dropdown; `Enter` on a focused list item selects it; ensure the filter input and list items are reachable via `Tab`
- [x] T023 [P] Verify `<BuyerSearch>` (FBR registry) in `src/components/invoices/InvoiceHeader.tsx` is unaffected — confirm it still renders in its original position and functions correctly
- [ ] T024 Run all 10 manual test cases from `specs/009-invoice-client-select/quickstart.md` and confirm every item passes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user story phases**
- **Phase 3 (US1)**: Depends on Phase 2 — can start immediately after
- **Phase 4 (US2)**: Depends on Phase 2 — can start after US1 or in parallel with US1 (different code sections)
- **Phase 5 (US3)**: Depends on Phase 2 — can start after US1/US2 or in parallel
- **Phase 6 (Polish)**: Depends on all user story phases complete

### User Story Dependencies

- **US1 (Browse & Select — P1)**: Independent after Phase 2. No dependency on US2 or US3.
- **US2 (Filter — P2)**: Independent after Phase 2. Builds on the dropdown UI from US1 but can be developed in parallel if targeting the same component section.
- **US3 (Clear — P3)**: Independent after Phase 2. Clear already partially existed; upgrade is additive.

### Within Each Phase

- T003 → T004 → T005 (sequential — state must exist before fetch logic)
- T006 → T007 (trigger before list render)
- T012 → T013 (filter input before filter logic)
- T019 → T020 → T021 (layout moves must be sequential in same file)

### Parallel Opportunities

- T001 and T002 can run in parallel (different files, read-only)
- T003, T004, T005 are sequential but fast (one file, additive changes)
- US2 (T012–T015) and US3 (T016–T018) can be worked in parallel after US1 checkpoint
- T023 (BuyerSearch regression check) can run at any point in parallel

---

## Parallel Example: Phase 3 (US1)

```
# Tasks T008, T009, T010 address distinct dropdown states — can be targeted in parallel:
Task: "Add loading state inside dropdown — src/components/invoices/ClientSearch.tsx"
Task: "Add empty state with Clients link — src/components/invoices/ClientSearch.tsx"
Task: "Add error state message — src/components/invoices/ClientSearch.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T005)
3. Complete Phase 3: User Story 1 (T006–T011)
4. **STOP and VALIDATE**: Browse + select works end-to-end
5. Run quickstart.md items 1–6 only

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 (US1) → Browse & select functional → validate
3. Phase 4 (US2) → Filter functional → validate
4. Phase 5 (US3) → Clear functional → validate
5. Phase 6 → Layout promoted, keyboard nav, full regression → ship

---

## Notes

- All 24 tasks affect exactly 2 files: `ClientSearch.tsx` and `InvoiceHeader.tsx`
- No API changes, no schema changes, no new dependencies
- The BuyerSearch component is never touched (T023 validates this)
- `[P]` tasks operate on different logical sections of the same file — coordinate if pairing
- Commit after each phase checkpoint
