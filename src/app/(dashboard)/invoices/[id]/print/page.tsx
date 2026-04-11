// Print Page — renders InvoicePrint component with no navigation
// @media print CSS hides all navigation and buttons

import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { invoices, lineItems } from '@/lib/db/schema/invoices';
import { businessProfiles } from '@/lib/db/schema/business-profiles';
import { InvoicePrint } from '@/components/invoices/InvoicePrint';
import { PrintActions } from '@/components/invoices/PrintActions';

export const metadata = {
  title: 'Print Invoice | Easy Digital Invoice',
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

  const profileRows = await db
    .select({ logoPath: businessProfiles.logoPath })
    .from(businessProfiles)
    .where(eq(businessProfiles.userId, session.user.id))
    .limit(1);
  const logoPath = profileRows[0]?.logoPath ?? null;

  return (
    <>
      {/* Print-specific styles */}
      <style>{`
        @media print {
          nav, header, button, .no-print, [data-no-print] {
            display: none !important;
          }
          body { margin: 0; padding: 0; background: white; }
          @page { margin: 0.4in; size: A4; }

          .invoice-print {
            width: 100%;
            max-width: 100%;
            box-shadow: none !important;
            border-radius: 0 !important;
            border: none !important;
          }

          /* Repeat table header on every page */
          .invoice-print thead { display: table-header-group; }
          .invoice-print tfoot  { display: table-footer-group; }

          /* Never break a row across pages */
          .invoice-print tbody tr { page-break-inside: avoid; break-inside: avoid; }

          /* Keep header, FBR band, and totals together — never orphaned */
          .invoice-print-header  { page-break-after: avoid; break-after: avoid; }
          .invoice-print-totals  { page-break-before: avoid; break-before: avoid; }
          .invoice-print-footer  { page-break-before: avoid; break-before: avoid; }

          /* Accent bar doesn't need to print */
          .invoice-print-accent  { display: none; }
        }

        @media screen {
          body { background: #e8edf5; padding: 32px 16px; }
        }
      `}</style>

      <PrintActions
        invoiceId={id}
        fileName={`INV-${invoice.fbrInvoiceNumber ?? invoice.id}.pdf`}
      />

      <InvoicePrint invoice={invoice} lineItems={lineItemRows} logoPath={logoPath} />
    </>
  );
}
