# Implementation Plan: Smart Invoice Platform UX Enhancement

**Feature**: 004-invoice-platform-ux
**Branch**: `004-invoice-platform-ux`
**Date**: 2026-02-17
**Status**: Ready for `/sp.tasks`

---

## Technical Context

| Item | Value |
|------|-------|
| Framework | Next.js 15 (App Router, Server Components) |
| Language | TypeScript (strict) |
| Database | Neon PostgreSQL via Drizzle ORM |
| Auth | better-auth (session cookie, `session.user.id`) |
| Styling | Tailwind CSS v3 |
| Forms | React Hook Form + Zod validation |
| Charts | Recharts (new dependency) |
| File Storage | Local `public/uploads/logos/` (Next.js static serving) |
| Encryption | Node.js `crypto` (AES-256-GCM) — no new packages |
| Existing pattern | Drizzle schema in `src/lib/db/schema/`; API routes in `src/app/api/`; server components fetch DB directly |

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I — Clarity | ✅ | Entities clearly named; `business_profiles`, `clients` not ambiguous |
| II — Consistency | ✅ | Drizzle schema patterns match existing `invoices.ts`, `fbr.ts` |
| III — Simplicity | ✅ | No materialized views, no new UI library beyond Recharts |
| IV — Purpose-driven | ✅ | Every table/endpoint maps to a stated FR |
| V — Quality | ✅ | Zod validation on all mutations; server-side validation |
| VIII — Security | ✅ | FBR token AES-256 encrypted at rest; never returned plain |
| IX — Data Integrity | ✅ | Financial aggregations server-side only; decimal precision |
| X — No Hard Deletes | ✅ | `clients` uses `is_deleted` soft delete |

---

## Architecture Overview

```
src/
├── lib/
│   ├── db/
│   │   └── schema/
│   │       ├── business-profiles.ts   [NEW] business_profiles table
│   │       └── clients.ts             [NEW] clients table
│   ├── settings/
│   │   ├── business-profile.ts        [NEW] DB read/write helpers
│   │   └── encryption.ts             [NEW] AES-256 encrypt/decrypt
│   ├── clients/
│   │   └── client-service.ts         [NEW] CRUD helpers for clients
│   └── analytics/
│       └── dashboard-metrics.ts      [NEW] SQL aggregation functions
├── app/
│   ├── (dashboard)/
│   │   ├── settings/
│   │   │   └── business-profile/
│   │   │       └── page.tsx          [NEW] Business Profile settings page
│   │   ├── clients/
│   │   │   └── page.tsx              [NEW] Client Registry page
│   │   └── invoices/
│   │       ├── drafts/
│   │       │   └── page.tsx          [NEW] Drafts page
│   │       └── new/
│   │           └── page.tsx          [MOD] Fetch sellerProfile from DB
│   └── api/
│       ├── settings/
│       │   └── business-profile/
│       │       ├── route.ts           [NEW] GET + PUT
│       │       └── logo/
│       │           └── route.ts       [NEW] POST (logo upload)
│       ├── clients/
│       │   ├── route.ts              [NEW] GET list + POST create
│       │   └── [id]/
│       │       └── route.ts          [NEW] PUT update + DELETE soft-delete
│       └── dashboard/
│           └── metrics/
│               └── route.ts          [NEW] GET aggregated metrics
├── components/
│   ├── settings/
│   │   └── BusinessProfileForm.tsx   [NEW] Settings form component
│   ├── clients/
│   │   ├── ClientsTable.tsx          [NEW] Clients list with edit/delete
│   │   └── ClientFormModal.tsx       [NEW] Add/edit client modal
│   ├── dashboard/
│   │   ├── MetricCard.tsx            [NEW] Single metric display card
│   │   ├── DateRangePicker.tsx       [NEW] From/To date inputs
│   │   └── RevenueTrendChart.tsx     [NEW] Recharts line/bar chart
│   └── invoices/
│       └── ClientSearch.tsx          [NEW] Buyer search with client registry
public/
└── uploads/
    └── logos/                        [NEW] Logo file storage directory
```

---

## Phase Breakdown

### Phase 1 — Setup & Schema (Foundational)

**Goal**: Database tables and core utilities ready before any UI work.

**Tasks**:
1. Add `recharts` dependency (`npm install recharts`)
2. Create Drizzle schema for `business_profiles` in `src/lib/db/schema/business-profiles.ts`
3. Create Drizzle schema for `clients` in `src/lib/db/schema/clients.ts`
4. Export new schemas from `src/lib/db/schema/index.ts`
5. Generate and run Drizzle migration (`npx drizzle-kit generate && npx drizzle-kit migrate`)
6. Create `public/uploads/logos/` directory with `.gitkeep`
7. Create `src/lib/settings/encryption.ts` — AES-256-GCM `encrypt(text)` and `decrypt(ciphertext)` using `process.env.ENCRYPTION_KEY`
8. Add `ENCRYPTION_KEY` to `.env.example` with generation instructions
9. Create `src/lib/db/schema/index.ts` export additions

---

### Phase 2 — Business Profile (US1)

**Goal**: Settings page + auto-fill on invoice form.

**Data Access**:
- `src/lib/settings/business-profile.ts`: `getBusinessProfile(userId)`, `upsertBusinessProfile(userId, data)`, `updateLogoPath(userId, path)`

**API Routes**:
- `GET /api/settings/business-profile` → returns `{ profile }` scoped to `session.user.id`
- `PUT /api/settings/business-profile` → partial update; encrypts `fbrToken` before storage; returns `{ success, profile }`
- `POST /api/settings/business-profile/logo` → multipart upload; validates type (jpg/png/webp/svg) and size (≤5MB); saves to `public/uploads/logos/{userId}-logo.{ext}`; updates `logo_path`

**UI Components**:
- `BusinessProfileForm.tsx` — controlled form with all profile fields; FBR token shown as masked after save; logo preview from stored path
- `/settings/business-profile/page.tsx` — Server Component; fetches profile via DB; passes to client form

**Invoice Auto-fill**:
- Modify `/invoices/new/page.tsx` (Server Component) to `getBusinessProfile(session.user.id)` and pass as `sellerProfile` prop to `InvoiceFormClient`
- `InvoiceFormClient` uses `sellerProfile` as React Hook Form `defaultValues` for seller fields

**Signup Hook**:
- In the auth signup callback (or via a `useEffect` at first login), call `upsertBusinessProfile(userId, {})` to ensure a blank row exists per user

---

### Phase 3 — Client Registry (US2)

**Goal**: Clients page + buyer search auto-fill in invoice form.

**Data Access**:
- `src/lib/clients/client-service.ts`: `listClients(userId, q?)`, `createClient(userId, data)`, `updateClient(userId, id, data)`, `softDeleteClient(userId, id)`

**API Routes**:
- `GET /api/clients?q=` → searches `business_name` ILIKE `%q%` where `is_deleted = false`; min 2 chars for `q`
- `POST /api/clients` → Zod validation; returns `{ success, client }`
- `PUT /api/clients/[id]` → partial update; 403 if client belongs to another user
- `DELETE /api/clients/[id]` → sets `is_deleted = true`; 403 if not owner

**UI Components**:
- `ClientsTable.tsx` — sortable list with Edit and Delete (soft) actions
- `ClientFormModal.tsx` — modal for add/edit with Zod-backed validation
- `/clients/page.tsx` — Server Component listing active clients; inline "Add Client" trigger
- `ClientSearch.tsx` — combobox replacing the current plain buyer inputs in `InvoiceHeader.tsx`; debounced GET `/api/clients?q=`; selects client and populates buyer fields via `form.setValue`

**Sidebar**: Add "Clients" nav link in `Sidebar.tsx`

---

### Phase 4 — Draft Workflow (US3)

**Goal**: Dedicated Drafts page; clean separation from issued invoices.

**Note**: The `draft` status already exists in `invoiceStatusEnum`. No schema change required.

**UI**:
- `/invoices/drafts/page.tsx` — Server Component; fetches `status = 'draft'` invoices; shows timestamp, Resume, and Delete actions
- Modify `/invoices/page.tsx` — exclude `status = 'draft'`; filter to `status IN ('validating', 'validated', 'submitting', 'issued', 'failed')`
- Delete confirmation modal for draft deletion (hard delete is acceptable for drafts — they were never submitted to FBR)

**Sidebar**: Add "Drafts" nav link in `Sidebar.tsx` between Invoices and Settings

---

### Phase 5 — Analytics Dashboard (US4)

**Goal**: Dashboard home with metric cards + trend chart.

**Data Access**:
- `src/lib/analytics/dashboard-metrics.ts`:
  - `getDashboardMetrics(userId, from, to)` — Drizzle `sum`, `count` aggregation on `invoices` where `status = 'issued'` and `invoice_date BETWEEN from AND to`
  - `getRevenueTrend(userId, from, to)` — groups by week or month based on range length

**API Route**:
- `GET /api/dashboard/metrics?from=YYYY-MM-DD&to=YYYY-MM-DD`
- Validates `from ≤ to`; returns `{ metrics, trendData, dateRange }`

**UI Components**:
- `MetricCard.tsx` — glassmorphism card showing label, value, and optional subvalue
- `DateRangePicker.tsx` — two `<input type="date">` fields with validation; fires `onChange` callback
- `RevenueTrendChart.tsx` — Recharts `LineChart` or `BarChart`; marks as `'use client'`
- Modify `/dashboard/page.tsx` — replace placeholder with `DateRangePicker` + 4 `MetricCard` instances + `RevenueTrendChart`; default range = current month

---

### Phase 6 — Modern UI Design System (US5)

**Goal**: Consistent glassmorphism design across all pages.

**Pattern**:
- Card base: `bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg rounded-xl`
- Button primary: `bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors`
- Input base: `border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent`
- Page wrapper: `min-h-screen bg-gradient-to-br from-slate-50 to-blue-50`

**Scope of changes**:
- Dashboard page: apply card style to metric cards; gradient page background
- Invoices list and drafts pages: consistent table card wrapper
- Settings page: card wrapper for form
- Clients page: card wrapper for table
- `Sidebar.tsx`: ensure active state uses consistent highlight style
- Responsive: all pages verified at 768px breakpoint; use `sm:` Tailwind prefixes as needed

---

## Key Dependencies Between Phases

```
Phase 1 (Schema) → Phase 2 (Business Profile) → Phase 4 (Draft UI, minor)
Phase 1 (Schema) → Phase 3 (Client Registry)
Phase 2 (Seller Auto-fill) → must complete before Phase 5 (dashboard uses same page shell)
Phase 3 (Clients) → Phase 4 (draft resume restores buyer from form state, not registry)
All data phases (2–4) → Phase 5 (Analytics uses existing invoice data)
All functional phases (2–5) → Phase 6 (UI layer applied last)
```

---

## New Dependencies

| Package | Version | Reason |
|---------|---------|--------|
| `recharts` | latest | Revenue trend chart in analytics dashboard |

No other new packages required. All other capabilities use existing Next.js, Drizzle, Zod, and Node.js built-ins.

---

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `ENCRYPTION_KEY` | AES-256 key for FBR token encryption (32-byte hex) | Yes (new) |
| `DATABASE_URL` | Existing — unchanged | Yes |
| `BETTER_AUTH_SECRET` | Existing — unchanged | Yes |

Generate `ENCRYPTION_KEY`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Drizzle Migration Notes

Two new tables via `npx drizzle-kit generate && npx drizzle-kit migrate`:

1. `business_profiles` — 1:1 with `users`; blank row created at signup
2. `clients` — 1:N with `users`; soft-delete via `is_deleted`

No changes to existing `invoices`, `line_items`, `fbr_submissions`, or `buyer_registry` tables.

---

## File Path Index (All New/Modified Files)

**New Schema Files:**
- `src/lib/db/schema/business-profiles.ts`
- `src/lib/db/schema/clients.ts`

**New Service Files:**
- `src/lib/settings/business-profile.ts`
- `src/lib/settings/encryption.ts`
- `src/lib/clients/client-service.ts`
- `src/lib/analytics/dashboard-metrics.ts`

**New API Routes:**
- `src/app/api/settings/business-profile/route.ts`
- `src/app/api/settings/business-profile/logo/route.ts`
- `src/app/api/clients/route.ts`
- `src/app/api/clients/[id]/route.ts`
- `src/app/api/dashboard/metrics/route.ts`

**New Pages:**
- `src/app/(dashboard)/settings/business-profile/page.tsx`
- `src/app/(dashboard)/clients/page.tsx`
- `src/app/(dashboard)/invoices/drafts/page.tsx`

**New Components:**
- `src/components/settings/BusinessProfileForm.tsx`
- `src/components/clients/ClientsTable.tsx`
- `src/components/clients/ClientFormModal.tsx`
- `src/components/dashboard/MetricCard.tsx`
- `src/components/dashboard/DateRangePicker.tsx`
- `src/components/dashboard/RevenueTrendChart.tsx`
- `src/components/invoices/ClientSearch.tsx`

**Modified Files:**
- `src/lib/db/schema/index.ts` — export new schemas
- `src/app/(dashboard)/invoices/new/page.tsx` — fetch and pass `sellerProfile`
- `src/app/(dashboard)/invoices/page.tsx` — exclude drafts from list
- `src/app/(dashboard)/dashboard/page.tsx` — analytics dashboard UI
- `src/components/dashboard/Sidebar.tsx` — add Clients + Drafts nav links
- `src/components/invoices/InvoiceHeader.tsx` — use `ClientSearch` + accept `sellerProfile` defaults
- `.env.example` — add `ENCRYPTION_KEY`
- `public/uploads/logos/.gitkeep` — ensure directory is tracked

---

## Implementation Strategy

**MVP Scope (minimum to demo US1 + US2):**
- Phase 1 (Schema) + Phase 2 (Business Profile auto-fill) + Phase 3 (Client search)
- These two features together eliminate the main repetitive-entry bottleneck

**Incremental delivery:**
- Phase 4 (Drafts) is independently testable after Phase 1
- Phase 5 (Analytics) requires Phase 1 only; reads existing `invoices` table
- Phase 6 (UI) is last; applies visual layer without touching business logic

**Risk: Migration on live database**
- Use `IF NOT EXISTS` guards in raw migration SQL or rely on Drizzle's safe migration output
- Keep backups before running migration on production

---

*Generated by `/sp.plan` — proceed to `/sp.tasks` to produce the actionable task list.*
