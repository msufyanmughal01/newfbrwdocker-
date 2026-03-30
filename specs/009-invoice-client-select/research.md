# Research: Invoice Client Selector

**Feature**: `009-invoice-client-select`
**Date**: 2026-02-26
**Status**: Complete — no NEEDS CLARIFICATION items remain

---

## Finding 1 — Existing `ClientSearch` Component

**Decision**: Upgrade the existing `ClientSearch` component rather than replace it.

**Rationale**: The component (`src/components/invoices/ClientSearch.tsx`) already handles auto-fill correctly. The two problems are: (1) it requires 2+ characters before fetching, and (2) it is placed inside the Business Name grid cell under a small label. Both are localised changes.

**Evidence from code**:
- `handleInputChange` early-returns when `value.length < 2` → prevents showing clients on open.
- The component is mounted inside `InvoiceHeader.tsx` at line 290, nested inside the Business Name column: `<p className="text-xs text-[var(--foreground-muted)] mb-1">From saved clients:</p>`.
- No browse-mode initial fetch exists.

**Alternatives considered**:
- Replace with a new dropdown component → Rejected: adds complexity with no gain; the existing combobox pattern is correct.
- Add a separate "Select Client" button that opens a modal → Rejected: more complex and breaks existing auto-fill logic.

---

## Finding 2 — `/api/clients` Supports Browsing Without Search

**Decision**: Use `GET /api/clients` (no `q` param) to load all saved clients when the picker opens.

**Rationale**: The existing route (`src/app/api/clients/route.ts`) returns up to 200 clients when `q` is absent, sorted alphabetically — exactly what browse mode needs. No backend changes required.

**Evidence from code** (`src/lib/clients/client-service.ts`):
- `listClients(userId, q?)` — when `q` is omitted, fetches all active clients ordered by `businessName`, limited to 200.
- When `q` is provided (≥2 chars), fetches up to 50 matching clients.

**Alternatives considered**:
- Create a new `/api/clients/browse` endpoint → Rejected: the existing endpoint already handles this case.

---

## Finding 3 — Client-Side Filtering After Initial Load

**Decision**: Load all clients once when picker opens, then filter client-side on subsequent keystrokes.

**Rationale**: Most users have far fewer than 200 saved clients. Filtering 200 records locally is instant. This avoids a network round-trip on every keystroke and aligns with Principle III (Simplicity).

**Alternatives considered**:
- Server-side search on every keystroke (current approach for BuyerSearch) → Rejected for this component: client list is user-owned and bounded; server-side search adds latency with no benefit at this scale.

---

## Finding 4 — Placement in InvoiceHeader

**Decision**: Promote the `ClientSearch` component to a dedicated row above the buyer field grid, styled as a card/well with a clear label.

**Rationale**: Currently buried inside the Business Name grid cell (col 2 of a 2-col grid). A user scanning the "Buyer Information" section never sees a hint that saved clients can be selected. Placing it full-width at the top of the section makes it immediately visible.

**Alternatives considered**:
- Keep existing placement, add a tooltip or hint → Rejected: tooltip does not solve discoverability; the user must find the input first.
- Add a button at the top that reveals the search → Rejected: adds an unnecessary click.

---

## Finding 5 — No Schema or API Changes Required

**Decision**: Zero database or API changes needed for this feature.

**Rationale**: The `/api/clients` endpoint, the `clients` table schema, and all auto-fill field mappings are already correct. The feature is entirely a frontend UX fix.

---

## Summary of Resolved Unknowns

| Unknown | Resolution |
|---------|-----------|
| Does `/api/clients` support browse (no `q`)? | Yes — returns up to 200 clients sorted by name |
| New component or upgrade existing? | Upgrade existing `ClientSearch` |
| Server-side or client-side filtering? | Client-side after initial load |
| Where to place picker in the form? | Full-width row above buyer field grid |
| Any schema or API changes? | None |
