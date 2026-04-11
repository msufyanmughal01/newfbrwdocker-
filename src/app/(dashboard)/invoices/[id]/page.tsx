// Invoice Detail Page — shows invoice summary with status badge and print link

import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { invoices, lineItems } from '@/lib/db/schema/invoices';
import Link from 'next/link';
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';

export const metadata = {
  title: 'Invoice Detail | Easy Digital Invoice',
};

function formatCurrency(val: string | null | undefined): string {
  if (!val) return '0.00';
  return parseFloat(val).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/sign-in');

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

  const sortedItems = [...lineItemRows].sort((a, b) => a.lineNumber - b.lineNumber);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back navigation */}
      <Link
        href="/invoices"
        className="inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] mb-6"
      >
        ← Back to Invoices
      </Link>

      {/* Header */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{invoice.invoiceType}</h1>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">Date: {invoice.invoiceDate}</p>
            {invoice.invoiceRefNo && (
              <p className="text-sm text-[var(--foreground-muted)]">Ref: {invoice.invoiceRefNo}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <InvoiceStatusBadge status={invoice.status} />
            {invoice.status === 'issued' && (
              <Link
                href={`/invoices/${id}/print`}
                target="_blank"
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)] transition-all"
              >
                Print Invoice
              </Link>
            )}
          </div>
        </div>

        {/* FBR Invoice Number */}
        {invoice.fbrInvoiceNumber && (
          <div className="mt-4 rounded-lg bg-[var(--positive-bg)] border border-[var(--positive)]/20 p-3">
            <span className="text-xs font-semibold text-[var(--positive)] uppercase">IRN: </span>
            <span className="font-mono font-bold text-[var(--positive)]">{invoice.fbrInvoiceNumber}</span>
          </div>
        )}

        {/* Read-only banner for issued invoices */}
        {invoice.status === 'issued' && (
          <div className="mt-4 rounded-lg bg-[var(--info-bg)] border border-[var(--info)]/20 p-3 flex items-center gap-2">
            <span className="text-[var(--info)] text-sm font-medium">
              This invoice is immutable. Submitted{invoice.issuedAt ? ` on ${new Date(invoice.issuedAt).toLocaleDateString()}` : ''}.
            </span>
          </div>
        )}
      </div>

      {/* Seller / Buyer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-4">
          <p className="text-xs font-bold text-[var(--foreground-muted)] uppercase mb-2">Seller</p>
          <p className="font-semibold text-[var(--foreground)]">{invoice.sellerBusinessName}</p>
          <p className="text-sm text-[var(--foreground-muted)] font-mono">NTN/CNIC: {invoice.sellerNTNCNIC}</p>
          <p className="text-sm text-[var(--foreground-muted)]">{invoice.sellerProvince}</p>
        </div>
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-4">
          <p className="text-xs font-bold text-[var(--foreground-muted)] uppercase mb-2">Buyer</p>
          <p className="font-semibold text-[var(--foreground)]">{invoice.buyerBusinessName}</p>
          {invoice.buyerNTNCNIC && (
            <p className="text-sm text-[var(--foreground-muted)] font-mono">NTN/CNIC: {invoice.buyerNTNCNIC}</p>
          )}
          <p className="text-sm text-[var(--foreground-muted)]">
            {invoice.buyerRegistrationType} · {invoice.buyerProvince}
          </p>
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Line Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">#</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">HS Code</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Description</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Qty</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">UOM</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Value</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Tax</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
                <tr key={item.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors">
                  <td className="px-3 py-3 text-[var(--foreground-muted)]">{item.lineNumber}</td>
                  <td className="px-3 py-3 font-mono text-xs text-[var(--foreground-muted)]">{item.hsCode}</td>
                  <td className="px-3 py-3 text-[var(--foreground)]">{item.productDescription}</td>
                  <td className="px-3 py-3 text-right text-[var(--foreground)]">{parseFloat(item.quantity).toFixed(2)}</td>
                  <td className="px-3 py-3 text-xs text-[var(--foreground-muted)]">{item.uom}</td>
                  <td className="px-3 py-3 text-right text-[var(--foreground)]">PKR {formatCurrency(item.valueSalesExcludingST)}</td>
                  <td className="px-3 py-3 text-right text-[var(--foreground)]">PKR {formatCurrency(item.salesTaxApplicable)}</td>
                  <td className="px-3 py-3 text-right font-semibold text-[var(--foreground)]">PKR {formatCurrency(item.totalValues)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6 flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-1.5">
            <span className="text-[var(--foreground-muted)] text-sm">Subtotal</span>
            <span className="text-[var(--foreground)] text-sm">PKR {formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
            <span className="text-[var(--foreground-muted)] text-sm">Total Sales Tax</span>
            <span className="text-[var(--foreground)] text-sm">PKR {formatCurrency(invoice.totalTax)}</span>
          </div>
          <div className="flex justify-between py-2.5 font-bold text-lg">
            <span className="text-[var(--foreground)]">Grand Total</span>
            <span className="text-[var(--foreground)]">PKR {formatCurrency(invoice.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
