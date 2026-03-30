# Quickstart: Invoice Client Selector

**Feature**: `009-invoice-client-select`
**Date**: 2026-02-26

---

## What This Feature Does

Upgrades the saved client picker in the Create Invoice form so users can browse and select from their saved clients without typing anything first. Previously the picker required 2+ characters to show any results and was visually hidden inside the Business Name field.

---

## Files to Change

| File | Change |
|------|--------|
| `src/components/invoices/ClientSearch.tsx` | Core upgrade: browse mode, no minimum chars, client-side filtering |
| `src/components/invoices/InvoiceHeader.tsx` | Relocate `ClientSearch` to prominent position above buyer field grid |

**No other files need to change.** No API changes, no schema changes.

---

## Key Behaviour Changes

### Before (current)
- User must type 2+ characters to see any saved clients
- Picker is hidden under tiny "From saved clients:" label inside Business Name column
- No initial list shown

### After (target)
- Picker shows full client list as soon as it opens (no typing required)
- Picker is placed prominently at the top of the Buyer Information section (full-width)
- Typing filters the already-loaded list client-side (instant, no network request)
- Error state shown if initial API load fails

---

## Running Locally

```bash
# No migrations needed
# No new environment variables
# Start dev server as usual
npm run dev
```

Navigate to `/invoices/new` → scroll to "Buyer Information" → the client selector should now appear prominently at the top of that section.

---

## Testing the Feature

### Manual Test Checklist

1. [ ] Create at least one saved client on the Clients page
2. [ ] Navigate to Create Invoice (`/invoices/new`)
3. [ ] Scroll to "Buyer Information" section
4. [ ] Click the client picker — full list appears without typing
5. [ ] Type a partial name — list filters instantly
6. [ ] Select a client — all buyer fields populate correctly
7. [ ] Click "Clear" — all fields reset to blank
8. [ ] Verify the FBR buyer registry search (BuyerSearch) still works
9. [ ] Test with zero saved clients — empty state with link to Clients page is shown
10. [ ] Test keyboard navigation: Tab to open, arrow keys to navigate, Enter to select, Escape to close

### Acceptance Criteria (from spec)

- **SC-001**: Buyer fields populated in <5 seconds, zero manual typing
- **SC-002**: Picker visible without prior user action
- **SC-003**: All non-empty client fields correctly propagated
- **SC-004**: 50+ clients filterable within 3 keystrokes
- **SC-005**: BuyerSearch unaffected

---

## Architecture Decision

No new patterns introduced. This feature:
- Uses the existing combobox UI pattern (same as BuyerSearch)
- Uses the existing `/api/clients` endpoint
- Uses `form.setValue()` for auto-fill (same as current implementation)
- Filters client-side (simpler and faster for bounded client lists ≤200)

Constitution compliance: Principles I (Clarity), II (Consistency), III (Simplicity), IV (Purpose-driven) all satisfied. No violations.
