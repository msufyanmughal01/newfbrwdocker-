# Research: FBR API Integration & End-to-End Invoice Submission

**Phase 0 Output** | **Date**: 2026-02-17 | **Feature**: 003-fbr-api-integration

---

## Decision 1: QR Code Library

**Decision**: Use `qrcode` (npm package) for server-side QR generation, rendered as SVG or PNG via `<canvas>` in the browser using `react-qr-code` for display.

**Rationale**: `qrcode` is the most mature Node.js QR library, supports version specification (version 2 = 25×25 modules), error correction levels, and outputs to PNG/SVG/buffer. `react-qr-code` wraps SVG generation for React without a canvas dependency, which is lighter for client rendering. Neither requires a server to render the QR on the print page since the invoice number is available client-side.

**Alternatives considered**:
- `qr.js` — older, unmaintained, no version control
- `node-qrcode` — same as `qrcode` (different name, same package)
- Server-side PNG generation via API route — unnecessary complexity when SVG renders fine in print

**Implementation**: `react-qr-code` for the print layout component. Pass `level="M"` (error correction), `size={96}` pixels at 96 DPI = 1 inch. Version auto-selected; verify result is ≤ version 2 (25×25) for the invoice number length (~22-28 chars).

---

## Decision 2: PostgreSQL-Based Reference Data Cache (No Redis)

**Decision**: Store cached FBR reference data in a `fbr_reference_cache` table with `data_type` (text), `payload` (JSONB), `fetched_at` (timestamp), `expires_at` (timestamp) columns. Check `expires_at` on each request; if stale, re-fetch and update row.

**Rationale**: The existing stack uses Neon PostgreSQL with Drizzle ORM. Adding Redis would introduce a new infrastructure dependency for data that changes infrequently (provinces never change, HS codes change quarterly). JSONB in Postgres supports the semi-structured reference data perfectly. A single-row-per-type pattern with upsert on re-fetch is simple, auditable, and consistent with the existing data layer.

**Alternatives considered**:
- Redis — overkill for infrequently changing data; adds infrastructure cost
- In-memory Node.js cache — lost on server restart/deploy (Neon serverless)
- Next.js `unstable_cache` / `revalidatePath` — suitable but less portable and harder to inspect

**TTL Strategy**:
- Provinces: 7 days (static, change requires FBR announcement)
- HS Codes: 24 hours (change quarterly in practice)
- UOMs: 24 hours
- Tax Rates (SaleTypeToRate): 1 hour (can change with SRO notifications)
- SRO data: 1 hour
- Transaction Types / Doc Types: 24 hours

---

## Decision 3: Server-Side-Only FBR API Proxy Pattern

**Decision**: All FBR API calls go through Next.js API routes under `src/app/api/fbr/`. Client components call our own routes; our routes add the Bearer token from `process.env.FBR_API_TOKEN` and forward to FBR. The token never reaches the browser.

**Rationale**: FBR Bearer tokens have 5-year validity and are organization-level credentials. Exposing them in client-side network calls would allow any user to extract the token and call FBR APIs directly, potentially submitting fraudulent invoices. Server-side proxy is the only compliant pattern. This also allows centralized error normalization, logging, and rate limiting.

**Architecture**:
```
Browser → POST /api/fbr/validate → (server adds Bearer token) → FBR Validate API
Browser → POST /api/fbr/submit  → (server adds Bearer token) → FBR Post API
Browser → GET  /api/fbr/hs-codes?q=  → (server checks cache) → FBR itemdesccode OR cache
```

**Alternatives considered**:
- Direct client-side fetch to FBR — rejected (token exposure)
- Server Actions — viable but harder to test and less transparent for API calls
- Edge Functions — adds latency for Pakistani FBR servers; standard Node.js route is simpler

---

## Decision 4: STATL NTN Verification Debounce + Cache

**Decision**: Debounce the blur event with 500ms delay. Cache STATL results in the `buyer_registry` table per NTN (column: `statl_status`, `statl_checked_at`). Re-verify only if last check was >24 hours ago or if user clicks a "Re-verify" button.

**Rationale**: STATL API is an external dependency with unknown rate limits. Calling it on every keystroke would cause: (a) excessive API calls, (b) poor UX with flickering. Blur-event with debounce means one call per NTN entry. DB caching means repeat buyers are verified instantly from cache without any FBR call.

**Alternatives considered**:
- Verify on form submit only — too late; user already filled all fields
- Real-time keypress verification — too many API calls, poor UX
- Manual "Verify" button only — requires user action; auto-verify on blur is better UX

---

## Decision 5: FBR Scenario Handling

**Decision**: Store scenario rules as a configuration object in `src/lib/fbr/scenarios.ts`. Each scenario maps to: sale type, required fields, tax calculation variant, and validation rules. The form selects a scenario (sandbox only) from a dropdown driven by this config.

**Rationale**: There are 28 sandbox scenarios (SN001-SN028). Hardcoding scenario logic in UI components would scatter business rules. A central config allows: (a) unit testing scenario rules in isolation, (b) adding new scenarios without touching UI code, (c) clean mapping to FBR's `scenarioId` field.

**In Production**: `scenarioId` field is omitted from the request (FBR production API does not require it). The scenario selection UI is hidden in production mode.

---

## Decision 6: FBR Error Code Catalog

**Decision**: Store all 100+ FBR error codes (Sales: 0001-0402, Purchase: 0156-0177) as a TypeScript `Map<string, ErrorEntry>` in `src/lib/fbr/error-codes.ts`. Each entry has: `code`, `field` (which form field it maps to), `message` (user-friendly), `severity` (error/warning).

**Rationale**: Error codes are stable (change only with FBR API version updates). A TypeScript Map provides O(1) lookup, type safety, and easy unit testing. Storing as a static file means no DB queries for error display and easy updates when FBR releases new codes.

**Alternatives considered**:
- DB table for error codes — unnecessary overhead for static data
- Inline error strings in API response handler — unTestable, scattered

---

## Decision 7: Invoice Status State Machine

**Decision**: Implement as a TypeScript enum/union type in `src/lib/invoices/status.ts` with allowed transitions enforced at the API route level. DB stores current status as an enum column.

**Status transitions**:
```
draft → validating → validated → submitting → issued
                  ↘ failed (validation failed)
                                            ↘ failed (submission failed)
```

**Rationale**: Enforcing transitions at the API layer prevents: (a) re-submitting already-issued invoices, (b) skipping validation. Constitution Principle IX: "Records that have reached a final state MUST be immutable" — `issued` status invoices cannot be modified.

---

## Resolved Unknowns Summary

| Unknown | Decision |
|---------|----------|
| QR library | react-qr-code (SVG, client) |
| Reference cache | PostgreSQL JSONB with TTL |
| FBR token security | Server-side proxy routes only |
| STATL debounce | Blur + 500ms debounce + 24h DB cache |
| Scenario rules | Central config file (scenarios.ts) |
| Error codes | Static TypeScript Map |
| Invoice status | Enum with enforced transitions |
