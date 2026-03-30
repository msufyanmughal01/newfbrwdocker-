# API Contracts: TaxDigital Platform Overhaul

**Branch**: `011-homepage-admin-bulk` | **Date**: 2026-03-25

---

## Modified Endpoints

### POST /api/admin/create-user-secret

**Change**: Accept `password` in request body instead of generating it server-side.

**Request**:
```json
{
  "name": "string (required, trimmed)",
  "email": "string (required, lowercased + trimmed)",
  "password": "string (required, min 8 chars)",
  "adminKey": "string (must match ADMIN_SECRET_KEY env var)"
}
```

**Response 200**:
```json
{
  "success": true,
  "credentials": {
    "name": "string",
    "email": "string",
    "password": "string (the password passed in)"
  }
}
```

**Errors**:
- `401` — adminKey mismatch
- `400` — name/email empty, or password < 8 chars
- `500` — better-auth signUpEmail failed

---

### POST /api/bulk-invoices/upload (modified)

**Change**: Add `.xlsx` and `.xls` support via the `xlsx` library. Keep existing CSV support unchanged.

**Request**: `multipart/form-data` with `file` field (`.csv`, `.xlsx`, or `.xls`).

**Response 200** (unchanged shape):
```json
{
  "success": true,
  "batchId": "uuid",
  "totalRows": 10,
  "validRows": 8,
  "invalidRows": 2,
  "rows": [ /* InvoiceRow[] */ ]
}
```

**Errors**: `400` — no file, unsupported format, empty, > 500 rows; `401` — unauthenticated; `500` — parse error.

---

### POST /api/bulk-invoices/submit (modified)

**Change**: Filter to `rows.filter(r => r.valid && r.ntnVerified === true)` instead of `rows.filter(r => r.valid)`.

**Request** (unchanged):
```json
{ "batchId": "uuid" }
```

**Response 200** (unchanged shape):
```json
{
  "success": true,
  "batchId": "uuid",
  "submittedCount": 5,
  "failedCount": 1,
  "totalProcessed": 6
}
```

---

## New Endpoints

### POST /api/bulk-invoices/verify-ntns

**Purpose**: Verify each unique `buyerNTNCNIC` in field-valid rows against FBR STATL API. Updates batch `rows` and `status` in database.

**Request**:
```json
{ "batchId": "uuid" }
```

**Response 200**:
```json
{
  "success": true,
  "readyCount": 5,
  "ntnFailedCount": 2,
  "rows": [ /* InvoiceRow[] with ntnVerified/ntnMessage added */ ]
}
```

**Errors**: `400` — batchId missing; `401` — unauthenticated; `404` — batch not found or not owned by user.

**Internal NTN call** (per unique NTN):
```
POST /api/fbr/verify-ntn
Body: { "ntnCnic": "<buyerNTNCNIC value>" }
Response: { statlStatus: "active" | "inactive" | "unknown", ... }
Verified = statlStatus === "active"
```

---

## Unchanged Endpoints (verified, no change needed)

- `POST /api/bulk-invoices/submit` — shape unchanged (filter logic only changes)
- `POST /api/fbr/verify-ntn` — no change, used as dependency
- `GET /api/admin/delete-user-secret` — no change
- All `src/app/api/auth/` routes — never touched per core rule
