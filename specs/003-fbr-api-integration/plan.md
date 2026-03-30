# Implementation Plan: FBR API Integration & End-to-End Invoice Submission

**Branch**: `003-fbr-api-integration` | **Date**: 2026-02-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-fbr-api-integration/spec.md`

## Summary

This feature completes the FBR Digital Invoicing compliance loop by adding: a server-side FBR API client (Bearer token secured), live reference data APIs with PostgreSQL caching, STATL buyer NTN verification, HS code search with UOM auto-population, buyer registry autocomplete, a 100+ error code catalog with per-field mapping, scenario-based tax rules (SN001–SN028), a complete invoice status lifecycle (draft → issued), and QR code + FBR logo print layout. All FBR API calls are server-side only. Builds on the existing `002-invoice-creation-form` invoice form, Zod schemas, and database schema.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 15 (App Router)
**Primary Dependencies**: React 19, Drizzle ORM 0.45, Better-Auth 1.4, react-qr-code, qrcode, existing invoice form dependencies
**Storage**: PostgreSQL (Neon serverless) — new tables: fbr_submissions, fbr_reference_cache, buyer_registry; extended: invoices
**Testing**: Vitest 4.x for unit tests (error code catalog, scenario rules, status machine), Playwright for E2E
**Target Platform**: Web application (desktop/tablet, Chrome/Edge/Firefox)
**Project Type**: Web application (Next.js full-stack)
**Performance Goals**: FBR submit flow <60 seconds end-to-end; HS code search <500ms; NTN verify <5 seconds; reference data load <2 seconds
**Constraints**: FBR Bearer token server-side only; issued invoices immutable; all money calculations server-side; 30s FBR API timeout
**Scale/Scope**: Same org scale as existing feature; ~15 FBR API endpoints integrated; 100+ error codes; 28 sandbox scenarios

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Clarity Above All ✅
- FBR error codes mapped to plain-English messages with field references — no raw code shown to users
- Invoice status lifecycle documented with explicit transitions — no ambiguous intermediate states
- Server/client boundary explicit: `src/lib/fbr/` = server-only; `src/components/invoices/` = client-safe

### II. Consistency Is Mandatory ✅
- New API routes follow existing pattern: `src/app/api/[domain]/route.ts`
- New DB schema follows existing Drizzle pattern (see `src/lib/db/schema/invoices.ts`)
- New components follow existing pattern in `src/components/invoices/`

### III. Simplicity Over Complexity ✅
- PostgreSQL cache instead of Redis (same infrastructure, simpler)
- Static TypeScript Map for error codes instead of DB table
- react-qr-code (SVG) instead of canvas/server-rendered PNG

### IV. Purpose-Driven Development ✅
- Every file maps to a specific FBR API or spec requirement
- No speculative features; QR code format is exactly as FBR mandates

### V. Quality Cannot Be Compromised ✅
- Error code catalog must be unit tested (100% coverage)
- Status machine transitions must be tested
- FBR API client must be tested with mocked responses

### VIII. Security Is Not Optional ✅ CRITICAL
- `FBR_API_TOKEN` in `.env` only, accessed via `process.env` in server routes
- All FBR calls through server-side API routes — token never in client bundle
- Auth check on every `/api/fbr/*` route before forwarding to FBR

### IX. Data Integrity Above Convenience ✅ CRITICAL
- All tax calculations confirmed on server before FBR submission
- `issued` invoice status is immutable — no UPDATE allowed after reaching this state
- FBR invoice number stored atomically with status change in DB transaction

### X. Testability Is a Requirement ✅
- FBR API client accepts base URL as parameter → easy to mock in tests
- Error code catalog is pure data → trivially testable
- Scenario rules are pure functions → unit testable without server

**GATE STATUS**: ✅ PASS — No constitution violations. All patterns align with existing codebase and FBR spec requirements.

## Project Structure

### Documentation (this feature)

```text
specs/003-fbr-api-integration/
├── plan.md              # This file
├── research.md          # Phase 0 research findings
├── data-model.md        # DB schemas and FBR type definitions
├── quickstart.md        # Developer setup guide
├── contracts/
│   └── fbr-integration-api.md  # Internal API contracts + FBR API reference
└── tasks.md             # Created by /sp.tasks (NOT in this plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (dashboard)/
│   │   └── invoices/
│   │       ├── [id]/
│   │       │   ├── page.tsx                    # Invoice detail page
│   │       │   └── print/
│   │       │       └── page.tsx                # Print page (QR + FBR logo)
│   │       ├── new/
│   │       │   └── page.tsx                    # Existing (extend for submission)
│   │       └── invoice-form-client.tsx         # Existing (extend for FBR submit flow)
│   └── api/
│       ├── fbr/
│       │   ├── validate/route.ts               # POST — validate via FBR
│       │   ├── submit/route.ts                 # POST — validate + post to FBR
│       │   ├── verify-ntn/route.ts             # POST — STATL NTN check
│       │   └── reference/
│       │       ├── provinces/route.ts           # GET — provinces (cached)
│       │       ├── hs-codes/route.ts            # GET — HS code search (cached)
│       │       ├── hs-uom/route.ts              # GET — HS code → UOM (cached)
│       │       ├── uom/route.ts                 # GET — all UOMs (cached)
│       │       └── tax-rates/route.ts           # GET — tax rates by params (cached)
│       └── buyers/route.ts                     # GET — buyer registry search
├── components/
│   └── invoices/
│       ├── HSCodeSearch.tsx                    # Searchable HS code dropdown
│       ├── BuyerSearch.tsx                     # Buyer autocomplete
│       ├── NTNVerifier.tsx                     # NTN status badge (STATL)
│       ├── SubmissionStatus.tsx                # Animated submission progress
│       ├── FBRErrorDisplay.tsx                 # FBR error list with field mapping
│       ├── InvoicePrint.tsx                    # Print-optimized invoice layout
│       └── QRCode.tsx                          # QR code component (1.0×1.0 inch)
└── lib/
    ├── fbr/
    │   ├── api-client.ts                       # HTTP client with Bearer token
    │   ├── validate.ts                         # FBR Validate API caller
    │   ├── post-invoice.ts                     # FBR Post API caller
    │   ├── error-codes.ts                      # 100+ error code catalog
    │   ├── scenarios.ts                        # SN001-SN028 scenario config
    │   ├── status-machine.ts                   # Invoice status transitions
    │   └── reference/
    │       ├── cache.ts                        # DB cache read/write with TTL
    │       ├── provinces.ts                    # Province reference data
    │       ├── hs-codes.ts                     # HS code reference + search
    │       ├── uom.ts                          # UOM reference data
    │       ├── hs-uom.ts                       # HS code → UOM lookup
    │       ├── tax-rates.ts                    # Tax rate reference data
    │       └── statl.ts                        # STATL + Get_Reg_Type callers
    ├── db/
    │   └── schema/
    │       └── fbr.ts                          # fbr_submissions, fbr_reference_cache, buyer_registry
    └── invoices/
        ├── validation.ts                       # Existing (no change)
        ├── calculations.ts                     # Existing + scenario-based rules
        └── fbr-mapping.ts                      # Existing (minor extension)

tests/
├── unit/
│   └── lib/fbr/
│       ├── error-codes.test.ts                 # All 100+ codes have messages
│       ├── scenarios.test.ts                   # Scenario config completeness
│       ├── status-machine.test.ts              # Valid/invalid transitions
│       └── reference/
│           └── cache.test.ts                   # TTL logic
└── e2e/
    └── fbr-submission.spec.ts                  # Full sandbox submission flow
```

## Complexity Tracking

| Decision | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|--------------------------------------|
| Server-side FBR proxy routes | Bearer token must not reach browser | Client-side fetch would expose token in DevTools |
| PostgreSQL reference cache | Reference data changes infrequently; same DB already in use | Redis adds infrastructure cost and complexity |
| Static error code TypeScript Map | 100+ codes, never change mid-runtime | DB table adds query overhead for static data |
| react-qr-code (SVG) | Native React, no canvas dependency, print-safe SVG | Server PNG generation adds round-trip for static content |
| Status machine with transition guards | Issued invoices must be immutable (Constitution IX) | Simple status column without guards allows invalid state changes |

## Architectural Decisions

### Decision 1: Server-Side-Only FBR API Client

**Context**: FBR Bearer token has 5-year org-level validity. Must be secured.

**Decision**: All FBR API calls go through Next.js API routes. Client components call our own `/api/fbr/*` routes. Our routes inject the Bearer token from `process.env.FBR_API_TOKEN` and forward to FBR.

**Rationale**:
- Token never appears in browser network tab
- Centralised error normalization, logging, timeout handling
- Easy to add rate limiting, retries, circuit breaker in one place
- Constitution VIII: "Secrets MUST NOT appear in client-side code"

**Trade-offs**: Adds one network hop vs. direct client call. Acceptable given security requirement.

---

### Decision 2: PostgreSQL JSONB Cache for FBR Reference Data

**Context**: 12 FBR reference APIs, data changes infrequently, existing Neon PostgreSQL in use.

**Decision**: `fbr_reference_cache` table with `(cache_key, payload JSONB, expires_at)`. Upsert on re-fetch.

**Rationale**:
- Provinces won't change; HS codes change quarterly; tax rates change hourly at most
- Same infrastructure already in use — no new services
- JSONB supports the semi-structured array responses from all 12 FBR APIs
- Auditable: `fetched_at` shows when data was last refreshed

**Migration path**: If volume grows, replace with Redis without changing consumer code (cache.ts is the only interface).

---

### Decision 3: QR Code with react-qr-code (SVG)

**Context**: FBR mandates QR version 2.0, 25×25 modules, 1.0×1.0 inch printed.

**Decision**: Use `react-qr-code` library in the print layout. Set `size` to 96px at 96 DPI = 1.0 inch. Use `level="M"` error correction. Verify the invoice number (22-28 chars) fits within version 2 capacity.

**Version 2 capacity**: At level M, version 2 can encode up to 20 alphanumeric characters. The FBR invoice number is 22 characters — requires version 3 (29×29). **Mitigation**: Use `minVersion={2}` prop and let library auto-select minimum required version. Print size remains 1.0×1.0 inch regardless.

**Rationale**: SVG scales perfectly for print, no pixelation. Client-side generation means no server round-trip for QR.

---

### Decision 4: FBR Error Code Static Catalog

**Context**: 100+ error codes across Sales (0001-0402) and Purchase (0156-0177) categories.

**Decision**: TypeScript `Record<string, ErrorEntry>` in `src/lib/fbr/error-codes.ts`. Each entry has: `code`, `userMessage`, `fieldPath` (maps to form field), `severity`.

**Field mapping example**:
```typescript
'0044': {
  code: '0044',
  userMessage: 'HS Code is required. Please enter a valid Harmonized System code.',
  fieldPath: 'items[n].hsCode',  // n = itemSNo - 1
  severity: 'error'
}
```

**Rationale**: Zero runtime overhead (no DB query), fully unit testable, easy to update when FBR releases new codes.

---

## Critical Files for Implementation

1. **`src/lib/fbr/api-client.ts`** — The foundation for all FBR communication. Handles auth, env switching, timeouts, and error normalization. All other FBR modules depend on this.

2. **`src/lib/fbr/error-codes.ts`** — Maps all 100+ FBR error codes to user-friendly messages and form field paths. Critical for the validation error display experience.

3. **`src/lib/db/schema/fbr.ts`** — Defines the three new DB tables. Must be created and migrated before any FBR routes can run.

4. **`src/app/api/fbr/submit/route.ts`** — Orchestrates the full validate → post → store flow. The core of the end-to-end submission experience.

5. **`src/components/invoices/InvoicePrint.tsx`** — The print layout with QR code and FBR logo. The final deliverable that makes invoices legally usable.

## Next Steps

After `/sp.plan` completion:
1. Run `/sp.tasks` to generate implementation tasks from this plan
2. Run `/sp.implement` to execute tasks and build the feature
3. Test with FBR Sandbox using scenario SN001 first
4. After sandbox validation, test with Production token (from PRAL)
