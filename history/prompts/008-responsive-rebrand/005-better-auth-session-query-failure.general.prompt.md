---
id: 005
title: Better Auth Session Query Failure Debug
stage: general
date: 2026-02-26
surface: agent
model: claude-sonnet-4-6
feature: 008-responsive-rebrand
branch: 008-responsive-rebrand
user: System Inn
command: chat
labels: ["debugging","better-auth","drizzle","neon","session","organization-plugin"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/middleware.ts
  - src/lib/auth-edge.ts
  - src/lib/auth.ts
  - src/lib/db/index.ts
  - src/lib/db/schema/auth.ts
  - drizzle/0002_p0_security_fixes.sql
tests:
  - none run
---

## Prompt

why this error is occuring "2026-02-26T12:00:02.432Z ERROR [Better Auth]: INTERNAL_SERVER_ERROR Error: Failed query: select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id" from "session" where "session"."token" = $1
params: 7YlCDaHwxYSkTbEPycbY11bRMhS63cmv
    at async middleware (src\middleware.ts:10:15)
   8 |   let session = null;
   9 |   try {
> 10 |     session = await auth.api.getSession({
     |               ^
  11 |       headers: request.headers,
  12 |     });
  13 |   } catch (error) { {
  query: 'select "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id" from "session" where "session"."token" = $1',
  params: [ '7YlCDaHwxYSkTbEPycbY11bRMhS63cmv' ]
}
Session validation error: APIError: Failed to get session {
  status: 'INTERNAL_SERVER_ERROR',
  body: { code: 'FAILED_TO_GET_SESSION', message: 'Failed to get session' },
  headers: {},
  statusCode: 500
}

## Response snapshot

Root cause analysis identified two compounding problems:

1. **Missing `activeOrganizationId` column** — The `organization` plugin is enabled in `auth-edge.ts` and `auth.ts`, but the Drizzle schema for the `session` table (`src/lib/db/schema/auth.ts`) does not include the `activeOrganizationId` column. Better Auth's organization plugin extends sessions to track the active org and will fail if this column is absent from the actual database.

Fix: Add `activeOrganizationId: text("active_organization_id")` to the session table schema, then run `npx drizzle-kit push`.

2. **Edge Runtime + Pool (secondary)** — The middleware runs in Next.js Edge Runtime while `db/index.ts` uses a `Pool` with Node.js-style pool options. The underlying DB error is being swallowed by Better Auth's wrapper, making diagnosis harder.

Diagnosis steps recommended:
- Check Neon console → Tables → session for presence of `active_organization_id` column
- Run `npx drizzle-kit push` to sync schema
- Verify `.env.local` has correct `DATABASE_URL`

## Outcome

- ✅ Impact: Identified missing schema column as primary cause; no code changes made (diagnosis only)
- 🧪 Tests: none run
- 📁 Files: read-only investigation across auth, db, schema, and migration files
- 🔁 Next prompts: Apply schema fix and confirm error resolves
- 🧠 Reflection: Better Auth's organization plugin silently requires `activeOrganizationId` on the session table; this must be manually added to the Drizzle schema when hand-rolling auth schemas

## Evaluation notes (flywheel)

- Failure modes observed: Better Auth wraps database errors as generic "Failed query", hiding the actual DB error (missing column, connection failure, etc.)
- Graders run and results (PASS/FAIL): none
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Add `activeOrganizationId` to session schema and run `db:push` to confirm fix
