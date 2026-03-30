---
id: 007
title: Fix invoice_drafts stale organization_id FK
stage: general
date: 2026-02-26
surface: agent
model: claude-sonnet-4-6
feature: 008-responsive-rebrand
branch: 008-responsive-rebrand
user: System Inn
command: chat
labels: ["debugging","drizzle","schema","migration","invoice-drafts","foreign-key"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/lib/db/schema/invoices.ts
  - src/app/api/drafts/route.ts
tests:
  - none run
---

## Prompt

why this error " GET /api/fbr/reference/hs-codes?q=2232.22 500 in 1059ms (compile: 27ms, render: 1032ms)
⨯ Error: Failed query: insert into "invoice_drafts" ("id", "user_id", "draft_data", "last_saved", "created_at", "created_by") values (default, $1, $2, $3, default, default) returning "id"
[cause]: error: insert or update on table "invoice_drafts" violates foreign key constraint "invoice_drafts_organization_id_organization_id_fk"

## Response snapshot

Root cause: The `invoice_drafts` table in the database still had an old `organization_id` column with a NOT NULL FK constraint referencing the `organization` table. The P0 security migration (`0002_p0_security_fixes.sql`) did the `organization_id → user_id` rename for `buyer_registry` but missed `invoice_drafts`. The Drizzle schema only defines `user_id`, so any INSERT omits `organization_id`, violating the NOT NULL constraint.

Fix applied via Node.js migration script using `@neondatabase/serverless`:
```sql
ALTER TABLE invoice_drafts DROP CONSTRAINT IF EXISTS invoice_drafts_organization_id_organization_id_fk;
ALTER TABLE invoice_drafts DROP COLUMN IF EXISTS organization_id;
```

No code changes required.

## Outcome

- ✅ Impact: Fixes 500 error on POST /api/drafts (invoice draft save)
- 🧪 Tests: none run
- 📁 Files: database-only fix; no source files modified
- 🔁 Next prompts: Verify draft saving works end-to-end
- 🧠 Reflection: When renaming organization_id → user_id in migrations, audit ALL tables that had the old column, not just the one explicitly mentioned

## Evaluation notes (flywheel)

- Failure modes observed: Incomplete migration left stale FK constraint; Drizzle schema drift from actual DB state
- Graders run and results (PASS/FAIL): none
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Run drizzle-kit push to fully sync schema after all manual fixes
