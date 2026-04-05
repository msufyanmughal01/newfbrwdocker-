---
name: redesign-invoice-print-layout-modern-branded
description: Redesign InvoicePrint with modern indigo theme, business logo, TaxDigital branding, FBR pill, multi-product print support
type: general
stage: general
date: 2026-04-06
model: claude-sonnet-4-6
feature: none
branch: fix/docker-db-deploy-improvements
surface: agent
---

## Prompt

User requested: change invoice layout to modern appealing design with TaxDigital branding, small FBR Digital Invoicing logo, website color theme (white/blur with indigo), business logo, and multi-product responsiveness.

## Response

### Files Modified

**`src/components/invoices/InvoicePrint.tsx`** — full redesign:
- Thin indigo→violet gradient accent bar at top
- Header: business logo (from logoPath, falls back to initials) + name/NTN left · invoice type badge (indigo pill) center · TaxDigital brand + FBR DIS small pill right
- FBR band: indigo-tinted row with monospace invoice number, ✓ Issued green pill, QR code
- Meta chips row: date, type, issued at, reference no.
- Seller card: indigo gradient header (`#f8faff → #eef2ff`)
- Buyer card: sky blue gradient header (`#f8faff → #f0f9ff`)
- Table: indigo gradient header, alternating white/`#fafbff` rows, indigo total column
- Grand Total: indigo→violet gradient pill
- Footer: light gray bar with TaxDigital brand + FBR reference
- Added CSS class hooks: `invoice-print-accent`, `invoice-print-header`, `invoice-print-totals`, `invoice-print-footer`

**`src/app/(dashboard)/invoices/[id]/print/page.tsx`**:
- Fetches `logoPath` from `businessProfiles` table, passes to `InvoicePrint`
- Expanded print CSS: `thead { display: table-header-group }` (repeats on each page), `tbody tr { page-break-inside: avoid }`, break rules on header/totals/footer sections
- Accent bar hidden in print (`display: none`)

**`public/invoice-layouts-preview.html`** — static preview with 10 products for layout testing

### Key decisions

- Inline styles used throughout (not Tailwind classes) — CSS variables don't resolve in html2canvas, inline styles ensure PDF fidelity
- Base64 `logoPath` rendered via `<img>` tag (not Next.js Image) — no optimization needed for data URLs
- Print CSS `thead { display: table-header-group }` ensures column headers repeat on page 2+ when printing
- `page-break-inside: avoid` on rows prevents mid-row splits across pages

## Outcome

Modern branded invoice layout matching website indigo theme. Business logo shown top-left. Handles 10+ products correctly in both browser print and PDF download.
