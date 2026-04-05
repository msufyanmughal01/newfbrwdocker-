---
name: implement-client-side-pdf-download-print-page
description: Implement client-side PDF download with jsPDF and html2canvas; wire PrintActions into print page
type: general
stage: general
date: 2026-04-05
model: claude-sonnet-4-6
feature: none
branch: fix/docker-db-deploy-improvements
surface: agent
---

## Prompt

User confirmed "yes" to implement client-side PDF generation (no server load).
Then resumed session to wire the newly created PrintActions component into the print page.

## Response

### Files Created

- `src/components/invoices/PrintActions.tsx` — Client component with Print + Download PDF + Back buttons.
  - Lazy-loads `html2canvas` and `jsPDF` on first click (not in initial bundle).
  - Captures `.invoice-print` at 2× scale for crisp text/QR.
  - Multi-page A4 PDF support via slice loop.
  - Loading spinner + error fallback message.

### Files Modified

- `src/app/(dashboard)/invoices/[id]/print/page.tsx`
  - Removed broken inline `onClick={() => window.print()}` on server component (throws at runtime in Next.js).
  - Imported `PrintActions` client component.
  - Replaced old button div with `<PrintActions invoiceId={id} fileName={...} />`.
  - Filename uses `invoice.fbrInvoiceNumber` when issued, falls back to `invoice.id`.

### Key decisions

- Zero server load: PDF generated entirely in browser using canvas capture.
- Lazy import: `html2canvas` (~300 KB) and `jsPDF` (~250 KB) only downloaded when user clicks Download PDF.
- Multi-page: while loop slices image across A4 pages for long invoices.
- Back link navigates to `/invoices/${invoiceId}` (invoice detail page).

## Outcome

Print page fully functional with three working actions: browser print dialog, client-side PDF download, and back navigation. Previous implementation had a server component with `onClick` which is invalid in Next.js and would have thrown a runtime error.
