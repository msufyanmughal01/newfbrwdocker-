---
id: "006"
title: "App Analysis HS Code Token UI Issues"
stage: general
date: "2026-02-21"
surface: agent
model: claude-sonnet-4-6
feature: "005-fbr-compliance-platform"
branch: "005-fbr-compliance-platform"
user: system
command: "/sp.analyze"
labels: ["analysis", "hs-code", "fbr-token", "ui", "dark-mode", "tax-rates"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - src/components/invoices/HSCodeSearch.tsx
  - src/app/api/fbr/reference/hs-codes/route.ts
  - src/lib/fbr/api-client.ts
  - src/lib/fbr/reference/tax-rates.ts
  - src/app/globals.css
  - src/app/(auth)/layout.tsx
tests: []
---

## Prompt

/sp.analyze all the app and one question why the hs code search is doing without the fbr token and in the create from the sandbox scenerio have the different tax percentage ? and why are you not using the claude frontend plugin to make the ui more moderen and futuristic ? example like in all page the background and text is in the same color i can't even see the text

## Response

Full codebase analysis performed. Three issues identified:

1. **HS Code Search Without FBR Token**: Reference data endpoints (HS codes, provinces, UOM, tax rates) use shared `FBR_API_TOKEN` env var as fallback because `userId` is not passed through the call chain. The route handler calls `searchHSCodes(q)` without passing session user ID, so `resolveToken(undefined)` falls back to global env var.

2. **Different Tax Percentages in Sandbox**: The sandbox FBR bearer token returns different `SaleTypeToRate` data from FBR servers. Additionally, a cache key collision bug exists: cache key `fbr:tax-rates:{date}` lacks userId/environment isolation, causing cross-user cross-environment cache pollution.

3. **UI Visibility Issue (Dark Mode)**: `globals.css` only overrides `--background` and `--foreground` in dark mode. All other design tokens (`--color-card: #ffffff`, `--color-bg: #f8fafc`, etc.) stay as light-mode values. In dark mode: white card backgrounds with near-white text = invisible text.

4. **Modern UI**: `frontend-design` skill available but not yet used. Previous sessions focused on FBR backend integration. Ready to use it for UI modernization.

## Outcome

User presented with 3 options: A) fix bugs first, B) full UI modernization, C) both.
ADR suggestion made for tax rate cache isolation.
