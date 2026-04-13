---
name: Lint TypeScript Interface Audit Business Profile
description: Audit lint/typecheck commands, tsconfig strictness, ESLint config, and interface match between BusinessProfileForm and business-profile page
type: general
stage: general
date: 2026-04-13
surface: agent
model: claude-sonnet-4-6
feature: none
branch: main
user: M Sufyan Mughal
command: check package.json scripts, tsconfig, eslint config, and read BusinessProfileForm + page for type issues
labels: ["audit", "typescript", "eslint", "business-profile", "settings"]
---

## PROMPT_TEXT

In the project at C:\Users\System Inn\Desktop\newfbrwdocker-, check:
1. Read package.json to see lint and typescript scripts
2. Read tsconfig.json to see TypeScript strictness settings
3. Check if there's an eslint config file (look for .eslintrc.json, .eslintrc.js, eslint.config.js, etc.)
4. Read src/components/settings/BusinessProfileForm.tsx and src/app/(dashboard)/settings/business-profile/page.tsx

Report:
- What lint/type check commands are available
- Any obvious TypeScript issues you can spot (missing types, wrong prop types, etc.)
- Whether the component interfaces match between page and form

## RESPONSE_TEXT

**Commands available:**
- `npm run lint` → `eslint`
- `npm run typecheck` → `tsc --noEmit`
- `npm run build` → `next build` (also type-checks)

**TSConfig:** `strict: true`, target ES2017, moduleResolution bundler, skipLibCheck true.

**ESLint config:** `eslint.config.mjs` (flat config, ESLint 9). Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`. No custom rule overrides.

**Interface match:** All 13 fields passed by the page (`businessName`, `businessEmail`, `ntnCnic`, `cnic`, `phone`, `province`, `address`, `city`, `postalCode`, `logoPath`, `fbrTokenHint`, `fbrEnvironment`, `fbrPosid`) exactly match the `ProfileData` interface declared in the form. Fully aligned — no mismatches.

**Potential issues noted:**
1. Double-fetch of `getBusinessProfile` in page after upsert can silently return `null` — TypeScript won't flag it since `profile: ProfileData | null` is a valid prop, but it's a runtime logic gap.
2. Empty catch bindings `catch {}` — valid in modern TS, no issue.
3. `fbrToken` intentionally not sourced from profile (security by design).
4. `encryptedPut` return type not verified (would require checking `transit-client.ts`).

## FILES_YAML
 - package.json
 - tsconfig.json
 - eslint.config.mjs
 - src/components/settings/BusinessProfileForm.tsx
 - src/app/(dashboard)/settings/business-profile/page.tsx

## TESTS_YAML
 - none
