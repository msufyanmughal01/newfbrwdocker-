---
name: Fix FBR Scenarios and Invoice Form
description: Fixed 9-scenario display, auto-populate from FBR tab, form validation errors, and IP error messaging
type: general
stage: general
date: 2026-04-23
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: forcliagent@gmail.com
labels: ["fbr", "scenarios", "invoice-form", "bug-fix", "ux"]
---

## Prompt

The attached file has all scenarios which should be run. Enter the details in them according the user logged in and ensure the scenarios should not be failed and the system should work in coordination like when the data which is saved in fbr integration tab will automatically put in the scenario api format and all. Why the invoice creation form is only showing the 5 scenarios but its 9 also. The invoice creation form button is showing the error of "fix error before submit" when I submit from my local system it shows the 200 success code but it showing invalid format but its because the api is post from my system and the internet ip is not registered in fbr portal but fix all issues.

## Response

Fixed 6 interconnected issues across 6 files:

**Files modified:**
- `src/app/(dashboard)/invoices/new/page.tsx` — `isSandbox` now reads from `sellerProfile.fbrEnvironment` (was env var)
- `src/lib/fbr/scenarios.ts` — All 9 scenarios with complete `testData` (buyer + item) matching document values
- `src/lib/invoices/fbr-reference-data.ts` — Added 6 missing sale types + 5 missing tax rates (1%, 7%, 8%, 17%, 25%)
- `src/app/(dashboard)/invoices/invoice-form-client.tsx` — `useEffect` auto-populates buyer/item fields on scenario change
- `src/app/api/sandbox/run-scenario/route.ts` — Rewrote to use `scenario.testData` directly; fixed SN009 quantity=0 bug; seller always from profile
- `src/components/invoices/SubmissionStatus.tsx` — Added IP-restriction error detection with FBR portal registration instructions

**Root causes:**
1. `isSandbox={process.env.FBR_ENV === 'sandbox'}` never matched the user's DB setting → scenario selector hidden
2. Only 5 FBR_SALE_TYPES existed; 4 scenario-specific types missing from dropdown
3. No auto-populate logic when scenario selected → form stayed empty → "fix errors" message
4. run-scenario used hardcoded test buyer + SN009 had quantity=0 (fails positive validation)
5. IP-rejection "invalid format" error showed as generic failure with no guidance
