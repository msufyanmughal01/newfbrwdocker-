# ADR-001: Draft Storage Server Migration

> **Scope**: This ADR documents the decision cluster covering draft persistence architecture, IndexedDB removal, and draft lifecycle management — changes that work together as an integrated data strategy.

- **Status:** Accepted
- **Date:** 2026-02-19
- **Feature:** 005-fbr-compliance-platform
- **Context:** The FBR invoicing platform currently maintains two parallel draft persistence systems: (1) client-side IndexedDB via `idb` library (`src/lib/invoices/draft-storage.ts`), which auto-saves form data in the browser and presents a recovery dialog on page load; and (2) server-side PostgreSQL via the `invoices` table with `status = 'draft'`, which powers the `/invoices/drafts` dedicated page. These two systems are unsynchronized. The root cause of the reported "draft popup on New Invoice" bug is the `useEffect` at `invoice-form-client.tsx:104–122`, which calls `listDrafts()` from IndexedDB on every mount and sets `showDraftRecovery = true` whenever any browser-local draft data exists — regardless of the current route or user intent.

<!-- Significance checklist (ALL must be true to justify this ADR)
     1) Impact: Long-term consequence for architecture/platform/security? ✅ YES — determines where user data lives and how durable it is
     2) Alternatives: Multiple viable options considered with tradeoffs? ✅ YES — three approaches evaluated
     3) Scope: Cross-cutting concern (not an isolated detail)? ✅ YES — affects form component, API layer, drafts page, auth context, draft storage module -->

## Decision

Migrate draft storage to server-side PostgreSQL exclusively and remove the IndexedDB draft persistence layer.

- **Draft persistence**: All draft saves go to `POST /api/invoices` with `status: 'draft'` — written to the `invoices` table in Neon PostgreSQL.
- **Draft recovery removed from form**: The `useEffect` that calls `listDrafts()` and triggers `showDraftRecovery` is deleted from `InvoiceFormClient`. The form always initializes clean.
- **IndexedDB dependency**: `src/lib/invoices/draft-storage.ts` and `idb` library remain installed but are no longer called from the invoice form. The file is retained for a transitional period to allow manual data migration if needed.
- **Single source of truth**: The `/invoices/drafts` page (server-rendered from PostgreSQL) is the canonical view of all drafts. No client-side draft state exists outside the active form session.
- **Manual save only**: Users save drafts explicitly via a "Save Draft" button. No browser-local auto-save. Server-side auto-save (debounced PATCH to `/api/invoices/[id]`) is deferred to a future iteration.
- **Draft ID lifecycle**: On new invoice, a draft is created in the DB on first manual save. The draft ID is then held in React state for the active session; on navigation away without saving, no draft record is created.

## Consequences

### Positive

- **Bug fixed**: The draft popup/recovery dialog is eliminated entirely from `/invoices/new` — root cause removed, not patched.
- **Cross-device consistency**: Drafts saved server-side are accessible from any browser, device, or after clearing browser data.
- **Single source of truth**: No synchronization complexity between two stores. The `invoices` table is authoritative.
- **Simpler code**: ~80 lines removed from `InvoiceFormClient`. `showDraftRecovery`, `availableDrafts`, `handleRestoreDraft`, `handleDiscardDrafts` state and all IndexedDB calls are gone.
- **Constitution compliance**: Satisfies Principle IX (Data Integrity) — server-authoritative storage; Principle III (Simplicity) — fewer moving parts.
- **Testability**: Server-side drafts are testable via standard API tests. IndexedDB required browser environment mocks.

### Negative

- **No offline drafts**: If the user loses network connection while creating an invoice, unsaved form data is lost. IndexedDB provided local resilience. Mitigation: browser `beforeunload` warning if form has unsaved changes.
- **Save requires network**: Drafts require an API call. In the current use case (connected web app with Neon serverless), this is acceptable latency.
- **Users with existing IndexedDB drafts lose them silently**: Drafts stored only in IndexedDB (not yet saved to server) will not appear in the Drafts page after this change. Mitigation: one-time informational banner on `/invoices/new` for one release cycle.
- **No auto-save (deferred)**: Removing auto-save from the client side means partially filled forms are only saved when user clicks "Save Draft." Future iteration can implement debounced server-side auto-save via PATCH `/api/invoices/[id]`.

## Alternatives Considered

**Alternative A: Keep IndexedDB, fix only the popup trigger**
- Approach: Add a URL parameter or session flag to suppress `showDraftRecovery` on `/invoices/new`. Continue saving to IndexedDB. Leave the Drafts page pointing to server-side records.
- Why rejected: Treats the symptom, not the cause. The dual-store problem remains; data can still diverge. A user saving a draft on one machine won't see it on another. Violates Principle IX and Principle III.

**Alternative B: Keep both stores, implement bidirectional sync**
- Approach: When IndexedDB has drafts, sync them to server on mount. When server has drafts, cache in IndexedDB for offline access.
- Why rejected: Introduces conflict resolution complexity (which version wins?), race conditions, and more code. The application is not intended for offline use. Violates Principle III (Simplicity): "do not build for imagined future requirements."

**Alternative C: Replace PostgreSQL drafts with IndexedDB as the single source**
- Approach: Remove server-side draft records; use IndexedDB exclusively; make the Drafts page a client-rendered component reading from IndexedDB.
- Why rejected: Breaks cross-device access, violates data durability expectations, incompatible with server-side rendering (Next.js SSR cannot access IndexedDB), and requires client-side auth scoping that is fragile.

## References

- Feature Spec: `specs/005-fbr-compliance-platform/spec.md` (FR-015, FR-016, FR-017, FR-018, FR-019)
- Implementation Plan: `specs/005-fbr-compliance-platform/plan.md` (Phase 1)
- Research: `specs/005-fbr-compliance-platform/research.md` (Decision 1: Draft Storage Architecture)
- Root cause location: `src/app/(dashboard)/invoices/invoice-form-client.tsx:104–122`
- Draft storage module: `src/lib/invoices/draft-storage.ts`
- Related ADRs: ADR-002 (FBR Per-User Token Architecture)
- Evaluator Evidence: `history/prompts/005-fbr-compliance-platform/002-fbr-compliance-platform-architecture-plan.plan.prompt.md`
