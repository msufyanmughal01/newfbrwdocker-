// T055: Invoice list page — shows all invoices for the authenticated user
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { invoices } from '@/lib/db/schema/invoices';
import { eq, desc, ne, and } from 'drizzle-orm';
import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';

export const metadata = {
  title: 'Invoices | TaxDigital',
};

export default async function InvoicesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/sign-in');

  // T030 [US3]: Exclude draft invoices — drafts are shown on /invoices/drafts
  const userInvoices = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.userId, session.user.id),
        ne(invoices.status, 'draft')
      )
    )
    .orderBy(desc(invoices.createdAt))
    .limit(100);

  return (
    <div className="max-w-[1100px] mx-auto px-4 py-4 sm:px-6 sm:py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Invoices</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/invoices/bulk"
            className="px-4 py-2 border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--foreground-muted)] rounded-lg font-medium text-sm transition-colors"
          >
            Bulk Upload
          </Link>
          <Link
            href="/invoices/new"
            className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium text-sm transition-all hover:-translate-y-px"
          >
            + New Invoice
          </Link>
        </div>
      </div>

      {userInvoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-[var(--border)] rounded-xl">
          <svg className="h-12 w-12 text-[var(--foreground-subtle)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-[var(--foreground-muted)] mb-4 text-sm">No invoices yet</p>
          <Link
            href="/invoices/new"
            className="px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium text-sm transition-all hover:-translate-y-px"
          >
            Create your first invoice
          </Link>
        </div>
      ) : (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">FBR Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Buyer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {userInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-[var(--surface-2)] transition-colors border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3.5 font-mono text-xs text-[var(--foreground-muted)]">
                    {invoice.fbrInvoiceNumber ?? <span className="text-[var(--foreground-subtle)]">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-[var(--foreground)]">{invoice.invoiceType}</td>
                  <td className="px-4 py-3.5 text-sm text-[var(--foreground-muted)]">{invoice.invoiceDate}</td>
                  <td className="px-4 py-3.5 text-sm text-[var(--foreground)]">{invoice.buyerBusinessName ?? <span className="text-[var(--foreground-subtle)]">—</span>}</td>
                  <td className="px-4 py-3.5">
                    <InvoiceStatusBadge status={invoice.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="text-[var(--primary)] hover:text-[var(--primary-hover)] text-xs font-medium"
                    >
                      View
                    </Link>
                    {invoice.status === 'issued' && (
                      <Link
                        href={`/invoices/${invoice.id}/print`}
                        className="ml-3 text-[var(--positive)] hover:opacity-80 text-xs font-medium"
                      >
                        Print
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
