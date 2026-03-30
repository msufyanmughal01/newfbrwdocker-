// Print Page — renders InvoicePrint component with no navigation
// @media print CSS hides all navigation and buttons

import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { invoices, lineItems } from '@/lib/db/schema/invoices';
import { InvoicePrint } from '@/components/invoices/InvoicePrint';

export const metadata = {
  title: 'Print Invoice | TaxDigital',
};

export default async function PrintInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/login');

  const { id } = await params;

  const invoiceRows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, id))
    .limit(1);

  if (invoiceRows.length === 0) notFound();
  const invoice = invoiceRows[0];

  // Ownership check
  if (invoice.userId !== session.user.id) notFound();

  const lineItemRows = await db
    .select()
    .from(lineItems)
    .where(eq(lineItems.invoiceId, id));

  return (
    <>
      {/* Print-specific styles: hide nav, header, buttons */}
      <style>{`
        @media print {
          nav, header, button, .no-print, [data-no-print] {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .invoice-print {
            width: 100%;
            max-width: 100%;
            padding: 0.5in;
          }
          @page {
            margin: 0.5in;
            size: A4;
          }
        }
      `}</style>

      {/* Print trigger button (hidden in actual print) */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[var(--primary-hover)] transition-colors"
        >
          🖨 Print
        </button>
        <a
          href={`/dashboard/invoices/${id}`}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground-muted)] shadow hover:bg-[var(--surface-2)] transition-colors"
        >
          ← Back
        </a>
      </div>

      <InvoicePrint invoice={invoice} lineItems={lineItemRows} />
    </>
  );
}
