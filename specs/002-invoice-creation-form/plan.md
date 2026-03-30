# Implementation Plan: Invoice Creation Form

**Branch**: `002-invoice-creation-form` | **Date**: 2026-02-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-invoice-creation-form/spec.md`

## Summary

The invoice creation form feature enables users to create FBR-compliant Sale Invoices and Debit Notes with up to 100 dynamic line items, real-time tax calculations (updating within 100ms), comprehensive validation against FBR Digital Invoicing API v1.12 specifications, and auto-save draft functionality every 60 seconds. The implementation uses React Hook Form for performant form state management with field arrays, useMemo for calculation optimization, Zod schemas for validation, and IndexedDB for client-side draft persistence with server sync planned for Phase 2.

## Technical Context

**Language/Version**: TypeScript 5.x with Next.js 15 (App Router)
**Primary Dependencies**: React 19, Drizzle ORM 0.45, Better-Auth 1.4, React Hook Form, Zod, IndexedDB (via idb library)
**Storage**: PostgreSQL (Neon serverless) for invoices, IndexedDB for draft persistence
**Testing**: Vitest 4.x for unit/integration tests, Playwright 1.58 for E2E tests
**Target Platform**: Web application (desktop/tablet optimized, Chrome/Edge/Firefox)
**Project Type**: Web application (Next.js full-stack)
**Performance Goals**: <1s initial form load, <100ms calculation updates, <200ms draft save, support 100 line items without lag
**Constraints**: FBR API v1.12 compliance, 2 decimal precision for amounts, 4 decimal for quantities, no backend changes during Phase 1
**Scale/Scope**: 100 line items per invoice, ~50 fields per invoice, indefinite draft retention, multi-organization support

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Clarity Above All ✅
- All FBR field mappings will be explicitly documented in data-model.md
- Calculation logic will be pure functions with clear input/output contracts
- Validation error messages will be specific and actionable
- Form structure will follow existing patterns (client components, API routes)

### Mandatory Consistency ✅
- Schema definitions follow existing Drizzle patterns (see organization-profile.ts)
- API routes follow existing error handling patterns (see organization/profile/route.ts)
- Client components follow existing patterns (see settings-client.tsx)
- Test structure matches existing unit/integration/e2e separation

### The Simplicity Preference ✅
- Use React Hook Form instead of complex state management library
- Single calculation function instead of per-field calculation logic
- Direct IndexedDB instead of complex offline-first framework
- Zod schemas serve dual purpose: validation + TypeScript types

**GATE STATUS**: ✅ PASS - No constitution violations. All patterns align with existing codebase.

## Project Structure

### Documentation (this feature)

```text
specs/002-invoice-creation-form/
├── plan.md              # This file
├── research.md          # Phase 0 research findings
├── data-model.md        # Database schemas and FBR mapping
├── quickstart.md        # Developer setup guide
├── contracts/
│   └── invoice-api.md   # API contracts and Zod schemas
└── tasks.md             # Created by /sp.tasks (NOT in this plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (dashboard)/
│   │   └── invoices/
│   │       ├── new/
│   │       │   └── page.tsx                    # Server Component wrapper
│   │       └── invoice-form-client.tsx         # Main form (Client Component)
│   └── api/
│       └── invoices/
│           ├── route.ts                        # POST (create), GET (list)
│           ├── validate/
│           │   └── route.ts                    # POST (validate before submit)
│           └── drafts/
│               └── route.ts                    # GET, POST, DELETE drafts
├── components/
│   └── invoices/
│       ├── InvoiceHeader.tsx                   # Invoice type, dates, seller/buyer
│       ├── LineItemsTable.tsx                  # Dynamic line items with calculations
│       ├── LineItemRow.tsx                     # Single line item row
│       ├── InvoiceSummary.tsx                  # Totals display
│       └── DraftIndicator.tsx                  # Save status indicator
├── lib/
│   ├── db/
│   │   └── schema/
│   │       └── invoices.ts                     # Invoice, LineItem, Draft schemas
│   ├── invoices/
│   │   ├── calculations.ts                     # Pure calculation functions
│   │   ├── validation.ts                       # Zod schemas
│   │   ├── fbr-mapping.ts                      # Map internal -> FBR format
│   │   ├── fbr-reference-data.ts               # Static FBR reference data
│   │   └── draft-storage.ts                    # IndexedDB operations
│   └── utils.ts                                # Existing utilities (extend if needed)
└── types/
    └── index.ts                                # Extend with Invoice types

tests/
├── unit/
│   └── lib/
│       └── invoices/
│           ├── calculations.test.ts            # Tax calculation tests
│           ├── validation.test.ts              # Zod schema tests
│           └── fbr-mapping.test.ts             # FBR format conversion tests
├── integration/
│   └── api/
│       ├── invoices.test.ts                    # Invoice CRUD tests
│       └── drafts.test.ts                      # Draft persistence tests
└── e2e/
    └── invoice-creation.spec.ts                # Full user flow tests
```

**Structure Decision**: Using Next.js web application structure with App Router. Following existing patterns: dashboard routes under `(dashboard)`, API routes under `api/`, client components in `components/[domain]`, business logic in `lib/[domain]`. This matches the existing authentication and organization patterns.

## Complexity Tracking

No constitution violations. All decisions align with "Simplicity Preference":

| Decision | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|-------------------------------------|
| React Hook Form | Industry-standard library, simpler than custom form state for 100+ fields | Manual state management would require extensive React.memo optimization for performance |
| IndexedDB | Native browser API, simpler than offline-sync framework for draft persistence | localStorage has 5-10MB limit insufficient for 100-item invoices |
| Zod | Already established pattern in Next.js ecosystem, serves validation + type generation | Manual validation would duplicate logic between client/server |
| Calculation memoization | Standard React optimization, necessary for 100-item performance target | Without memoization, every keystroke recalculates all 100 items causing lag |

## Architectural Decisions

### Decision 1: React Hook Form for Form State

**Context**: Need to manage 100+ dynamic form fields with real-time calculations and minimal re-renders.

**Decision**: Use React Hook Form with `useFieldArray` for line items.

**Rationale**:
- Uncontrolled inputs minimize re-renders (critical for performance)
- Built-in field array support (no manual index management)
- Excellent TypeScript support
- Industry standard for complex forms
- Integrates seamlessly with Zod validation

**Alternatives Considered**:
- useReducer: Would require extensive React.memo optimization
- Zustand: Overkill for form-only state
- Formik: Heavier bundle, controlled inputs cause performance issues

**Trade-offs**: Learning curve for `watch()` and `useFieldArray`, but performance benefits outweigh complexity.

---

### Decision 2: IndexedDB for Draft Persistence (Phase 1)

**Context**: Need auto-save every 60 seconds with indefinite retention, no backend API yet.

**Decision**: Use IndexedDB via `idb` library wrapper for client-side draft storage.

**Rationale**:
- No backend dependency (enables parallel development)
- Larger storage quota than localStorage (handles 100 line items)
- Async API (non-blocking)
- Simple migration path to server sync (Phase 2)
- Offline-capable by default

**Alternatives Considered**:
- localStorage: 5-10MB limit insufficient
- Server-only: Blocks development, requires authentication immediately
- Hybrid from start: Overengineering for Phase 1

**Migration Path**: Phase 2 adds server sync; one-time upload of IndexedDB drafts on first login.

---

### Decision 3: Static FBR Reference Data (Phase 1)

**Context**: Need Province, HS Code, Tax Rate, UOM data; no FBR API credentials yet.

**Decision**: Hardcode reference data in `fbr-reference-data.ts` with common values.

**Rationale**:
- Unblocks development (no external API dependency)
- Provinces are static (won't change)
- Tax rates change infrequently
- Can test full validation logic immediately
- Clear migration path to dynamic data (Phase 2)

**Alternatives Considered**:
- Mock API: Overengineering, adds complexity
- Wait for FBR access: Blocks development unnecessarily
- Fetch from public FBR docs: No machine-readable format available

**Phase 2 Migration**: Replace constants with API fetch + cache in PostgreSQL.

## Critical Files for Implementation

The 5 most critical files for implementing this feature:

1. **`src/lib/invoices/validation.ts`** - Core validation logic (Zod schemas) used by both client and server; defines the contract for all invoice data

2. **`src/lib/invoices/calculations.ts`** - Pure calculation functions for tax computations; must be performant and accurate; drives real-time totals

3. **`src/lib/db/schema/invoices.ts`** - Database schema defining invoice and line item structure; determines data model for entire feature

4. **`src/app/(dashboard)/invoices/invoice-form-client.tsx`** - Main form component orchestrating React Hook Form, field arrays, calculations, and auto-save; integrates all other components

5. **`src/components/invoices/LineItemsTable.tsx`** - Dynamic line item management with field arrays; handles 100-item performance requirement; most complex UI component

## Next Steps

After `/sp.plan` completion:
1. Run `/sp.tasks` to generate implementation tasks from this plan
2. Run `/sp.implement` to execute tasks and build the feature
3. Phase 2: Add FBR API submission endpoint
4. Phase 2: Implement server-side draft sync
5. Phase 3: Add invoice listing and search
6. Phase 4: Add PDF generation
