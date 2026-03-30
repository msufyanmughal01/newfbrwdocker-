// HS Code Master Settings page — server component shell

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { HSCodeMasterManager } from '@/components/settings/HSCodeMasterManager';

export const metadata = {
  title: 'HS Codes | TaxDigital',
};

export default async function HSCodesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/sign-in');

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">HS Code Master List</h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Pin frequently used HS codes for instant access when creating invoices.
        </p>
      </div>

      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6">
        <HSCodeMasterManager />
      </div>
    </div>
  );
}
