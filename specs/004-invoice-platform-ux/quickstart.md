# Quickstart: Smart Invoice Platform UX Enhancement

**Feature**: 004-invoice-platform-ux
**Date**: 2026-02-17

This document describes integration scenarios and manual test flows for validating each user story end-to-end after implementation.

---

## Prerequisites

- Dev server running: `npm run dev`
- Valid database connection (`DATABASE_URL` set in `.env.local`)
- At least one user account created via `/sign-up`
- `ENCRYPTION_KEY` (32-byte hex) set in `.env.local` for FBR token encryption

---

## US1 — Business Profile Auto-Fill

### Scenario A: First-time profile setup

1. Sign in as a new user (no profile configured yet)
2. Navigate to `/settings/business-profile`
3. Verify: page shows an empty form with fields for Business Name, NTN/CNIC, Province, Address, Logo, and FBR Token
4. Fill in all fields; set FBR Token to any test string (e.g. `TEST-TOKEN-001`)
5. Click Save
6. Verify: success toast appears; FBR Token field now shows masked value (`••••0001`)

### Scenario B: Auto-fill on new invoice

1. After completing Scenario A, navigate to `/invoices/new`
2. Verify: Seller Business Name, NTN, Province, and Address are pre-populated from the saved profile
3. Seller fields must be editable — change the Business Name to "Override Co."
4. Submit the invoice (or save as draft)
5. Navigate back to `/settings/business-profile`
6. Verify: Business Name still shows the original saved value (not "Override Co.")

### Scenario C: Profile update reflects on next invoice

1. Navigate to `/settings/business-profile` and change the Province
2. Open `/invoices/new`
3. Verify: Seller Province shows the newly updated value

---

## US2 — Client Registry & Buyer Auto-Fill

### Scenario A: Add a client via the Clients page

1. Navigate to `/clients`
2. Click "Add Client"
3. Fill: Business Name = "Apex Trading Co.", NTN = "7654321", Province = "Punjab", Registration Type = "Registered"
4. Save
5. Verify: client appears in the list on the Clients page

### Scenario B: Buyer auto-fill in invoice form

1. Navigate to `/invoices/new`
2. In the Buyer section, type "Apex" in the buyer search field
3. Verify: dropdown appears with "Apex Trading Co." listed
4. Select the client
5. Verify: Buyer Business Name, NTN, Province, Address, and Registration Type are all populated

### Scenario C: Edit client and verify invoice reflects update

1. Navigate to `/clients`, edit "Apex Trading Co." — change NTN to "1111111"
2. Open `/invoices/new`, search and select "Apex Trading Co."
3. Verify: NTN field shows "1111111"

### Scenario D: Delete client (soft delete)

1. On `/clients`, delete "Apex Trading Co."
2. Verify: client disappears from the client list
3. Open `/invoices/new`, type "Apex" in buyer search
4. Verify: "Apex Trading Co." no longer appears in search results

---

## US3 — Draft Invoice Workflow

### Scenario A: Save a draft and verify isolation

1. Navigate to `/invoices/new`, fill partial details (leave line items incomplete)
2. Click "Save as Draft"
3. Navigate to `/invoices/drafts`
4. Verify: draft appears with a timestamp and "Resume" button
5. Navigate to `/invoices` (submitted/issued list)
6. Verify: the draft does NOT appear in this list

### Scenario B: Resume and complete a draft

1. From `/invoices/drafts`, click "Resume" on the saved draft
2. Verify: all previously entered fields are restored exactly
3. Complete the invoice and submit to FBR
4. Verify: invoice moves to `/invoices` list with `issued` or `failed` status
5. Navigate to `/invoices/drafts`
6. Verify: the draft no longer appears

### Scenario C: Delete a draft

1. From `/invoices/drafts`, click "Delete" on a draft
2. Confirm deletion prompt
3. Verify: draft disappears; it also does not appear in `/invoices`

---

## US4 — Analytics Dashboard

### Scenario A: Metric cards update with date range

1. Ensure at least 2 issued invoices exist on different dates
2. Navigate to `/dashboard`
3. Set date range to include only one invoice's date
4. Verify: Total Invoices = 1; Revenue = that invoice's grand total
5. Expand range to include both invoices
6. Verify: Total Invoices = 2; Revenue updates accordingly

### Scenario B: Empty state

1. Set date range to a period with no invoices (e.g., last year)
2. Verify: all metric cards show 0; chart shows empty state message

### Scenario C: Accuracy check

1. Note the grand total and tax amount from two specific issued invoices
2. Set date range to include exactly those two invoices
3. Verify dashboard: Total Revenue = sum of grand totals; Sales Tax = sum of tax amounts

---

## US5 — Design System

### Scenario A: Visual consistency check

1. Open each page: `/dashboard`, `/invoices/new`, `/invoices`, `/invoices/drafts`, `/settings/business-profile`, `/clients`
2. Verify: all pages use identical card styles (`bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg rounded-xl`)
3. Verify: button styles, font sizes, and spacing are consistent across pages

### Scenario B: Tablet viewport

1. Open browser DevTools, set viewport to 768px wide
2. Navigate each major page
3. Verify: no horizontal scroll; all content fits within viewport; touch targets are at least 44px

---

## API Smoke Tests (curl)

```bash
# Business Profile - GET
curl -s http://localhost:3000/api/settings/business-profile \
  -H "Cookie: <session-cookie>" | jq .

# Business Profile - PUT
curl -s -X PUT http://localhost:3000/api/settings/business-profile \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{"businessName":"Test Co","ntnCnic":"1234567","province":"Punjab","address":"123 Main St"}' | jq .

# Clients - POST
curl -s -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{"businessName":"Beta Corp","ntnCnic":"7654321","province":"Sindh","registrationType":"Registered"}' | jq .

# Clients - GET with search
curl -s "http://localhost:3000/api/clients?q=Beta" \
  -H "Cookie: <session-cookie>" | jq .

# Dashboard Metrics
curl -s "http://localhost:3000/api/dashboard/metrics?from=2026-02-01&to=2026-02-17" \
  -H "Cookie: <session-cookie>" | jq .
```

---

## Known Constraints

- Logo upload stores files in `public/uploads/logos/` — ensure this directory exists and is writable
- FBR token encryption requires `ENCRYPTION_KEY` env var (32-byte hex string)
- Dashboard only aggregates invoices with `status = 'issued'`; drafts and failed invoices are excluded
- Client search requires minimum 2 characters to fire
