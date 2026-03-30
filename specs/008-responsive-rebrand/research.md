# Research: Responsive Design & TaxDigital Rebrand

**Feature**: `008-responsive-rebrand`
**Phase**: 0 — Research
**Date**: 2026-02-26

---

## Decision 1: Responsive Sidebar Strategy

**Decision**: Implement a dual-mode sidebar — desktop toggle (existing) + mobile drawer overlay (new).

**Rationale**:
The existing `Sidebar` component uses a CSS width transition between 240px (expanded) and 56px (icon-only collapsed). On mobile this doesn't work — both widths are too wide for a 375px screen. The standard pattern for mobile sidebars is a fixed-position overlay drawer that renders on top of the page content.

The cleanest implementation adds:
- A new `isMobileOpen` boolean state in `DashboardShell`
- The `Header` receives `onMobileMenuToggle` and renders a hamburger button at `md:hidden`
- The `Sidebar` receives `isMobileOpen` and renders as `position: fixed` with a backdrop on mobile (`< md`), and keeps its current toggle behavior on `md+` screens

No new dependency is required. Tailwind's `md:` breakpoint (768px) is the natural division point.

**Alternatives considered**:
- **Separate `MobileSidebar` and `DesktopSidebar` components**: Rejected — doubles the component surface area and creates duplication risk. One component with responsive CSS is simpler.
- **`react-aria` or `headlessui` Drawer**: Rejected — adds a new dependency for behaviour that is achievable with ~20 lines of Tailwind + CSS transitions. Constitution Principle III (Simplicity Over Complexity) applies.
- **Bottom nav bar on mobile**: Rejected — the existing sidebar nav has 6+ items; a bottom nav only fits 4–5. The current structure is preserved intact.

---

## Decision 2: Table Responsive Strategy

**Decision**: Wrap all data tables in `overflow-x-auto` containers. Do not rewrite tables as card views.

**Rationale**:
The invoice and client tables have 5–6 columns with text content. A horizontal scroll container preserves the existing table structure with zero risk of breaking server-side rendered content. Rewriting tables as card views would require significant markup changes, new CSS, and introduces layout inconsistency.

The invoices list table columns (`FBR Invoice #`, `Type`, `Date`, `Buyer`, `Status`, `Actions`) can be prioritised with responsive hiding for the least critical columns on mobile if needed, but the scroll approach satisfies FR-011 without any structural changes.

**Alternatives considered**:
- **Responsive card view for mobile**: Rejected at spec stage (not required by FR-011; card views are an enhancement beyond minimum viable requirements).
- **Column hiding with CSS**: Can be layered on top later as an enhancement; out of scope for this feature.

---

## Decision 3: Brand Name Change Scope

**Decision**: Update app product brand label in 14 identified locations. Leave FBR government authority labels untouched.

**Rationale**:
Running `grep -rn "FBR Digital Invoicing\|FBR Invoicing\|FBR Portal"` against the source reveals 18 matches across 17 files. After analysis, these split into two categories:

**Category A — Product brand labels (CHANGE to TaxDigital)**:
| File | Current text | New text |
|---|---|---|
| `src/app/layout.tsx` | `"FBR Digital Invoicing Portal"` (metadata title) | `"TaxDigital"` |
| `src/app/(auth)/layout.tsx` | `"FBR Invoicing"` (logo heading) | `"TaxDigital"` |
| `src/app/(auth)/login/page.tsx` | `"Welcome back to FBR Digital Invoicing Portal"` | `"Welcome back to TaxDigital"` |
| `src/app/(auth)/register/page.tsx` | `"Get started with FBR Digital Invoicing Portal"` | `"Get started with TaxDigital"` |
| `src/app/(dashboard)/clients/page.tsx` | `'Clients \| FBR Digital Invoicing'` (metadata) | `'Clients \| TaxDigital'` |
| `src/app/(dashboard)/invoices/drafts/page.tsx` | `'Drafts \| FBR Digital Invoicing'` (metadata) | `'Drafts \| TaxDigital'` |
| `src/app/(dashboard)/invoices/new/page.tsx` | `'Create Invoice \| FBR Digital Invoicing'` (metadata) | `'Create Invoice \| TaxDigital'` |
| `src/app/(dashboard)/invoices/page.tsx` | `'Invoices \| FBR Digital Invoicing'` (metadata) | `'Invoices \| TaxDigital'` |
| `src/app/(dashboard)/invoices/[id]/page.tsx` | `'Invoice Detail \| FBR Digital Invoicing'` (metadata) | `'Invoice Detail \| TaxDigital'` |
| `src/app/(dashboard)/invoices/[id]/print/page.tsx` | `'Print Invoice \| FBR Digital Invoicing'` (metadata) | `'Print Invoice \| TaxDigital'` |
| `src/app/(dashboard)/settings/business-profile/page.tsx` | `'Business Profile \| FBR Digital Invoicing'` (metadata) | `'Business Profile \| TaxDigital'` |
| `src/app/(dashboard)/settings/hs-codes/page.tsx` | `'HS Codes \| FBR Digital Invoicing'` (metadata) | `'HS Codes \| TaxDigital'` |
| `src/components/dashboard/Header.tsx` | `"FBR Digital Invoicing Portal"` (header text) | `"TaxDigital"` |
| `src/components/dashboard/Sidebar.tsx` | `"FBR"` (badge), `"FBR Portal"` (label) | `"TD"`, `"TaxDigital"` |
| `src/lib/email.ts` | `"FBR Portal <onboarding@resend.dev>"` | `"TaxDigital <onboarding@resend.dev>"` |
| `src/lib/email.ts` | `"FBR Digital Invoicing Portal"` (email body) | `"TaxDigital"` |

**Category B — FBR authority / compliance labels (LEAVE UNCHANGED)**:
- `InvoicePrint.tsx`: `"FBR Digital Invoicing System v1.12"` — legal compliance reference
- `InvoicePrint.tsx`: `"Generated by FBR Digital Invoicing System — Pakistan Revenue Service"` — legal footer
- `InvoicePrint.tsx`: `alt="FBR Digital Invoicing System"` — alt text for print logo
- `InvoiceSummary.tsx`: `"✓ Calculations comply with FBR Digital Invoicing API v1.12"` — API spec reference
- `invoice-form-client.tsx`: `"✓ FBR Compliant: This form follows FBR Digital Invoicing API v1.12 specifications"` — compliance banner
- `fbr-mapping.ts`: code comment referencing the API spec

**Alternatives considered**:
- **Global search-replace of all "FBR"**: Rejected — would break FBR API client code, database schema, and compliance labels. The targeted approach is required.

---

## Decision 4: Tailwind CSS Breakpoint Approach

**Decision**: Use Tailwind's built-in responsive prefixes (`md:`, `sm:`, `lg:`) exclusively. Add no custom breakpoints.

**Rationale**:
The project already uses Tailwind CSS (`@import "tailwindcss"` in globals.css). The existing `DashboardContent.tsx` already uses `sm:grid-cols-2 lg:grid-cols-4` — confirming the project team uses Tailwind responsive classes. The spec breakpoints (mobile < 768px, tablet 768px+, desktop 1024px+) map exactly to Tailwind's `md` (768px) and `lg` (1024px) built-in breakpoints.

No new CSS utilities or custom breakpoints are needed.

---

## Decision 5: Viewport Meta Tag

**Decision**: Next.js automatically adds `<meta name="viewport" content="width=device-width, initial-scale=1">` — no manual addition needed.

**Rationale**:
Next.js App Router adds the viewport meta tag automatically. The root `layout.tsx` does not override it. Verified: the existing `<head>` block only contains font `<link>` tags.

---

## Summary: No New Dependencies Required

All responsive changes can be implemented using:
- Tailwind CSS responsive prefixes (already in use)
- Standard CSS transitions (already used for sidebar)
- React `useState` hooks (already in use)

No new packages, APIs, or data migrations are required for this feature.
