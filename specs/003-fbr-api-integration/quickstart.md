# Developer Quickstart: FBR API Integration

**Branch**: `003-fbr-api-integration` | **Date**: 2026-02-17

---

## Prerequisites

- `002-invoice-creation-form` branch fully implemented and working
- Node.js 18+ and npm
- PostgreSQL (Neon) database with existing invoices schema
- FBR Bearer token from PRAL (for live testing)

---

## Environment Variables

Add to `.env.local`:

```bash
# FBR API Configuration
FBR_API_TOKEN=your-bearer-token-from-pral
FBR_ENV=sandbox   # or "production"

# Existing vars (already set)
DATABASE_URL=your-neon-connection-string
BETTER_AUTH_SECRET=your-auth-secret
```

**CRITICAL**: `FBR_API_TOKEN` must NEVER be in client-side code, committed to git, or logged.

---

## Install New Dependencies

```bash
npm install react-qr-code
npm install qrcode
npm install @types/qrcode --save-dev
```

---

## Database Migration

After adding new schema files:

```bash
npm run db:generate   # Generate migration from schema changes
npm run db:push       # Apply to Neon database
```

New tables created:
- `fbr_submissions`
- `fbr_reference_cache`
- `buyer_registry`

Modified table:
- `invoices` (adds: `fbr_invoice_number`, `fbr_submission_id`, `invoice_status`, `issued_at`)

---

## Testing with FBR Sandbox

### Step 1: Pre-populate Reference Data Cache

```bash
# Hit the reference data endpoint to seed cache
curl http://localhost:3000/api/fbr/reference/provinces
curl http://localhost:3000/api/fbr/reference/hs-codes?q=0101
```

### Step 2: Test Validate API (Sandbox)

Set `FBR_ENV=sandbox` in `.env.local`, then use scenario SN001 (standard rate, registered buyer).

The form shows a "Scenario ID" dropdown in sandbox mode.

### Step 3: Test Full Submission Flow

1. Navigate to `/dashboard/invoices/new`
2. Fill all required fields
3. Select Scenario: SN001
4. Click "Validate & Submit"
5. Watch status progress: Validating → Validated → Submitting → Issued
6. Verify FBR invoice number displayed (22 digits for NTN)

### Step 4: Test Print

1. Navigate to `/dashboard/invoices/{id}`
2. Click "Print Invoice"
3. Verify QR code appears (1.0 × 1.0 inch in print preview)
4. Verify FBR logo appears
5. Verify no navigation/buttons in print view

---

## Sandbox Test Scenarios (Quick Reference)

| Scenario | Description | Required Fields |
|----------|-------------|-----------------|
| SN001 | Standard rate, registered buyer | Rate: 18%, Buyer: Registered |
| SN002 | Standard rate, unregistered buyer | Rate: 18%, Buyer: Unregistered |
| SN003 | Steel (melted/re-rolled) | Sale Type: Steel Melting |
| SN005 | Reduced rate | Rate: 5%, Value < 20,000 |
| SN006 | Exempt goods | Rate: 0%, Sale Type: Exempt |
| SN007 | Zero rated | Rate: 0%, Sale Type: Zero-rate |
| SN008 | 3rd schedule | Sale Type: 3rd Schedule Goods |
| SN017 | FED in ST mode (goods) | Sale Type: Goods (FED in ST Mode) |
| SN019 | Services | Sale Type: Services |

---

## Key File Locations

```
src/
├── lib/fbr/
│   ├── api-client.ts          ← FBR HTTP client (Bearer token, env switching)
│   ├── validate.ts            ← Call FBR validate API
│   ├── post-invoice.ts        ← Call FBR post API
│   ├── error-codes.ts         ← 100+ error code → user message map
│   ├── scenarios.ts           ← SN001-SN028 scenario config
│   └── reference/
│       ├── cache.ts           ← DB cache read/write with TTL
│       ├── provinces.ts       ← /pdi/v1/provinces
│       ├── hs-codes.ts        ← /pdi/v1/itemdesccode + search
│       ├── uom.ts             ← /pdi/v1/uom
│       ├── hs-uom.ts          ← /pdi/v2/HS_UOM
│       ├── tax-rates.ts       ← /pdi/v2/SaleTypeToRate
│       └── statl.ts           ← /dist/v1/statl + Get_Reg_Type
├── app/api/fbr/
│   ├── validate/route.ts      ← POST /api/fbr/validate
│   ├── submit/route.ts        ← POST /api/fbr/submit
│   ├── verify-ntn/route.ts    ← POST /api/fbr/verify-ntn
│   └── reference/
│       ├── provinces/route.ts
│       ├── hs-codes/route.ts
│       ├── hs-uom/route.ts
│       ├── uom/route.ts
│       └── tax-rates/route.ts
├── components/invoices/
│   ├── HSCodeSearch.tsx       ← Searchable HS code input
│   ├── BuyerSearch.tsx        ← Buyer autocomplete
│   ├── NTNVerifier.tsx        ← NTN verification status badge
│   ├── SubmissionStatus.tsx   ← Animated submission progress
│   ├── FBRErrorDisplay.tsx    ← Error code display with field mapping
│   ├── InvoicePrint.tsx       ← Print layout
│   └── QRCode.tsx             ← QR code component (1.0×1.0 inch)
└── app/(dashboard)/invoices/
    └── [id]/
        └── print/page.tsx     ← Print page route
```

---

## FBR Error Code Quick Lookup

| Code | Description | Field |
|------|-------------|-------|
| 0001 | Seller not registered | sellerNTNCNIC |
| 0002 | Invalid buyer NTN/CNIC | buyerNTNCNIC |
| 0003 | Invalid invoice type | invoiceType |
| 0018 | HS Code required | items[n].hsCode |
| 0019 | Rate required | items[n].rate |
| 0020 | Sales value required | items[n].valueSalesExcludingST |
| 0026 | Invoice ref required (debit note) | invoiceRefNo |
| 0044 | HS Code empty | items[n].hsCode |
| 0046 | Rate empty | items[n].rate |
| 0401 | Invalid seller token | FBR_API_TOKEN |
| 0402 | Invalid buyer token | buyerNTNCNIC |

Full catalog: `src/lib/fbr/error-codes.ts`
