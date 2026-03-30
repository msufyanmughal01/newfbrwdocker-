# Tasks: Invoice Creation Form

**Input**: Design documents from `/specs/002-invoice-creation-form/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/invoice-api.md

**Tests**: NOT requested in feature specification - tasks focus on implementation only

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [x] T001 Install React Hook Form and resolvers: `npm install react-hook-form @hookform/resolvers`
- [x] T002 [P] Install Zod validation library: `npm install zod`
- [x] T003 [P] Install IndexedDB wrapper library: `npm install idb`
- [x] T004 [P] Install debounce utility: `npm install use-debounce`
- [x] T005 [P] Install date handling library (if needed): `npm install date-fns`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Business Logic & Reference Data

- [x] T006 [P] Create FBR reference data file with provinces, tax rates, HS codes, UOMs, sale types in src/lib/invoices/fbr-reference-data.ts
- [x] T007 [P] Create Zod validation schemas for invoice, line items, NTN/CNIC, dates in src/lib/invoices/validation.ts
- [x] T008 [P] Create pure calculation functions for line item totals and invoice totals in src/lib/invoices/calculations.ts
- [x] T009 [P] Create FBR mapping functions to convert internal format to FBR API v1.12 format in src/lib/invoices/fbr-mapping.ts
- [x] T010 [P] Create IndexedDB draft storage utilities (save, load, list, delete) in src/lib/invoices/draft-storage.ts

### Database Schema

- [x] T011 Create Drizzle schema for invoices table with enums, fields, indexes in src/lib/db/schema/invoices.ts
- [x] T012 Create Drizzle schema for line_items table with all FBR fields in src/lib/db/schema/invoices.ts
- [x] T013 Create Drizzle schema for invoice_drafts table (Phase 2 - server sync) in src/lib/db/schema/invoices.ts
- [x] T014 Add relations (invoice → organization, invoice → line items, draft → organization) in src/lib/db/schema/invoices.ts
- [x] T015 Export invoices schema from main schema index in src/lib/db/schema/index.ts
- [x] T016 Generate database migration from schema: `npm run db:generate`
- [x] T017 Apply database migration: `npm run db:push` ✅ Successfully applied to Neon database

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Stories 1 + 1b + 2 + 3 (Core Invoice Creation - P1) 🎯 MVP

**Goal**: Enable users to create FBR-compliant Sale Invoices and Debit Notes with dynamic line items (1-100), real-time tax calculations updating within 100ms, and form submission

**Why combined**: These user stories are interdependent - you cannot create an invoice without line items, calculations, and the ability to add/remove items. They deliver value as a single cohesive feature.

**Independent Test**:
1. Navigate to `/dashboard/invoices/new`
2. Fill in seller/buyer information (NTN/CNIC, names, addresses, provinces)
3. Select "Sale Invoice" or "Debit Note" (with reference for debit notes)
4. Add multiple line items (HS code, description, quantity, price, tax rate)
5. Observe calculations update in real-time as values change
6. Add/remove line items and verify totals recalculate
7. Submit the invoice and verify it's created in database with correct totals

### API Routes

- [x] T018 [P] Create invoice validation endpoint POST /api/invoices/validate in src/app/api/invoices/validate/route.ts
- [x] T019 [P] Create invoice creation endpoint POST /api/invoices with calculation and FBR mapping in src/app/api/invoices/route.ts

### UI Components (Bottom-Up)

- [x] T020 [P] [US1] Create InvoiceHeader component for invoice type, dates, seller/buyer fields in src/components/invoices/InvoiceHeader.tsx
- [x] T021 [P] [US3] Create LineItemRow component (memoized) for single line item with all FBR fields in src/components/invoices/LineItemRow.tsx
- [x] T022 [US3] Create LineItemsTable component with useFieldArray for dynamic add/remove in src/components/invoices/LineItemsTable.tsx
- [x] T023 [P] [US2] Create InvoiceSummary component to display calculated subtotal, tax, grand total in src/components/invoices/InvoiceSummary.tsx
- [x] T024 [US1] Create main invoice form client component with React Hook Form, calculations memoization in src/app/(dashboard)/invoices/invoice-form-client.tsx
- [x] T025 [US1] Create server component page wrapper for new invoice route in src/app/(dashboard)/invoices/new/page.tsx

### Integration & Validation

- [x] T026 [US1b] Add Debit Note conditional validation (invoice reference required when type is Debit Note) in invoice form
- [x] T027 [US2] Connect calculation functions to form with useMemo and watch for real-time updates
- [x] T028 [US1] Integrate Zod validation with React Hook Form using zodResolver
- [x] T029 [US1] Add form submission logic calling POST /api/invoices with error handling

**Checkpoint**: At this point, User Stories 1, 1b, 2, and 3 should be fully functional together - users can create invoices with dynamic line items and see real-time calculations

---

## Phase 4: User Story 4 (Enhanced Validation - P2)

**Goal**: Prevent invalid invoice submissions through comprehensive inline validation with clear error messages

**Independent Test**:
1. Attempt to submit invoice with missing required fields (seller name, buyer address, etc.)
2. Enter invalid NTN/CNIC formats (wrong digit counts)
3. Enter negative quantities or invalid tax rates
4. Try to submit with zero line items
5. Verify inline error messages appear for each validation failure
6. Verify form cannot be submitted while errors exist
7. Correct errors and verify error messages disappear

### Implementation for User Story 4

- [x] T030 [US4] Add inline error display for all invoice header fields in InvoiceHeader component
- [x] T031 [US4] Add inline error display for line item fields with field-level validation in LineItemRow component
- [x] T032 [US4] Add validation error summary at form level in invoice-form-client.tsx
- [x] T033 [US4] Add validation state indicators (red borders, error icons) to form fields
- [x] T034 [US4] Add submit button disabled state when validation errors exist
- [x] T035 [US4] Add NTN/CNIC format validation with real-time feedback
- [x] T036 [US4] Add invoice reference number validation for Debit Notes (22 or 28 digits)

**Checkpoint**: At this point, User Story 4 should work - form validates all fields and prevents invalid submissions

---

## Phase 5: User Story 5 (Draft Saving - P3)

**Goal**: Auto-save incomplete invoices every 60 seconds to IndexedDB with indefinite retention, allowing users to resume work later

**Independent Test**:
1. Start creating an invoice
2. Fill in partial information (some seller fields, 1-2 line items)
3. Wait 60 seconds and verify auto-save indicator shows "Saving..." then "Saved"
4. Close browser tab or navigate away
5. Return to invoice creation page
6. Verify draft recovery prompt appears
7. Resume editing and verify all data is preserved
8. Complete and submit invoice - verify draft is deleted

### Implementation for User Story 5

- [x] T037 [P] [US5] Create DraftIndicator component showing save status (saving/saved/last saved time) in src/components/invoices/DraftIndicator.tsx
- [x] T038 [US5] Add draft auto-save logic with 60-second interval using useDebouncedCallback in invoice-form-client.tsx
- [x] T039 [US5] Add draft recovery on page load (check IndexedDB, prompt user to restore) in invoice-form-client.tsx
- [x] T040 [US5] Add manual "Save Draft" button and handler in invoice-form-client.tsx
- [x] T041 [US5] Integrate DraftIndicator component into invoice form layout
- [x] T042 [US5] Add draft deletion on successful invoice submission
- [x] T043 [US5] Add organization scoping to draft storage (multi-tenant support)

**Checkpoint**: At this point, User Story 5 should work independently - drafts save automatically and can be resumed

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [ ] T044 [P] Add loading states for form submission and API calls
- [ ] T045 [P] Add success/error toast notifications for invoice creation
- [ ] T046 Add keyboard navigation support (Tab, Enter, Escape)
- [ ] T047 [P] Add ARIA labels and screen reader support for accessibility
- [ ] T048 Optimize form performance - verify <1s load time with React DevTools Profiler
- [ ] T049 Optimize calculation performance - verify <100ms update time with 100 line items
- [ ] T050 [P] Add form reset after successful submission
- [ ] T051 [P] Update type definitions in src/types/index.ts with Invoice types
- [ ] T052 Verify all FBR mandatory fields are captured per dataformat.md specification
- [ ] T053 [P] Add confirmation dialog for destructive actions (clear form, delete draft)
- [ ] T054 Manual validation against quickstart.md checklist
- [ ] T055 [P] Code cleanup and remove console.logs
- [ ] T056 [P] Add JSDoc comments to complex functions (calculations, FBR mapping)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **Core Invoice Creation (Phase 3)**: Depends on Foundational phase completion
- **Enhanced Validation (Phase 4)**: Depends on Phase 3 completion (builds on existing form)
- **Draft Saving (Phase 5)**: Depends on Phase 3 completion but can run in parallel with Phase 4
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Stories 1 + 1b + 2 + 3 (Phase 3)**: Must be built together as a cohesive MVP
  - US1 (Sale Invoice) requires US2 (calculations) and US3 (line items)
  - US1b (Debit Note) extends US1 with reference field
  - US2 (calculations) is triggered by US3 (line item changes)

- **User Story 4 (Phase 4)**: Builds on Phase 3 form components - adds validation feedback

- **User Story 5 (Phase 5)**: Independent of US4 - can proceed in parallel after Phase 3

### Within Each Phase

**Phase 2 (Foundational)**:
- T006-T010 (business logic) can run in parallel [P]
- T011-T015 (database schema) must run sequentially (same file)
- T016-T017 (migrations) must run after schema completion

**Phase 3 (Core Invoice Creation)**:
- T018-T019 (API routes) can run in parallel [P]
- T020, T021, T023 (independent components) can run in parallel [P]
- T022 (LineItemsTable) depends on T021 (LineItemRow)
- T024 (main form) depends on T020, T022, T023 (uses these components)
- T025 (page wrapper) depends on T024 (wraps the form)
- T026-T029 (integration) run after UI components are ready

**Phase 4 (Enhanced Validation)**:
- All tasks modify existing components - run sequentially in order

**Phase 5 (Draft Saving)**:
- T037 (DraftIndicator) can run in parallel with T038-T040 [P]
- T038-T043 touch same file (invoice-form-client.tsx) - run sequentially

**Phase 6 (Polish)**:
- T044, T045, T047, T050, T051, T053, T055, T056 can run in parallel [P]
- Other tasks require existing form to test against

### Parallel Opportunities

**Within Phase 2**:
```bash
# Parallel - different files:
Task T006: "Create FBR reference data in src/lib/invoices/fbr-reference-data.ts"
Task T007: "Create Zod validation schemas in src/lib/invoices/validation.ts"
Task T008: "Create calculation functions in src/lib/invoices/calculations.ts"
Task T009: "Create FBR mapping functions in src/lib/invoices/fbr-mapping.ts"
Task T010: "Create IndexedDB utilities in src/lib/invoices/draft-storage.ts"
```

**Within Phase 3**:
```bash
# Parallel - different files:
Task T018: "Create validation endpoint in src/app/api/invoices/validate/route.ts"
Task T019: "Create invoice endpoint in src/app/api/invoices/route.ts"
Task T020: "Create InvoiceHeader in src/components/invoices/InvoiceHeader.tsx"
Task T021: "Create LineItemRow in src/components/invoices/LineItemRow.tsx"
Task T023: "Create InvoiceSummary in src/components/invoices/InvoiceSummary.tsx"
```

**Within Phase 6**:
```bash
# Parallel - different concerns:
Task T044: "Add loading states"
Task T045: "Add toast notifications"
Task T047: "Add ARIA labels"
Task T050: "Add form reset"
Task T051: "Update type definitions"
```

---

## Implementation Strategy

### MVP First (Phase 3 Only)

1. Complete Phase 1: Setup → Dependencies installed
2. Complete Phase 2: Foundational → Database, validation, calculations ready
3. Complete Phase 3: Core Invoice Creation → Full invoice creation flow works
4. **STOP and VALIDATE**:
   - Test creating Sale Invoice with 1 item
   - Test creating Sale Invoice with 10 items
   - Test creating Sale Invoice with 100 items (performance check)
   - Test creating Debit Note with invoice reference
   - Test add/remove line items
   - Test calculations update in real-time
5. Deploy/demo if ready (this is the MVP!)

### Incremental Delivery

1. **Foundation** (Phase 1 + 2) → Core infrastructure ready
2. **MVP Release** (Phase 3) → Users can create and submit invoices ✅
   - Deploy and gather feedback
3. **Enhanced Validation** (Phase 4) → Better error prevention ✅
   - Deploy improvement
4. **Draft Saving** (Phase 5) → No lost work ✅
   - Deploy improvement
5. **Polish** (Phase 6) → Production-ready ✅

Each increment adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers:

1. **Week 1**: Team completes Setup + Foundational together (critical path)
2. **Week 2**: Once Foundational is done:
   - Developer A: API routes (T018-T019)
   - Developer B: UI components (T020-T023)
   - Developer C: Schema and migrations (if not done in Week 1)
3. **Week 3**: Integration and testing (T024-T029)
4. **Week 4+**: Enhancements (Phase 4 and 5 can proceed in parallel)

---

## Performance Validation Checkpoints

After completing Phase 3, validate these metrics:

- [ ] ✅ Form loads in <1 second (measure with React DevTools)
- [ ] ✅ Calculations update in <100ms with 100 line items (measure with console.time)
- [ ] ✅ Add/remove line items in <50ms (measure with Performance API)
- [ ] ✅ Auto-save completes in <200ms (measure with IndexedDB performance)
- [ ] ✅ No perceivable lag when typing in fields with 100 items
- [ ] ✅ Bundle size <150KB for invoice feature code

If any metric fails, add optimization tasks to Phase 6.

---

## Notes

- [P] tasks = different files, no shared dependencies - can run in parallel
- [Story] label maps task to specific user story for traceability (US1, US2, US3, US4, US5)
- Phase 3 combines US1 + US1b + US2 + US3 because they're interdependent
- Each enhancement phase (4, 5) can be tested and deployed independently
- Avoid: same file conflicts, tasks without file paths, breaking previous stories
- Commit strategy: Commit after each task or logical group (e.g., all parallel tasks in Phase 2)
- Stop at any checkpoint to validate independently before proceeding
