'use client';

import { useState } from 'react';

interface PrintActionsProps {
  invoiceId: string;
  /** Suggested filename for the PDF download, e.g. "INV-7000007DI1747119701593.pdf" */
  fileName: string;
}

/**
 * Client component — handles Print and Download PDF actions for the invoice print page.
 *
 * PDF generation is done entirely in the browser (zero server load):
 *   html2canvas captures the .invoice-print element at 2× resolution
 *   jsPDF embeds it into an A4 PDF and triggers a file download
 *
 * Both libraries are lazy-loaded on first click so they don't bloat the initial bundle.
 */
export function PrintActions({ invoiceId, fileName }: PrintActionsProps) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownloadPDF() {
    setGenerating(true);
    setError(null);

    try {
      const element = document.querySelector('.invoice-print') as HTMLElement | null;
      if (!element) throw new Error('Invoice element not found');

      // Lazy-load heavy libs — only downloaded when user clicks the button
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      // Capture at 2× screen resolution for crisp text and QR code
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageW = pdf.internal.pageSize.getWidth();   // 210mm
      const pageH = pdf.internal.pageSize.getHeight();  // 297mm
      const imgH = (canvas.height * pageW) / canvas.width; // scale to page width

      // Multi-page support: slice the image across pages if invoice is long
      let remainingH = imgH;
      let yOffset = 0;

      while (remainingH > 0) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -yOffset, pageW, imgH);
        yOffset += pageH;
        remainingH -= pageH;
      }

      pdf.save(fileName);
    } catch (err) {
      console.error('[PrintActions] PDF generation failed:', err);
      setError('Could not generate PDF. Try using Print → Save as PDF instead.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="no-print fixed top-4 right-4 z-50 flex flex-col items-end gap-2">
      <div className="flex gap-2">
        {/* Browser print (works offline, highest fidelity) */}
        <button
          onClick={() => window.print()}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground-muted)] shadow hover:bg-[var(--surface-2)] transition-colors"
        >
          🖨 Print
        </button>

        {/* Client-side PDF download (no server, no print dialog) */}
        <button
          onClick={handleDownloadPDF}
          disabled={generating}
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {generating ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generating…
            </span>
          ) : (
            '⬇ Download PDF'
          )}
        </button>

        <a
          href={`/invoices/${invoiceId}`}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground-muted)] shadow hover:bg-[var(--surface-2)] transition-colors"
        >
          ← Back
        </a>
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-1.5 max-w-xs text-right">
          {error}
        </p>
      )}
    </div>
  );
}
