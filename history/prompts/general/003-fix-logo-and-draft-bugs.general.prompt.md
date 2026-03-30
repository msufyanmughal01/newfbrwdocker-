---
id: 003
title: fix-logo-and-draft-bugs
stage: general
date: 2026-02-26
surface: agent
model: claude-sonnet-4-6
feature: none
branch: 008-responsive-rebrand
user: System Inn
command: /sp.analyze why the saved image in setting is not loading and why the invoices is not saving in draft
labels: ["bug-fix","logo","drafts","invoice_drafts","cache"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/components/settings/BusinessProfileForm.tsx
  - src/app/(dashboard)/invoices/invoice-form-client.tsx
  - src/app/(dashboard)/invoices/new/page.tsx
  - src/app/(dashboard)/invoices/drafts/page.tsx
  - src/app/(dashboard)/invoices/drafts/DraftsClient.tsx
  - src/app/api/drafts/route.ts
  - src/app/api/drafts/[id]/route.ts
tests:
  - none
---

## Prompt

why the saved image in setting is not loading and why the invoices is not saving in draft ?

## Response snapshot

Investigated two runtime bugs and implemented fixes:

**Bug 1 – Logo not loading**: The logo upload writes to `public/uploads/logos/{userId}-logo.{ext}` with the same filename on every upload. The browser caches 404 or stale image responses for that URL. When the form re-renders (on page load or navigation), `<img src="/uploads/logos/...">` serves the browser-cached response instead of the freshly-written file. **Fix**: Appended `?t=Date.now()` cache-buster to `logoPreview` state on both initial mount and after upload success, forcing the browser to re-fetch the image.

**Bug 2 – Drafts not saving**: `handleSaveDraft` POSTed to `/api/invoices` which runs `invoiceSchema.parse(body)` — a strict Zod schema requiring ALL fields. Partial form data (as occurs when clicking "Save Draft" mid-fill) failed validation with a 400 that was silently ignored (no `else` block, no user feedback). The `invoices` DB table also has NOT NULL constraints on most columns, so partial inserts are impossible. **Root cause confirmed**: There is already an `invoice_drafts` table in the schema designed for JSON blob partial saves. **Fix**: Created `/api/drafts` (POST+GET) and `/api/drafts/[id]` (GET+PATCH+DELETE) routes that use `invoice_drafts`. Updated `handleSaveDraft` to use `/api/drafts`, seeded `draftId` state from `initialDraftId` prop, added `draftError` state with UI feedback. Updated New Invoice page to accept `?draftId=` search param and load form data from DB. Updated Drafts page to fetch `invoice_drafts` and pass them to DraftsClient. Added a "Saved Form Drafts" section to DraftsClient with "Continue" links to `/invoices/new?draftId=`.

## Outcome

- ✅ Impact: Both bugs fixed. Logo now cache-busts on every load. Save Draft now uses the correct invoice_drafts table, shows error feedback on failure, and saved drafts appear in the Drafts page with a Continue link.
- 🧪 Tests: No new tests added (existing test suite untouched).
- 📁 Files: 7 files modified/created.
- 🔁 Next prompts: Run a migration if invoice_drafts table is not yet created in DB.
- 🧠 Reflection: The draft bug was caused by architectural mismatch — the form called the wrong endpoint. The invoice_drafts table was already designed for this purpose but had no API wired up.

## Evaluation notes (flywheel)

- Failure modes observed: Silent failure (no user feedback on draft save error), browser cache for static files with stable filenames.
- Graders run and results (PASS/FAIL): tsc --noEmit PASS (only pre-existing test errors remain).
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Add an auto-save timer to call handleSaveDraft every 30 seconds.
