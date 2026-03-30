# Implementation Plan: Responsive Design & TaxDigital Rebrand

**Branch**: `008-responsive-rebrand` | **Date**: 2026-02-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-responsive-rebrand/spec.md`

## Summary

Rename the app brand from "FBR Digital Invoicing Portal" to "TaxDigital" across all UI labels, and make the entire application responsive from 375px (mobile) upward. The core structural change is converting the fixed sidebar into a mobile drawer overlay; the rest of the work is Tailwind responsive class additions and table overflow wrappers. No new dependencies, API changes, or database migrations are required.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js App Router)
**Primary Dependencies**: Next.js 14+, Tailwind CSS v4, React Hook Form, Drizzle ORM
**Storage**: PostgreSQL via Neon (unchanged — no schema changes)
**Testing**: Playwright (E2E), Vitest (unit)
**Target Platform**: Web — desktop, tablet, mobile browsers (375px+)
**Project Type**: Web application (Next.js App Router, `src/` layout)
**Performance Goals**: No regressions to existing paint/load times; CSS transitions ≤ 200ms
**Constraints**: No new npm dependencies; no horizontal page scroll on viewports ≥ 375px; FBR compliance labels must not change
**Scale/Scope**: ~17 files changed; ~15 brand text replacements; ~5 component modifications

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Clarity Above All | ✅ PASS | All renamed text is unambiguous; "TD" badge clearly abbreviates "TaxDigital" |
| II. Consistency Is Mandatory | ✅ PASS | One consistent naming pattern: "TaxDigital" brand; "FBR" authority labels untouched |
| III. Simplicity Over Complexity | ✅ PASS | No new dependencies; Tailwind breakpoints + one new state variable |
| IV. Purpose-Driven Development | ✅ PASS | Every change maps to FR-001–FR-015 in the spec |
| V. Quality Cannot Be Compromised | ✅ PASS | Type-safe changes only; tests must pass |
| VI. Transparency of Changes | ✅ PASS | Targeted diffs; commented where FBR authority labels are intentionally preserved |
| VII. Scalability of Structure | ✅ PASS | Mobile drawer pattern is the standard, future-proof approach |
| VIII. Security Is Not Optional | ✅ PASS | No auth/session changes; no new attack surface |
| IX. Data Integrity Above Convenience | ✅ PASS | No data or calculation changes |
| X. Testability Is a Requirement | ✅ PASS | All changes are visually verifiable; unit-testable component props |

**No violations. No complexity justification table needed.**

*Post-design re-check*: All Phase 1 artifacts (data-model.md, contracts, quickstart.md) confirm zero new dependencies, zero new API surface, and no structural changes beyond the sidebar drawer pattern. Constitution gates remain ✅ PASS.

## Project Structure

### Documentation (this feature)

```text
specs/008-responsive-rebrand/
├── plan.md              # This file
├── spec.md              # Feature requirements
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── no-new-apis.md   # Phase 1 output (confirms no new endpoints)
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/sp.tasks — NOT created by /sp.plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx                              ← brand rename (metadata title)
│   ├── (auth)/
│   │   ├── layout.tsx                          ← brand rename (logo heading)
│   │   ├── login/page.tsx                      ← brand rename (subtitle)
│   │   └── register/page.tsx                   ← brand rename (subtitle)
│   └── (dashboard)/
│       ├── clients/page.tsx                    ← brand rename (metadata) + table overflow
│       ├── dashboard/DashboardContent.tsx       ← no changes needed (already responsive)
│       ├── invoices/
│       │   ├── page.tsx                        ← brand rename (metadata) + table overflow
│       │   ├── drafts/page.tsx                 ← brand rename (metadata) + table overflow
│       │   ├── new/page.tsx                    ← brand rename (metadata)
│       │   ├── invoice-form-client.tsx         ← responsive form layout
│       │   └── [id]/
│       │       ├── page.tsx                    ← brand rename (metadata) + responsive layout
│       │       └── print/page.tsx              ← brand rename (metadata); no responsive
│       └── settings/
│           ├── business-profile/page.tsx       ← brand rename (metadata)
│           └── hs-codes/page.tsx               ← brand rename (metadata)
└── components/
    ├── dashboard/
    │   ├── DashboardShell.tsx                  ← mobile drawer state + backdrop
    │   ├── Sidebar.tsx                         ← brand rename + mobile overlay mode
    │   └── Header.tsx                          ← brand rename + hamburger button
    └── (other components unchanged)

src/lib/
└── email.ts                                    ← brand rename (email sender + body)
```

**Structure Decision**: Single Next.js project (Option 1 + frontend focus). All responsive changes stay within `src/components/dashboard/` (layout shell) and `src/app/(dashboard)/` (page content). No new directories needed.

## Architecture: Mobile Sidebar Drawer

### Current architecture

```
DashboardShell
  state: isSidebarOpen (boolean)
  ├── <Sidebar isOpen onToggle />     ← sticky, w-60 or w-14
  └── <Header userName />             ← no mobile menu button
```

### Target architecture

```
DashboardShell
  state: isSidebarOpen (boolean)    ← desktop: existing expand/collapse
  state: isMobileOpen (boolean)     ← NEW: mobile drawer open/close
  ├── <Sidebar
        isOpen
        onToggle
        isMobileOpen               ← NEW
        onMobileClose />           ← NEW: called when nav item clicked on mobile
  └── div.flex-col
      ├── <Header
            userName
            onMobileMenuToggle />  ← NEW
      └── <main />
```

### Sidebar responsive rendering

On **mobile** (`< md`):
- Renders as `fixed inset-y-0 left-0 z-50 w-60` — full drawer
- A semi-transparent backdrop `fixed inset-0 z-40 bg-black/40` renders behind when `isMobileOpen`
- `translate-x-0` when open, `-translate-x-full` when closed (CSS transition)
- Closing the backdrop or clicking a nav item calls `onMobileClose`

On **desktop** (`md+`):
- Renders as `sticky top-0 h-screen` — existing behaviour
- `isMobileOpen` prop is ignored at this breakpoint
- Existing `isOpen` expand/collapse toggle unchanged

### Header responsive rendering

On **mobile** (`< md`):
- Hamburger button (`☰`) rendered at the left edge of the header
- Calls `onMobileMenuToggle` on click

On **desktop** (`md+`):
- Hamburger button hidden (`hidden md:hidden` — not rendered at this size)
- Header appearance unchanged

## Phase 0 Outputs

- [x] `research.md` — All 5 decisions resolved; no NEEDS CLARIFICATION items remain
  - Mobile sidebar strategy: dual-mode component
  - Table strategy: `overflow-x-auto` wrapper
  - Brand scope: 16 product labels changed; 6 authority labels preserved
  - Breakpoint approach: Tailwind built-ins only
  - Viewport meta: handled by Next.js automatically

## Phase 1 Outputs

- [x] `data-model.md` — No new entities; component state schema documented
- [x] `contracts/no-new-apis.md` — Zero new API endpoints confirmed
- [x] `quickstart.md` — Setup, test steps, and file change list

## Implementation Order (for /sp.tasks)

Tasks should be generated in this dependency order:

1. **Brand rename — metadata** (all page `metadata` objects): Independent; no deps
2. **Brand rename — UI text** (auth layout, header, sidebar, login, register): Independent; no deps
3. **Brand rename — email.ts**: Independent; no deps
4. **Sidebar responsive**: Modifies `Sidebar.tsx` + `DashboardShell.tsx` + `Header.tsx` — do together
5. **Table overflow wrappers**: `invoices/page.tsx`, `invoices/drafts/page.tsx`, `clients/page.tsx`
6. **Invoice form responsive**: `invoice-form-client.tsx` + any referenced components
7. **Invoice detail page responsive**: `invoices/[id]/page.tsx`
8. **Verification**: TypeScript check + E2E tests at mobile viewport

## Risks

- **Risk 1**: The sidebar toggle button may conflict with the hamburger button on mobile if not properly hidden at each breakpoint. Mitigation: use `hidden md:flex` on the toggle (desktop only) and `flex md:hidden` on the hamburger (mobile only).
- **Risk 2**: Auto-closing the mobile drawer on viewport resize requires cleanup of event listeners. Mitigation: use a `useEffect` with a `matchMedia` listener or rely on `visibility: hidden` via CSS — no JS resize handler needed if the sidebar CSS hides correctly at `md+`.
- **Risk 3**: InvoicePrint page may receive unintended style changes if responsive classes are applied globally. Mitigation: print page is excluded from responsive changes by spec; no classes added to it.
