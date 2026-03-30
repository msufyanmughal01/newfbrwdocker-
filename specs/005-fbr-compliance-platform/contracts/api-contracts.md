# API Contracts: FBR Compliance Platform

**Branch**: `005-fbr-compliance-platform` | **Date**: 2026-02-19

All endpoints follow Next.js App Router conventions under `src/app/api/`.
All authenticated endpoints require a valid better-auth session cookie.
All responses use `Content-Type: application/json`.
Financial values are strings (decimal serialized from DB) to preserve precision.

---

## Authentication

All endpoints except public auth routes require a valid session.
Sessions are managed by better-auth; token is stored in an HTTP-only cookie.

**Auth error response** (applies to all endpoints):
```json
{ "error": "Unauthorized" }
// HTTP 401
```

---

## HS Code Master

### `GET /api/hs-codes/master`
Returns the authenticated user's pinned HS codes.

**Response 200**:
```json
{
  "codes": [
    {
      "id": "uuid",
      "hsCode": "8517.6200",
      "description": "Smartphones and mobile phones",
      "uom": "Numbers, pieces, units",
      "isActive": true,
      "sortOrder": 0
    }
  ],
  "total": 12
}
```

**Response 200 (empty)**:
```json
{ "codes": [], "total": 0 }
```

---

### `POST /api/hs-codes/master`
Pins an HS code to the user's master list.

**Request body**:
```json
{
  "hsCode": "8517.6200",
  "description": "Smartphones and mobile phones",
  "uom": "Numbers, pieces, units"
}
```

**Validation**:
- `hsCode`: required, pattern `^\d{4}(\.\d{2,4})?$`
- `description`: required, max 500 chars
- `uom`: optional, max 100 chars

**Response 201**:
```json
{ "code": { "id": "uuid", "hsCode": "8517.6200", ... } }
```

**Response 409** (duplicate):
```json
{ "error": "HS code already in master list" }
```

**Response 400** (validation fail):
```json
{ "error": "Validation failed", "details": { "hsCode": "Invalid format" } }
```

---

### `DELETE /api/hs-codes/master/[id]`
Removes an HS code from the master list (soft-disables `is_active = false`).

**Response 200**:
```json
{ "success": true }
```

**Response 404**:
```json
{ "error": "HS code not found" }
```

---

## Business Profile (Extensions to Existing)

### `GET /api/settings/business-profile` *(existing — no change)*
### `PUT /api/settings/business-profile` *(existing — no change)*
### `POST /api/settings/business-profile/logo` *(existing — no change)*

**Gap to close**: Auto-create business profile on user signup via `better-auth` hook (no new API endpoint; internal server-side action).

---

## Clients (Extensions to Existing)

### `GET /api/clients` *(existing — no change)*
Returns active clients for the authenticated user.

### `POST /api/clients` *(existing — no change)*
Creates a new client.

### `PATCH /api/clients/[id]` *(existing — verify immutability is NOT needed; clients can always be edited)*

---

## Invoices (Immutability Guard — New Behavior)

### `PATCH /api/invoices/[id]` — **ADD immutability guard**

**New guard** (add to existing handler):
```
If invoice.status IN ('issued', 'submitting') → 409 Conflict
```

**Response 409** (existing endpoint, new error case):
```json
{
  "error": "Invoice is immutable",
  "code": "INVOICE_IMMUTABLE",
  "status": "issued"
}
```

---

## Drafts (New Behavior on Existing Endpoint)

### `GET /api/invoices?status=draft&from=YYYY-MM-DD&to=YYYY-MM-DD&q=buyer_name`
Extend existing invoices list endpoint with search/filter support.

**Query params** (all optional):
- `status`: filter by status (default: all)
- `from`: invoice_date >= from (YYYY-MM-DD)
- `to`: invoice_date <= to (YYYY-MM-DD)
- `q`: buyer_business_name ILIKE %q% (min 2 chars)
- `limit`: max 100 (default 50)
- `offset`: pagination offset

**Response 200**:
```json
{
  "invoices": [
    {
      "id": "uuid",
      "invoiceType": "Sale Invoice",
      "invoiceDate": "2026-01-15",
      "buyerBusinessName": "ACME Corp",
      "grandTotal": "118000.00",
      "status": "draft",
      "updatedAt": "2026-01-15T10:30:00Z"
    }
  ],
  "total": 5,
  "hasMore": false
}
```

---

## Dashboard Metrics (Extensions to Existing)

### `GET /api/dashboard/metrics?from=YYYY-MM-DD&to=YYYY-MM-DD` *(existing)*

**Verify**: Only include `issued` invoices in metrics (not drafts or failed).
Current implementation may include all statuses — confirm and fix if needed.

---

## FBR Token — Per-User Resolution (Internal Change)

### `POST /api/fbr/submit` — **modify token resolution**

Current: reads `FBR_API_TOKEN` from env for all users.
Required: decrypt `businessProfiles.fbrTokenEncrypted` for the authenticated user.
Fallback: `FBR_API_TOKEN` env var if no user token stored.

No change to request/response shape — this is an internal implementation change.

**Error Response 400** (no FBR token configured):
```json
{
  "error": "FBR token not configured",
  "code": "FBR_TOKEN_MISSING",
  "message": "Please add your FBR token in Business Settings before submitting invoices."
}
```

---

## Error Code Reference

| Code | HTTP | Meaning |
|------|------|---------|
| `INVOICE_IMMUTABLE` | 409 | Invoice status is 'issued' or 'submitting' — no edits allowed |
| `FBR_TOKEN_MISSING` | 400 | User has no FBR token stored in business profile |
| `HS_CODE_DUPLICATE` | 409 | HS code already pinned in user's master list |
| `HS_CODE_NOT_FOUND` | 404 | HS code ID not found or belongs to another user |
| `VALIDATION_FAILED` | 400 | Request body failed schema validation |
| `UNAUTHORIZED` | 401 | No valid session |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Immutability Contract

Submitted invoices (`status = 'issued'`) are immutable. The server enforces this regardless of client state.

```
invariant: invoice.status === 'issued' → no mutations accepted
invariant: invoice.status === 'submitting' → no mutations accepted (in-flight)
```

All mutations return `409 INVOICE_IMMUTABLE` if these invariants are violated.

---

## Data Snapshot Contract

When an invoice is created:
- Seller fields are copied from `business_profiles` at the moment of invoice creation (snapshot).
- Buyer fields are copied from the selected client at the moment of selection (snapshot).
- Neither the business profile nor the client record is modified by invoice creation.
- Subsequent changes to business profile or client do NOT affect existing invoices.

This is the existing behavior — document confirms it must be preserved.
