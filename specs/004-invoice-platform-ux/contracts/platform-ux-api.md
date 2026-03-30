# API Contracts: Smart Invoice Platform UX Enhancement

**Feature**: 004-invoice-platform-ux
**Date**: 2026-02-17

All endpoints require authentication. Responses scoped to `session.user.id`. All monetary values returned as decimal strings.

---

## Business Profile

### GET /api/settings/business-profile

Returns the authenticated user's business profile.

**Response 200**:
```json
{
  "profile": {
    "id": "uuid",
    "businessName": "Acme Industries",
    "ntnCnic": "0786909",
    "province": "Punjab",
    "address": "123 Main Street, Lahore",
    "logoPath": "/uploads/logos/user123-logo.png",
    "hasFbrToken": true,
    "fbrTokenHint": "••••a7b3",
    "updatedAt": "2026-02-17T10:00:00Z"
  }
}
```

**Response 404**: `{ "error": "Profile not found" }` (should not occur after signup flow)

---

### PUT /api/settings/business-profile

Update the business profile. Partial update — only provided fields are modified.

**Request Body**:
```json
{
  "businessName": "Acme Industries",
  "ntnCnic": "0786909",
  "province": "Punjab",
  "address": "123 Main Street, Lahore",
  "fbrToken": "eyJ..."
}
```

**Validation**:
- `ntnCnic`: optional; if provided, must be 7 or 13 digits
- `fbrToken`: optional; if provided, encrypted before storage; plain value never stored
- `province`: optional; must be a valid FBR province string

**Response 200**:
```json
{
  "success": true,
  "profile": { ... }
}
```

---

### POST /api/settings/business-profile/logo

Upload business logo. Multipart form data.

**Request**: `multipart/form-data` with field `logo` (image file, max 5MB, types: jpg/png/webp/svg)

**Response 200**:
```json
{
  "success": true,
  "logoPath": "/uploads/logos/user123-logo.png"
}
```

**Response 400**: `{ "error": "Invalid file type" }` | `{ "error": "File exceeds 5MB limit" }`

---

## Clients

### GET /api/clients

List all active clients for the authenticated user.

**Query params**: `q` (optional, search by businessName, min 2 chars)

**Response 200**:
```json
{
  "clients": [
    {
      "id": "uuid",
      "businessName": "Beta Corp",
      "ntnCnic": "1234567",
      "province": "Sindh",
      "address": "456 Trade Ave",
      "registrationType": "Registered",
      "notes": null,
      "createdAt": "2026-01-10T00:00:00Z"
    }
  ]
}
```

---

### POST /api/clients

Create a new client record.

**Request Body**:
```json
{
  "businessName": "Beta Corp",
  "ntnCnic": "1234567",
  "province": "Sindh",
  "address": "456 Trade Ave",
  "registrationType": "Registered",
  "notes": "Primary client for electronics"
}
```

**Validation**:
- `businessName`: required, 1–255 chars
- `ntnCnic`: optional, 7 or 13 digits if provided
- `registrationType`: optional, 'Registered' | 'Unregistered'

**Response 201**: `{ "success": true, "client": { ... } }`

**Response 400**: `{ "error": "Validation failed", "details": [...] }`

---

### PUT /api/clients/[id]

Update an existing client. Full or partial update.

**Request Body**: Same shape as POST, all fields optional.

**Response 200**: `{ "success": true, "client": { ... } }`

**Response 404**: `{ "error": "Client not found" }`

**Response 403**: `{ "error": "Forbidden" }` (client belongs to another user)

---

### DELETE /api/clients/[id]

Soft-delete a client (sets `is_deleted = true`).

**Response 200**: `{ "success": true }`

**Response 404**: `{ "error": "Client not found" }`

---

## Dashboard Analytics

### GET /api/dashboard/metrics

Returns aggregated invoice metrics for a date range.

**Query params**:
- `from`: required, ISO date string (YYYY-MM-DD)
- `to`: required, ISO date string (YYYY-MM-DD)

**Response 200**:
```json
{
  "metrics": {
    "totalInvoices": 12,
    "totalRevenue": "450000.00",
    "totalSalesTax": "81000.00",
    "revenueExcludingSalesTax": "369000.00"
  },
  "trendData": [
    { "date": "2026-02-01", "invoiceCount": 3, "revenue": "120000.00" },
    { "date": "2026-02-08", "invoiceCount": 4, "revenue": "160000.00" }
  ],
  "dateRange": { "from": "2026-02-01", "to": "2026-02-17" }
}
```

**Response 400**: `{ "error": "'from' date must be before 'to' date" }`

**Notes**:
- Only `issued` invoices are counted
- `trendData` groups by week if range ≤ 90 days, by month if range > 90 days
- All monetary values are decimal strings (never floats)

---

## Invoices (extensions to existing API)

### GET /api/invoices?status=draft

Already exists. Returns invoices filtered by status. The Drafts page calls this with `status=draft`; the main Invoices page excludes `draft` by passing `status=issued,failed,submitting,validated,validating`.

No schema change needed.

---

## Seller Auto-Fill (Server Component, Not API)

The `/invoices/new` page is a **Next.js Server Component** that:
1. Fetches `business_profiles` for `session.user.id`
2. Passes profile as `sellerProfile` prop to `InvoiceFormClient`
3. `InvoiceFormClient` uses profile fields as `defaultValues` for seller fields

No separate API endpoint — this is a server-side data fetch at page render.

---

## Error Response Format (all endpoints)

```json
{
  "error": "Human-readable error message",
  "details": [ { "field": "ntnCnic", "message": "Must be 7 or 13 digits" } ]
}
```

`details` is optional and present only for validation errors.
