# Implementation Plan: Invoice Form — Saved Client Selector

**Branch**: `009-invoice-client-select` | **Date**: 2026-02-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/009-invoice-client-select/spec.md`

---

## Summary

The `ClientSearch` component already exists and correctly auto-fills buyer fields, but it is non-discoverable: it requires 2+ characters to show any results (no browse mode) and is buried inside the Business Name grid cell under a small grey label. This plan upgrades the component to load all saved clients on open (browse mode), filter client-side on typing, and relocates it to a prominent full-width position at the top of the Buyer Information section. No API changes and no schema changes are required.

---

## Technical Context

**Language/Version**: TypeScript 5.x, Node 21 (Next.js 15, React 19)
**Primary Dependencies**: react-hook-form, Tailwind CSS (CSS variables), @neondatabase/serverless, better-auth
**Storage**: PostgreSQL (Neon) — existing `clients` table, no changes
**Testing**: Manual integration tests (project has no automated test suite currently)
**Target Platform**: Web browser — Next.js App Router, client component
**Performance Goals**: Client list loads in <500ms; filter response is instant (<16ms, client-side)
**Constraints**: Max 200 saved clients per user (API limit); no new dependencies allowed; no regression to BuyerSearch
**Scale/Scope**: Single component file change + one layout adjustment in InvoiceHeader

---

## Constitution Check

*GATE: Must pass before implementation. Re-checked post-design — all pass.*

| Principle | Gate | Status | Notes |
|-----------|------|--------|-------|
| I. Clarity | Component and prop names clearly describe behaviour | ✅ PASS | No renaming needed; adding `allClients`/`filteredClients` state is self-documenting |
| II. Consistency | Follow existing combobox patterns (matches BuyerSearch structure) | ✅ PASS | Client-side filter follows same pattern as existing `results` state |
| III. Simplicity | Smallest viable change — upgrade existing component, not replace | ✅ PASS | 2 files changed; no new abstractions |
| IV. Purpose-Driven | Every change maps to a spec requirement | ✅ PASS | FR-001→FR-009 all covered; nothing extra added |
| V. Quality | Feature is manually testable end-to-end | ✅ PASS | Quickstart test checklist covers all acceptance scenarios |
| VI. Transparency | Changes are localised and self-explanatory | ✅ PASS | No hidden logic; browse vs search mode is clear in code |
| VII. Scalability | Adding feature requires only modifying the directly relevant files | ✅ PASS | InvoiceHeader and ClientSearch only |
| VIII. Security | API already scoped to authenticated user; no new endpoints | ✅ PASS | No auth changes; existing session check covers this |
| IX. Data Integrity | Read-only feature; no mutations | ✅ PASS | No writes; auto-fill only populates client-side form state |
| X. Testability | Behaviour is testable via manual checklist; component state is isolated | ✅ PASS | All 10 manual test cases defined in quickstart.md |

**No violations. No Complexity Tracking table needed.**

---

## Project Structure

### Documentation (this feature)

```text
specs/009-invoice-client-select/
├── plan.md              ← this file
├── research.md          ← Phase 0 complete
├── data-model.md        ← Phase 1 complete
├── quickstart.md        ← Phase 1 complete
├── contracts/
│   └── client-api.md   ← Phase 1 complete
├── checklists/
│   └── requirements.md ← spec validation (all pass)
└── tasks.md             ← Phase 2 (/sp.tasks — not yet created)
```

### Source Code (affected files only)

```text
src/
└── components/
    └── invoices/
        ├── ClientSearch.tsx      ← PRIMARY CHANGE (browse mode + client-side filter)
        └── InvoiceHeader.tsx     ← LAYOUT CHANGE (relocate ClientSearch)
```

No other source files are modified.

---

## Phase 0: Research — Complete

See [research.md](./research.md). All 5 findings resolved. No unknowns remain.

Key resolutions:
- `/api/clients` (no `q`) returns up to 200 clients sorted alphabetically ✅
- Client-side filtering chosen over server-side for bounded list ✅
- Upgrade existing component, not replace ✅
- Relocate to full-width row above buyer field grid ✅

---

## Phase 1: Design — Complete

### Data Model

See [data-model.md](./data-model.md). **No schema changes.** Existing `clients` table used read-only.

### API Contracts

See [contracts/client-api.md](./contracts/client-api.md). **No new endpoints.** Documents existing `GET /api/clients` usage.

### Component Design

#### `ClientSearch.tsx` — Upgraded Behaviour

**State changes**:

```
allClients: ClientResult[]     — full list from initial API fetch
filteredClients: ClientResult[] — derived from allClients by query filter
isOpen: boolean                — picker visibility
loading: boolean               — initial fetch in progress
error: string | null           — API failure message
query: string                  — current filter text
selectedName: string           — selected client display name
```

**Lifecycle**:

1. On mount: no fetch (list only fetched when picker opens)
2. On picker open (click/focus trigger): fetch `GET /api/clients`, set `allClients`, set `filteredClients = allClients`
3. On query change: `filteredClients = allClients.filter(name.includes(query))` (client-side, instant)
4. On select: auto-fill form fields, close picker, set `selectedName`
5. On clear: reset all state, clear form fields

**Minimum query length**: Removed (was 2; now 0 — all filtering is client-side)

**No 2-char minimum on search**: Once `allClients` is loaded, filtering is local. The `?q=` server search path is no longer needed for this component.

#### `InvoiceHeader.tsx` — Layout Change

**Before**: `ClientSearch` rendered inside the Business Name grid cell (col 2 of 2-col grid), below a `<p>` label.

**After**: `ClientSearch` rendered as a full-width dedicated row at the top of the Buyer Information section, before the registration type radio buttons, with a clear "Select from saved clients" label.

```text
Buyer Information
├── [Full width] Saved Client Selector ← NEW POSITION
├── Registration Type (radio)
├── [Grid 2-col]
│   ├── NTN/CNIC + NTN Verifier
│   ├── Business Name (text input, now without ClientSearch inside)
│   ├── Province (dropdown)
│   └── Address (text input)
└── BuyerSearch (FBR registry) — UNCHANGED, remains in its current position
```

---

## Implementation Steps

### Step 1: Upgrade `ClientSearch.tsx`

File: `src/components/invoices/ClientSearch.tsx`

Changes:
1. Add `allClients` state (full list from API)
2. Add `error` state
3. Add `handleOpen()` function: fetch `GET /api/clients` (no q), set `allClients`
4. Replace `handleInputChange` 2-char guard with client-side filter against `allClients`
5. Add empty state (zero saved clients) with link to `/clients`
6. Add error state display
7. Add a visible trigger button ("Select a saved client ▾") that calls `handleOpen()` on click
8. Keyboard: support Escape to close, Enter to select focused item

### Step 2: Update `InvoiceHeader.tsx`

File: `src/components/invoices/InvoiceHeader.tsx`

Changes:
1. Move `<ClientSearch form={form} />` from inside the Business Name grid cell to a full-width row above the Registration Type radio buttons
2. Remove the `<div className="mb-2">` wrapper and `<p>From saved clients:</p>` label from inside Business Name
3. Add a clear section heading/label for the new position
4. The `BuyerSearch` (FBR registry) placement remains exactly as-is

### Step 3: Manual Verification

Run through all 10 items in quickstart.md test checklist.

---

## Risk Analysis

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| BuyerSearch regresses | Low | BuyerSearch code is not touched; manual test step 8 confirms |
| Province mismatch leaves field blank | Medium | Already handled in existing `handleSelect`; validated in acceptance scenario 4 |
| Large client list (200+) causes UI lag | Very Low | 200 records filtered client-side is <1ms; no issue |
| Initial API fetch fails | Low | Error state added (FR-007 adjacent); user falls back to manual entry |

---

## Definition of Done

- [ ] `ClientSearch` shows full client list on open without any typing
- [ ] Typing filters list client-side with no minimum character requirement
- [ ] Selected client populates all available buyer fields correctly
- [ ] Clear button resets all auto-filled fields
- [ ] Empty state shown with link to Clients page when user has no saved clients
- [ ] Error state shown gracefully if API fails
- [ ] ClientSearch is visible at top of Buyer Information section without scrolling or interaction
- [ ] BuyerSearch (FBR registry) is fully functional and unaffected
- [ ] Keyboard navigation works (open, filter, select, escape)
- [ ] All 10 quickstart manual test cases pass
