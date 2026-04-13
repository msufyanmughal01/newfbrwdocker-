---
name: Fix FBR Settings JSON Parse Error
description: Fix "Unexpected end of JSON input" when saving FBR API token in settings
type: general
stage: green
date: 2026-04-13
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: M Sufyan Mughal
command: fix fbr settings save error
labels: ["bug-fix", "fbr", "encryption", "settings"]
---

## PROMPT_TEXT

When saving FBR API token in settings, error shows: "Failed to execute 'json' on 'Response': Unexpected end of JSON input". User attached FBR technical documentation PDFs.

## RESPONSE_TEXT

Root cause: `FBRTab.tsx` and `CompanyTab.tsx` were using plain `fetch()` PUT to `/api/settings/business-profile`, but that route is wrapped with `withDecryption()` middleware which expects an encrypted request body with `X-Encrypted: 1` header. When the middleware received unencrypted data, it returned a 400 error with an empty/malformed body, causing `res.json()` to throw.

**Fix applied:**
- `src/components/settings/tabs/FBRTab.tsx`: replaced `fetch()` with `encryptedPut()` from `@/lib/crypto/transit-client`; also added `.catch(() => ({}))` guard on the error body parse
- `src/components/settings/tabs/CompanyTab.tsx`: same replacement — was silently swallowing errors before but would have hit the same middleware rejection

## FILES_YAML
 - src/components/settings/tabs/FBRTab.tsx
 - src/components/settings/tabs/CompanyTab.tsx
