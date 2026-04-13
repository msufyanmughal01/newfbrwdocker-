---
id: "003"
title: "Auth & Profile Bug Fixes"
stage: general
date: "2026-04-14"
surface: agent
model: claude-opus-4-5
feature: none
branch: main
user: "M Sufyan Mughal"
command: "chat"
labels: ["bugfix", "auth", "business-profile", "strn", "jsonb", "signup", "login", "google-oauth"]
links:
  spec: "null"
  ticket: "null"
  adr: "null"
  pr: "null"
files_modified:
  - src/lib/settings/business-profile.ts
  - src/components/auth/SignupForm.tsx
  - src/components/auth/LoginForm.tsx
  - src/components/settings/tabs/FBRTab.tsx
  - src/lib/auth.ts
---

## Prompt

The user reported five separate bugs:

1. STRN field in FBR Settings showing the login email address on every page reload.
2. Saving FBR settings failing with: `Failed query: insert into "business_profiles" ... params: ...,,...` — the `business_credentials` jsonb column receiving an empty string `""` instead of SQL NULL.
3. Login showing "Invalid credentials" error for users who signed up with Google and also for some existing email/password users.
4. Signup not showing clear errors for: duplicate email, weak password, or HIBP-breached passwords.
5. Google-signup users being shown a "Change Password" section inappropriately.

Additionally asked: does CI/CD run automatically on push? Are there TypeScript/lint errors?

## Response

### Root Causes Identified

**STRN showing login email (persistent across reloads)**
The email had been accidentally saved into `businessCredentials` as `{type:"STRN", value:"user@email.com"}`. A prior UI-only fix (skipping display in React state) didn't help because the server still returned the raw DB data every reload. Fix: added `sanitiseCredentials()` inside `decryptProfile()` in `business-profile.ts` — strips any STRN entry whose value is not `/^\d{1,15}$/` at read time, permanently from the client's perspective on every reload, and the DB is cleaned on the user's next save.

**jsonb null → empty string `""` crash**
The `pg` driver was serialising JavaScript `null` as `""` for parameterised jsonb columns, causing `invalid input syntax for type json`. Fix: replaced `null` with `sql\`null::jsonb\`` (Drizzle SQL fragment) for `businessCredentials` and `paymentDetails` in `upsertBusinessProfile`.

**Signup error messages**
`mapSignupError` was not handling status `409` (duplicate email) or the `code:"PASSWORD_BREACHED"` field from the HIBP check, and was not passing the error `code` field from the auth client result. All three gaps fixed.

**Login hint for Google-only accounts**
Invalid-credentials error message now appends: "If you signed up with Google, use the 'Continue with Google' button below." Account-lockout (429) now shows the actual lockout message instead of the generic one.

**Google OAuth / change password**
Already correctly handled in `SecurityTab.tsx` — it checks `authClient.listAccounts()` and only shows "Change Password" when `providerId === "credential"` exists; Google-only users see an informational "Signed in with Google" notice.

**Auth hook safety**
Wrapped `upsertBusinessProfile(user.id, {})` in `try/catch` so a DB failure never blocks user registration.

**CI/CD**
`.github/workflows/deploy.yml` is correct: push to `main` → lint → tsc → tests → Docker build/push → SSH deploy with health-check and auto-rollback. No action needed.

**TypeScript / lint**
Zero errors in `src/` after all changes (confirmed via `tsc --noEmit --skipLibCheck` exit code 0 and `eslint src`).

### Files Changed

| File | Change |
|------|--------|
| `src/lib/settings/business-profile.ts` | Added `sanitiseCredentials()` + `VALID_STRN_RE`; applied to `decryptProfile`; used `sql\`null::jsonb\`` for jsonb nulls |
| `src/components/auth/SignupForm.tsx` | `mapSignupError` handles 409, PASSWORD_BREACHED code, more weak-password phrases; passes `code` field |
| `src/components/auth/LoginForm.tsx` | Better 429 lockout message; invalid-credentials hints at Google Sign-In |
| `src/components/settings/tabs/FBRTab.tsx` | `storedStrn` only pre-fills if numeric; added `validateStrn()`; STRN input validated on change + on save; `inputMode="numeric"`, `maxLength=15` |
| `src/lib/auth.ts` | `upsertBusinessProfile` call in `databaseHooks.user.create.after` wrapped in `try/catch` |
