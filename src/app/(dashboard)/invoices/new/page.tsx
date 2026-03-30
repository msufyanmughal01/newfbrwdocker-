// T016 [US1]: Server component — fetches seller profile and passes to form client
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { InvoiceFormClient } from '../invoice-form-client';
import { headers } from 'next/headers';
import { getBusinessProfile } from '@/lib/settings/business-profile';
import { db } from '@/lib/db';
import { invoiceDrafts } from '@/lib/db/schema/invoices';
import { eq, and } from 'drizzle-orm';
import type { InvoiceFormData } from '@/lib/invoices/validation';

export const metadata = {
  title: 'Create Invoice | TaxDigital',
  description: 'Create FBR-compliant Sale Invoice or Debit Note',
};

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ draftId?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/sign-in');
  }

  const { draftId } = await searchParams;

  // Fetch business profile for seller auto-fill
  const sellerProfile = await getBusinessProfile(session.user.id);

  // Load draft data if continuing from a saved draft
  let initialData: Partial<InvoiceFormData> | undefined;
  if (draftId) {
    const [draft] = await db
      .select({ draftData: invoiceDrafts.draftData })
      .from(invoiceDrafts)
      .where(and(eq(invoiceDrafts.id, draftId), eq(invoiceDrafts.userId, session.user.id)))
      .limit(1);
    if (draft) {
      initialData = draft.draftData as Partial<InvoiceFormData>;
    }
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Create New Invoice</h1>
          <p className="mt-2 text-[var(--foreground-muted)]">
            Create FBR-compliant Sale Invoice or Debit Note with real-time tax calculations
          </p>
        </div>

        <InvoiceFormClient
          isSandbox={process.env.FBR_ENV === 'sandbox'}
          sellerProfile={sellerProfile}
          initialDraftId={draftId ?? null}
          initialData={initialData}
        />
      </div>
    </div>
  );
}
