# Quickstart: FBR Compliance Platform

**Branch**: `005-fbr-compliance-platform` | **Date**: 2026-02-19

---

## Prerequisites

- Node.js 20+
- Neon PostgreSQL account (or local Postgres with PgBouncer)
- FBR API access (sandbox token from FBR registration portal)

---

## Environment Setup

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Required
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
BETTER_AUTH_SECRET=<32-byte hex from: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000

# FBR Integration
FBR_API_TOKEN=<bearer token from FBR portal>
FBR_ENV=sandbox

# FBR Token Encryption (encrypts user-stored FBR tokens in DB)
ENCRYPTION_KEY=<32-byte hex from: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

---

## Install & Run

```bash
npm install
npm run db:push        # Apply schema to Neon DB
npm run db:seed        # Optional: seed reference data
npm run dev            # Start dev server on http://localhost:3000
```

---

## Database Migrations (This Feature)

After pulling this feature branch, run:

```bash
npm run db:push        # Pushes the new hs_code_master table
```

Or generate + run SQL migration explicitly:

```bash
npm run db:generate    # Generates migration SQL
npm run db:migrate     # Applies migration
```

**New table**: `hs_code_master` — user-pinned HS codes for instant access.

---

## Development Workflow

### Phase-by-Phase Execution Order

1. **Phase 1** — Fix draft popup (10 min): Remove `useEffect` draft recovery from `invoice-form-client.tsx`. Run `npm test` to verify no regressions.

2. **Phase 2** — Business profile auto-create at signup: Add `user.create.after` hook in `src/lib/auth.ts`. Test by creating a new user.

3. **Phase 3** — HS Code Master table: Run `npm run db:push`. Test `/api/hs-codes/master` CRUD.

4. **Phase 4** — Draft page search/filter: Convert `DraftsPage` to server shell + `DraftsClient` component.

5. **Phase 5** — Immutability guard: Add status check to `PATCH /api/invoices/[id]`. Test with an issued invoice.

6. **Phase 6** — FBR per-user token: Update `src/lib/fbr/api-client.ts` to accept userId and decrypt profile token.

7. **Phase 7** — UI modernization: Apply design tokens to dashboard, then invoice form, then settings.

8. **Phase 8** — Testing: Run full Vitest + Playwright suite.

---

## Running Tests

```bash
# Unit tests
npm test

# Unit tests with coverage
npm test -- --coverage

# E2E tests (requires running dev server)
npm run dev &
npm run test:e2e

# Type check
npm run typecheck
```

---

## Key File Locations

| Area | File |
|------|------|
| Business profile service | `src/lib/settings/business-profile.ts` |
| FBR token encryption | `src/lib/settings/encryption.ts` |
| FBR API client | `src/lib/fbr/api-client.ts` |
| Auth config (signup hook) | `src/lib/auth.ts` |
| Invoice form (draft popup bug) | `src/app/(dashboard)/invoices/invoice-form-client.tsx` |
| Draft page | `src/app/(dashboard)/invoices/drafts/page.tsx` |
| Dashboard | `src/app/(dashboard)/dashboard/DashboardContent.tsx` |
| DB Schema directory | `src/lib/db/schema/` |
| New HS master schema | `src/lib/db/schema/hs-code-master.ts` *(to be created)* |
| New HS master API | `src/app/api/hs-codes/master/route.ts` *(to be created)* |
| HS master API [id] | `src/app/api/hs-codes/master/[id]/route.ts` *(to be created)* |

---

## Common Commands

```bash
# Inspect database (Drizzle Studio)
npm run db:studio

# Check TypeScript errors
npm run typecheck

# Lint
npm run lint

# Generate Drizzle migration for new schema changes
npm run db:generate

# Create a test user
node create-test-user.mjs
```

---

## Troubleshooting

**Draft popup still appears**: Check `invoice-form-client.tsx` — the `useEffect` calling `listDrafts` must be removed or disabled. IndexedDB data from previous sessions may persist; clear browser IndexedDB manually or use `clearAllDrafts()` from `draft-storage.ts`.

**FBR submission fails with token error**: Verify `FBR_API_TOKEN` in `.env.local`. If using per-user tokens, ensure the user has set their FBR token in Business Settings and that `ENCRYPTION_KEY` is set.

**Business profile not auto-created**: Check `src/lib/auth.ts` for the `databaseHooks.user.create.after` callback. Ensure it calls `upsertBusinessProfile`.

**HS master table not found**: Run `npm run db:push` after pulling this branch.
