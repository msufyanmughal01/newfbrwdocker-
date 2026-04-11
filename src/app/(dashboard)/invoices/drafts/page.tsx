// Draft Invoices page — Server Component shell
// Fetches drafts from DB and delegates rendering to DraftsClient

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { invoices, invoiceDrafts } from '@/lib/db/schema/invoices';
import { eq, and, desc } from 'drizzle-orm';
import Link from 'next/link';
import { DraftsClient } from './DraftsClient';

export const metadata = {
  title: 'Drafts | Easy Digital Invoice',
};

export default async function DraftsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/sign-in');

  // Fully-submitted invoices that are still in draft status (e.g. FBR submission pending)
  const draftInvoices = await db
    .select({
      id: invoices.id,
      invoiceType: invoices.invoiceType,
      invoiceDate: invoices.invoiceDate,
      buyerBusinessName: invoices.buyerBusinessName,
      updatedAt: invoices.updatedAt,
      grandTotal: invoices.grandTotal,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.userId, session.user.id),
        eq(invoices.status, 'draft')
      )
    )
    .orderBy(desc(invoices.updatedAt))
    .limit(100);

  // Partial form saves from the "Save Draft" button
  const savedFormDrafts = await db
    .select({
      id: invoiceDrafts.id,
      draftData: invoiceDrafts.draftData,
      lastSaved: invoiceDrafts.lastSaved,
    })
    .from(invoiceDrafts)
    .where(eq(invoiceDrafts.userId, session.user.id))
    .orderBy(desc(invoiceDrafts.lastSaved))
    .limit(50);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Drafts</h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Invoices saved but not yet submitted to FBR.
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium text-sm transition-all hover:-translate-y-px"
        >
          + New Invoice
        </Link>
      </div>

      <DraftsClient
        initialDrafts={draftInvoices.map((inv) => ({
          id: inv.id,
          invoiceType: inv.invoiceType,
          invoiceDate: inv.invoiceDate,
          buyerBusinessName: inv.buyerBusinessName ?? '',
          updatedAt: inv.updatedAt ? inv.updatedAt.toISOString() : null,
          grandTotal: inv.grandTotal ?? '0',
        }))}
        formDrafts={savedFormDrafts.map((d) => {
          const data = d.draftData as Record<string, unknown> | null;
          return {
            id: d.id,
            lastSaved: d.lastSaved.toISOString(),
            invoiceType: (data?.invoiceType as string) ?? '',
            buyerBusinessName: (data?.buyerBusinessName as string) ?? '',
          };
        })}
      />
    </div>
  );
}
