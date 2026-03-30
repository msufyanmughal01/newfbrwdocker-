# Data Model: Responsive Design & TaxDigital Rebrand

**Feature**: `008-responsive-rebrand`
**Phase**: 1 — Design
**Date**: 2026-02-26

---

## Overview

This feature contains **no new database entities, no schema changes, and no new API endpoints**. All changes are confined to:

1. UI component state (mobile drawer open/close)
2. UI text content (brand label updates)
3. CSS layout classes (responsive breakpoints)

---

## Component State Changes

### DashboardShell (modified)

```
DashboardShell state:
  isSidebarOpen: boolean        — existing: desktop expand/collapse
  isMobileOpen: boolean (NEW)   — mobile drawer open/close state
```

**State transitions**:
- `isMobileOpen` defaults to `false` on every page load
- Opens when the hamburger button in Header is clicked (mobile only)
- Closes when:
  - A navigation item in Sidebar is clicked (mobile only)
  - The backdrop overlay is clicked
  - Viewport width crosses ≥ 768px (via resize event or media query effect)

**Props interface changes**:
```
Header (modified):
  userName: string              — existing
  onMobileMenuToggle: () => void (NEW) — triggers isMobileOpen toggle

Sidebar (modified):
  isOpen: boolean               — existing: desktop expand/collapse
  onToggle: () => void          — existing: desktop toggle handler
  isMobileOpen: boolean (NEW)   — mobile drawer open state
  onMobileClose: () => void (NEW) — called after mobile nav item click
```

---

## Brand Text Changes (UI Layer Only)

No data model impact. These are string literal changes in:
- `<Metadata>` objects (Next.js page metadata)
- JSX text nodes
- Template literals in `email.ts`

See `research.md` Decision 3 for the complete change table.

---

## No New Entities

| Entity | Status | Reason |
|--------|--------|--------|
| Database schemas | Unchanged | No new data requirements |
| API routes | Unchanged | No new endpoints; all existing routes preserved |
| Auth/session | Unchanged | No new auth requirements |
| Environment variables | Unchanged | No new configuration needed |

---

## Affected Component Tree

```
DashboardShell
├── Sidebar                     ← responsive mobile drawer mode
│   └── (nav items)             ← close drawer on click (mobile)
└── div.flex-col
    ├── Header                  ← hamburger button (mobile only)
    └── main
        ├── invoices/page.tsx   ← table overflow-x-auto wrapper
        ├── invoices/drafts     ← table overflow-x-auto wrapper
        └── clients/page.tsx    ← table overflow-x-auto wrapper
```

All other pages (dashboard, settings, invoice form, invoice detail) receive responsive layout adjustments via Tailwind responsive prefixes on existing elements — no structural component changes.
