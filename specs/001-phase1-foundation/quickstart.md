# Quickstart: Phase 1 — Foundation

**Branch**: `001-phase1-foundation` | **Date**: 2026-02-11

## Prerequisites

- Node.js 20+ (LTS)
- npm 10+
- Git
- A Neon PostgreSQL database (free tier: https://neon.tech)
- A Google Cloud OAuth 2.0 client (for Google sign-in)
- A Resend account (for transactional emails, free tier: https://resend.com)

## Setup Steps

### 1. Clone and Install

```bash
git clone <repo-url>
cd fbrdigitalinvoicingportal
git checkout 001-phase1-foundation
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Fill in the following variables in `.env.local`:

```env
# Application
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=<generate-random-32-char-string>

# Database (Neon)
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require

# Google OAuth
GOOGLE_CLIENT_ID=<from-google-cloud-console>
GOOGLE_CLIENT_SECRET=<from-google-cloud-console>

# Email (Resend)
RESEND_API_KEY=<from-resend-dashboard>
```

### 3. Provision Database

```bash
npm run db:push
```

This pushes the Drizzle schema to your Neon database.

### 4. Seed Database (Optional)

```bash
npm run db:seed
```

Creates demo organizations, users, and role assignments for local development.

### 5. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### 6. Run Tests

```bash
# Unit tests
npx vitest

# E2E tests (requires dev server running)
npx playwright test
```

## Key npm Scripts

| Script          | Command                     | Purpose                          |
|-----------------|-----------------------------|----------------------------------|
| `dev`           | `next dev`                  | Start development server         |
| `build`         | `next build`                | Production build                 |
| `start`         | `next start`                | Start production server          |
| `lint`          | `next lint`                 | Run ESLint                       |
| `typecheck`     | `tsc --noEmit`              | Type check without emitting      |
| `db:push`       | `drizzle-kit push`          | Push schema to database          |
| `db:generate`   | `drizzle-kit generate`      | Generate migration files         |
| `db:migrate`    | `drizzle-kit migrate`       | Apply migration files            |
| `db:seed`       | `tsx src/lib/db/seed.ts`    | Seed database with demo data     |
| `db:studio`     | `drizzle-kit studio`        | Open Drizzle Studio GUI          |
| `test`          | `vitest`                    | Run unit tests                   |
| `test:e2e`      | `playwright test`           | Run E2E tests                    |

## Verification Checklist

After setup, verify:

- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes without errors
- [ ] `npm run typecheck` shows 0 errors
- [ ] `npm run db:push` provisions schema successfully
- [ ] Registration page loads at `/register`
- [ ] Login page loads at `/login`
- [ ] Google OAuth redirects correctly
- [ ] Dashboard is protected (redirects to `/login` when unauthenticated)
