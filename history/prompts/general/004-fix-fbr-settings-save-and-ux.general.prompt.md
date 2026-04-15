---
name: Fix FBR Settings Save Error and UX Issues
description: Fixed DB save error (jsonb serialization), hint display bug, NTN/CNIC pre-fill, and FBR API token input UX
type: general
stage: green
date: 2026-04-15
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: M Sufyan Mughal
command: chat
labels: ["fbr", "settings", "bug-fix", "ux", "encryption", "jsonb"]
---

## PROMPT_TEXT

the error while saving "Failed query: insert into "business_profiles" ... fbr_token_hint ... params: ... ••••234. ..." ntn and cnic and strn and fbr api is showing the last 234 number why the api box should take the api not token (number) and the data should be there if changes from settings in the invoice and all in the app where required

## RESPONSE_TEXT

Identified and fixed 4 issues:

1. **fbrTokenHint display bug** (`FBRTab.tsx`): Old code stored `••••` + last4 as the hint. New code already fixed to `token.slice(-4)` in `business-profile.ts`. Fixed display to strip any leading `•` chars from legacy stored hints: `profile.fbrTokenHint.replace(/^[•\u2022]+/, "")`.

2. **NTN/CNIC blank fields** (`FBRTab.tsx`): Pre-filled NTN and CNIC from decrypted profile values (`profile?.ntnCnic` and `profile?.cnic`). These are decrypted by `getBusinessProfile` → `decryptProfile` before reaching the component. Always include in save payload so users can see current values.

3. **FBR token input type** (`FBRTab.tsx`): Changed `type="password"` → `type="text"` with `autoComplete="off"` and updated placeholder to "Paste new API key…" so it's clear it accepts an alphanumeric API key.

4. **jsonb serialization fix** (`business-profile.ts`): Changed `businessCredentials` and `paymentDetails` from plain JS array/object to explicit `sql\`${JSON.stringify(data.x)}::jsonb\`` casting to prevent Drizzle ORM serialization failures in the `onConflictDoUpdate` SET clause.

Data propagation to invoices was already correct — `invoice-form-client.tsx:70` reads `sellerProfile?.ntnCnic` from `getBusinessProfile` (decrypted).

## FILES_YAML
 - src/components/settings/tabs/FBRTab.tsx
 - src/lib/settings/business-profile.ts
