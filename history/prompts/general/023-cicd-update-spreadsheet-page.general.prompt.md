---
id: "023"
title: CI/CD Update and Excel-like Spreadsheet Page
stage: general
date: 2026-04-05
surface: agent
model: claude-sonnet-4-6
feature: none
branch: fix/docker-db-deploy-improvements
user: msufyanmughal01
command: "Update CI/CD workflow + add Excel-like spreadsheet page"
labels: ["ci-cd","spreadsheet","github-actions","next-js","session-storage"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .github/workflows/deploy.yml
  - src/components/spreadsheet/SpreadsheetClient.tsx
  - src/app/(dashboard)/spreadsheet/page.tsx
  - src/components/dashboard/Sidebar.tsx
tests:
  - none
---

## Prompt

Update my project with the following requirements:

CI/CD Workflow Update:
Analyze my current CI/CD file (GitHub Actions, GitLab CI, or other).
Modify it so that it fits my application structure, ensuring proper build, test, and deployment steps.
Include steps to handle environment variables, Docker images (if applicable), and automatic deployment to production.

Temporary Excel-Like Page:
Add a page to my web application that looks and behaves like an Excel sheet.
Users should be able to enter data, perform basic Excel-like operations (sum, average, basic formulas, copy/paste cells).
The data should only persist during the user session and automatically delete when the user exits or refreshes the website.

Additional Requirements:
Use efficient state management to handle temporary data.
Ensure no server-side persistence of this Excel-like page data.
Provide updated CI/CD YAML or workflow configuration reflecting the new app structure.

Deliverables:
Updated CI/CD workflow file.
Frontend code for the Excel-like page.
Any necessary backend adjustments (if required for session handling).
Clear instructions on how this page integrates into the existing app.

## Response snapshot

1. **CI/CD** — split the single monolithic job into three separate jobs (`quality` → `build` → `deploy`). Added lint step, `NEXT_TELEMETRY_DISABLED=1` build arg, fixed broken rollback (original used non-existent `--tag` flag on `docker compose up`; replaced with `docker run` from captured previous image digest). Added `set -euo pipefail` for fail-fast. Added `environment: production` gate on deploy job.

2. **Spreadsheet page** — created `src/components/spreadsheet/SpreadsheetClient.tsx` as a pure client component (`'use client'`). State is `useState<CellData>` — completely session-only, no localStorage, no server writes. Features: 26 cols × 50 rows grid, cell selection + range selection (shift+click/arrow), keyboard navigation, inline cell editing, formula bar, formulas `=SUM`, `=AVERAGE`, `=COUNT`, `=MAX`, `=MIN`, arithmetic with cell refs (`=A1+B1*2`), Ctrl+C/V copy-paste, Delete key to clear, error values (`#ERR!`, `#DIV/0!`, `#REF!`).

3. **Route** — `src/app/(dashboard)/spreadsheet/page.tsx` renders the client component; protected by the existing dashboard layout auth guard.

4. **Sidebar** — added "Spreadsheet" nav item with a grid icon at position between Bulk Upload and Clients.

## Outcome

- ✅ Impact: CI/CD split into quality/build/deploy jobs with proper dependencies and fixed rollback; session-only spreadsheet page accessible at /spreadsheet within the protected dashboard.
- 🧪 Tests: No automated tests added; spreadsheet logic is pure client-side state, manually verifiable.
- 📁 Files: 4 files modified/created.
- 🔁 Next prompts: Add column resize, freeze rows, export to CSV/XLSX, or persist per-session via sessionStorage.
- 🧠 Reflection: The original rollback used `docker compose up --tag` which is not a valid flag — this would silently fall back to latest on failure instead of rolling back. Fixed by capturing image digest before deploy and using `docker run` directly.

## Evaluation notes (flywheel)

- Failure modes observed: Original CI rollback was broken (invalid compose flag).
- Graders run and results (PASS/FAIL): none
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): Add vitest unit tests for the formula evaluator.
