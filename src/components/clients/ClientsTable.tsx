'use client';

import { useState } from 'react';
import { ClientFormModal } from './ClientFormModal';
import type { Client } from '@/lib/db/schema/clients';

interface ClientsTableProps {
  initialClients: Client[];
}

export function ClientsTable({ initialClients }: ClientsTableProps) {
  const [clientList, setClientList] = useState<Client[]>(initialClients);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleSaved(saved: Client) {
    setClientList((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
    setEditingClient(null);
    setShowAddModal(false);
  }

  async function handleDelete(client: Client) {
    if (!confirm(`Delete "${client.businessName}"? This cannot be undone.`)) return;

    setDeletingId(client.id);
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
      if (res.ok) {
        setClientList((prev) => prev.filter((c) => c.id !== client.id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[var(--foreground-muted)]">{clientList.length} client{clientList.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-medium rounded-lg transition-all hover:-translate-y-px"
        >
          + Add Client
        </button>
      </div>

      {clientList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-[var(--border)] rounded-xl">
          <svg className="h-10 w-10 text-[var(--foreground-subtle)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-[var(--foreground-muted)] mb-3 text-sm">No clients yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-medium rounded-lg transition-all hover:-translate-y-px"
          >
            Add your first client
          </button>
        </div>
      ) : (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Business Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">NTN / CNIC</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Province</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clientList.map((client) => (
                <tr key={client.id} className="hover:bg-[var(--surface-2)] transition-colors border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">{client.businessName}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-[var(--foreground-muted)]">
                    {client.ntnCnic ?? <span className="text-[var(--foreground-subtle)]">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-[var(--foreground)]">
                    {client.province ?? <span className="text-[var(--foreground-subtle)]">—</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    {client.registrationType ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        client.registrationType === 'Registered'
                          ? 'bg-[var(--positive-bg)] text-[var(--positive)]'
                          : 'bg-[var(--surface-3)] text-[var(--foreground-muted)]'
                      }`}>
                        {client.registrationType}
                      </span>
                    ) : (
                      <span className="text-[var(--foreground-subtle)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => setEditingClient(client)}
                      className="text-[var(--primary)] hover:text-[var(--primary-hover)] text-xs font-medium mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(client)}
                      disabled={deletingId === client.id}
                      className="text-[var(--error)] hover:opacity-80 text-xs font-medium disabled:opacity-50"
                    >
                      {deletingId === client.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {(showAddModal || editingClient) && (
        <ClientFormModal
          client={editingClient}
          onClose={() => { setShowAddModal(false); setEditingClient(null); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
