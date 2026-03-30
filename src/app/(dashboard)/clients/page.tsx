// T025 [US2]: Clients page — Server Component
// Fetches active clients server-side, renders ClientsTable with add/edit/delete

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { listClients } from '@/lib/clients/client-service';
import { ClientsTable } from '@/components/clients/ClientsTable';
import { ClientExportButton } from '@/components/clients/ClientExportButton';

export const metadata = {
  title: 'Clients | TaxDigital',
};

export default async function ClientsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/sign-in');

  const clients = await listClients(session.user.id);

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Clients</h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Save your regular buyers here — select them in one click when creating invoices.
          </p>
        </div>
        <ClientExportButton />
      </div>

      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6">
        <ClientsTable initialClients={clients} />
      </div>
    </div>
  );
}
