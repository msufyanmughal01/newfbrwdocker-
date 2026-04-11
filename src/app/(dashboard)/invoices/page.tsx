// T055: Invoice list page — shows all invoices for the authenticated user
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';
import { invoices } from '@/lib/db/schema/invoices';
import { eq, desc, ne, and, sql } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { InvoiceStatusBadge } from '@/components/invoices/InvoiceStatusBadge';

export const metadata = {
  title: 'Invoices',
  description: 'View and manage all your FBR-compliant invoices.',
};

const PAGE_SIZE = 25;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect('/login');

  const params = await (searchParams ?? Promise.resolve({} as { page?: string }));
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  // T030 [US3]: Exclude draft invoices — drafts are shown on /invoices/drafts
  const [userInvoices, [{ total }]] = await Promise.all([
    db
      .select()
      .from(invoices)
      .where(and(eq(invoices.userId, session.user.id), ne(invoices.status, 'draft')))
      .orderBy(desc(invoices.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(invoices)
      .where(and(eq(invoices.userId, session.user.id), ne(invoices.status, 'draft'))),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

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

      {userInvoices.length === 0 && page === 1 ? (
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
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
              <span className="text-xs text-[var(--foreground-muted)]">
                {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total} invoices
              </span>
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/invoices?page=${page - 1}`}
                    className="px-3 py-1.5 text-xs font-medium border border-[var(--border)] rounded-md bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--foreground)] transition-colors"
                  >
                    Previous
                  </Link>
                )}
                <span className="text-xs text-[var(--foreground-muted)]">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/invoices?page=${page + 1}`}
                    className="px-3 py-1.5 text-xs font-medium border border-[var(--border)] rounded-md bg-[var(--surface)] hover:bg-[var(--surface-2)] text-[var(--foreground)] transition-colors"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
