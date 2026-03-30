# Research: Smart Invoice Platform UX Enhancement

**Feature**: 004-invoice-platform-ux
**Date**: 2026-02-17

---

## Decision 1: Business Profile Logo Storage

**Decision**: Store uploaded logo as a file path reference in the database; files saved to a local `/public/uploads/logos/` directory served by Next.js static file serving.

**Rationale**: The project is a single-tenant SaaS portal without cloud storage configured. Next.js's `public/` directory is the simplest zero-dependency approach. The logo is only used for invoice printing, so file size and CDN concerns are minimal. Cloud storage (S3/Cloudinary) would require new credentials and infrastructure not in scope.

**Alternatives considered**:
- Store as base64 blob in the database — rejected (inflates DB, slows queries)
- Cloud object storage (S3, Cloudinary) — rejected (out of scope, adds new dependencies)
- Local `/public/uploads/` — chosen (simple, works with Next.js, no new deps)

**Constraint**: Files are scoped by userId in the path (`/uploads/logos/{userId}-logo.{ext}`) to prevent collisions.

---

## Decision 2: FBR Token Storage

**Decision**: Store the FBR API token encrypted at rest in the `business_profiles` table using a server-side AES-256 encryption key from `process.env.ENCRYPTION_KEY`. The token is never returned to the client after save — only a masked indicator ("••••••••" + last 4 chars) is shown.

**Rationale**: FBR tokens have 5-year validity and are equivalent to API credentials. Storing them plaintext in the database violates Constitution Principle VIII (Security Is Not Optional). A symmetric encryption approach with a server-held key is appropriate for a single-tenant system without a dedicated secrets manager.

**Alternatives considered**:
- Store plaintext in DB — rejected (constitution violation, security risk)
- Store as environment variable per user — rejected (not feasible for multi-user, defeats purpose of per-user profiles)
- Dedicated secrets manager (AWS Secrets Manager, HashiCorp Vault) — rejected (infrastructure complexity out of scope)
- Server-side AES-256 encryption — chosen (reasonable security, no new infrastructure)

**Implementation note**: `ENCRYPTION_KEY` must be a 32-byte hex string in `.env.local`. The same key from feature 003 `FBR_API_TOKEN` env var can coexist — the business profile token supersedes it at runtime when present.

---

## Decision 3: Analytics Aggregation Strategy

**Decision**: Compute dashboard metrics on-demand via a single SQL query with date-range filters using Drizzle ORM's aggregate functions (`sum`, `count`). No materialized views or caching layer.

**Rationale**: Invoice volumes for a single-user invoicing portal are expected to be in the hundreds to low thousands — well within range for live aggregation on Neon's serverless PostgreSQL. Materialized views add complexity (Constitution Principle III: Simplicity Over Complexity) and are premature optimization at this scale.

**Alternatives considered**:
- Materialized views — rejected (premature optimization, complexity)
- Separate analytics events table — rejected (duplication, unnecessary)
- Live SQL aggregation — chosen (simple, correct, sufficient for scale)

---

## Decision 4: Chart Library

**Decision**: Use **Recharts** (already a common choice in Next.js ecosystems, lightweight, React-first, SVG-based).

**Rationale**: Recharts is widely adopted, tree-shakeable, and renders server-side safely. It requires no canvas and works with Next.js's React Server Components pattern. It will be added as a new dependency (`npm install recharts`).

**Alternatives considered**:
- Chart.js — rejected (canvas-based, requires DOM access, SSR complications)
- Victory — rejected (less active maintenance)
- D3 directly — rejected (too low-level, excessive for bar/line charts)
- Recharts — chosen (React-native, lightweight, SSR-safe)

---

## Decision 5: Client Registry vs Buyer Registry (Separation)

**Decision**: Maintain two separate registries:
- `clients` table — user-managed, explicitly saved by the user (from Clients page or invoice form prompt)
- `buyer_registry` table — auto-managed, populated after FBR submission (exists from 003)

**Rationale**: Clients are intentional master data; buyer_registry is an automated cache. Merging them would cause confusion (Constitution Principle I: Clarity Above All) and create edit/delete conflicts. Users should not need to worry that editing a client record affects the FBR submission history.

---

## Decision 6: Design System Approach

**Decision**: Extend existing Tailwind CSS utility classes with a small set of shared component patterns (card base class, consistent button variants, form label/input styles). No new UI component library dependency.

**Rationale**: The project already uses Tailwind CSS. Adding shadcn/ui or similar would introduce a large new dependency and require migrating existing components (Constitution Principle II: Consistency Is Mandatory). A thin set of Tailwind utility composites achieves the "modern futuristic" look (glassmorphism via `backdrop-blur`, `bg-white/70`, gradient borders) without new deps.

**Glassmorphism recipe**: `bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg rounded-xl`

---

## Decision 7: Draft Invoice Page vs Filter

**Decision**: Implement the Drafts page as a filtered view of the existing `/invoices` route using query param `?status=draft`, plus a separate `/invoices/drafts` route as a named page for sidebar navigation.

**Rationale**: Reusing the invoice list infrastructure (same DB query, same table) is simpler than a separate data source. The visual separation (dedicated route with "Drafts" title) satisfies the UX requirement while the implementation reuses existing patterns.

---

## Decision 8: Business Profile Auto-fill Mechanism

**Decision**: Server component on `/invoices/new` fetches the business profile and passes it as props to the invoice form client component. The form pre-populates seller fields from these props as `defaultValues`.

**Rationale**: Server-side fetch avoids a client-side API call waterfall on form load (better UX). `defaultValues` in React Hook Form is the correct pattern for pre-populated editable fields. No separate API call needed at form load.

---

## Constitution Alignment

| Principle | Alignment |
|-----------|-----------|
| I — Clarity | All entities named clearly: `business_profiles`, `clients`, not `profiles` or `orgs` |
| II — Consistency | Drizzle schema patterns identical to existing invoices/fbr schemas |
| III — Simplicity | No materialized views, no new UI library, live SQL aggregation |
| IV — Purpose-driven | Every table and endpoint maps to a stated FR |
| V — Quality | Server-side validation on all mutations, Zod schemas for all inputs |
| VIII — Security | FBR token encrypted at rest; tokens never returned to client |
| IX — Data Integrity | Financial aggregations server-side only; BigDecimal precision for currency |
| X — Testability | Pure aggregation functions testable in isolation |

**No constitution violations detected.**
