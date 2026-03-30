# API Contracts: FBR API Integration

**Date**: 2026-02-17 | **Branch**: `003-fbr-api-integration`

---

## Our Internal API Routes (Next.js → Browser)

All routes require authentication via Better-Auth session.

---

### POST /api/fbr/validate

Validates an invoice against FBR Validate API without submitting it.

**Request**:
```json
{
  "invoiceData": { /* InvoiceFormData — same schema as POST /api/invoices */ },
  "scenarioId": "SN001"  /* Optional, sandbox only */
}
```

**Response (200 — FBR says Valid)**:
```json
{
  "valid": true,
  "fbrResponse": {
    "statusCode": "00",
    "status": "Valid",
    "invoiceStatuses": [
      { "itemSNo": "1", "statusCode": "00", "status": "Valid" }
    ]
  }
}
```

**Response (200 — FBR says Invalid)**:
```json
{
  "valid": false,
  "errors": [
    {
      "itemSNo": "1",
      "errorCode": "0044",
      "error": "Provide HS Code.",
      "friendlyMessage": "HS Code is required for line item 1. Please enter a valid Harmonized System code.",
      "field": "items.0.hsCode"
    }
  ],
  "fbrResponse": { /* raw FBR response */ }
}
```

**Response (401)**: `{ "error": "Unauthorized" }`
**Response (500)**: `{ "error": "FBR validation failed", "details": "..." }`
**Response (504)**: `{ "error": "FBR API timeout — please retry" }`

---

### POST /api/fbr/submit

Validates then submits an invoice to FBR. Creates FBRSubmission record.

**Request**:
```json
{
  "invoiceId": "existing-invoice-uuid",
  "scenarioId": "SN001"  /* Optional, sandbox only */
}
```

**Response (201 — Issued)**:
```json
{
  "success": true,
  "fbrInvoiceNumber": "7000007DI1747119701593",
  "issuedAt": "2025-05-13T12:01:41Z",
  "submissionId": "submission-uuid"
}
```

**Response (422 — Validation Failed)**:
```json
{
  "success": false,
  "stage": "validation",
  "errors": [ /* same as POST /api/fbr/validate errors */ ]
}
```

**Response (422 — Submission Failed)**:
```json
{
  "success": false,
  "stage": "submission",
  "fbrError": {
    "statusCode": "01",
    "error": "Seller not registered for sales tax"
  }
}
```

---

### GET /api/fbr/reference/provinces

Returns cached province list.

**Response (200)**:
```json
[
  { "stateProvinceCode": 7, "stateProvinceDesc": "PUNJAB" },
  { "stateProvinceCode": 8, "stateProvinceDesc": "SINDH" }
]
```

---

### GET /api/fbr/reference/hs-codes?q={query}

Searches HS codes (minimum 3 chars). Returns cached data.

**Query params**: `q` (string, min 3 chars)

**Response (200)**:
```json
{
  "results": [
    { "hS_CODE": "8517.6200", "description": "Telephonic or telegraphic switching apparatus" }
  ],
  "total": 1,
  "cached": true
}
```

**Response (400)**: `{ "error": "Query must be at least 3 characters" }`

---

### GET /api/fbr/reference/hs-uom?hs_code={code}

Returns approved UOM(s) for a given HS code.

**Response (200)**:
```json
[
  { "uoM_ID": 77, "description": "Square Metre" }
]
```

---

### GET /api/fbr/reference/uom

Returns full UOM list.

**Response (200)**:
```json
[
  { "uoM_ID": 13, "description": "KG" },
  { "uoM_ID": 77, "description": "Square Metre" }
]
```

---

### GET /api/fbr/reference/tax-rates?transTypeId={id}&province={provinceCode}

Returns available tax rates for a transaction type and province.

**Response (200)**:
```json
[
  { "ratE_ID": 734, "ratE_DESC": "18% along with rupees 60 per kilogram", "ratE_VALUE": 18 },
  { "ratE_ID": 280, "ratE_DESC": "0%", "ratE_VALUE": 0 }
]
```

---

### POST /api/fbr/verify-ntn

Verifies buyer NTN/CNIC via STATL API. Results are cached per NTN for 24 hours.

**Request**:
```json
{ "ntnCnic": "0786909" }
```

**Response (200)**:
```json
{
  "ntnCnic": "0786909",
  "statlStatus": "active",
  "registrationType": "Registered",
  "cached": false,
  "checkedAt": "2026-02-17T10:00:00Z"
}
```

**Response (200 — Inactive)**:
```json
{
  "ntnCnic": "0786909",
  "statlStatus": "inactive",
  "registrationType": "Registered",
  "warning": "This NTN is marked inactive in FBR records. Verify before submitting."
}
```

**Response (504 — STATL timeout)**:
```json
{
  "statlStatus": "unknown",
  "warning": "Could not verify NTN — STATL API unavailable. Proceed manually."
}
```

---

### GET /api/buyers?q={query}

Searches buyer registry for autocomplete.

**Query params**: `q` (string, min 2 chars)

**Response (200)**:
```json
{
  "buyers": [
    {
      "id": "buyer-uuid",
      "ntnCnic": "0786909",
      "businessName": "ABC Enterprises",
      "province": "Punjab",
      "address": "123 Main Street, Lahore",
      "registrationType": "Registered",
      "statlStatus": "active",
      "useCount": 12
    }
  ]
}
```

---

## FBR External API Reference (upstream, called by our server)

| Method | URL | Purpose |
|--------|-----|---------|
| POST | `https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata` | Validate invoice (production) |
| POST | `https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata_sb` | Validate invoice (sandbox) |
| POST | `https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata` | Submit invoice (production) |
| POST | `https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb` | Submit invoice (sandbox) |
| GET | `https://gw.fbr.gov.pk/pdi/v1/provinces` | Province list |
| GET | `https://gw.fbr.gov.pk/pdi/v1/doctypecode` | Document types |
| GET | `https://gw.fbr.gov.pk/pdi/v1/itemdesccode` | HS codes |
| GET | `https://gw.fbr.gov.pk/pdi/v1/uom` | Units of measurement |
| GET | `https://gw.fbr.gov.pk/pdi/v2/SaleTypeToRate?date=&transTypeId=&originationSupplier=` | Tax rates |
| GET | `https://gw.fbr.gov.pk/pdi/v1/SroSchedule?rate_id=&date=&origination_supplier_csv=` | SRO schedule |
| GET | `https://gw.fbr.gov.pk/pdi/v2/SROItem?date=&sro_id=` | SRO items |
| GET | `https://gw.fbr.gov.pk/pdi/v1/transtypecode` | Transaction types |
| GET | `https://gw.fbr.gov.pk/pdi/v2/HS_UOM?hs_code=&annexure_id=` | HS code UOM mapping |
| POST | `https://gw.fbr.gov.pk/dist/v1/statl` | NTN active status check |
| POST | `https://gw.fbr.gov.pk/dist/v1/Get_Reg_Type` | NTN registration type |

**Auth Header**: `Authorization: Bearer {FBR_API_TOKEN}`
**Timeout**: 30 seconds for submit/validate; 10 seconds for reference APIs
