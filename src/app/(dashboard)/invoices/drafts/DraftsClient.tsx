'use client';

// DraftsClient — client component for draft search, filter, and actions

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DraftDeleteButton } from './DraftDeleteButton';

interface Draft {
  id: string;
  invoiceType: string;
  invoiceDate: string;
  buyerBusinessName: string;
  updatedAt: string | null;
  grandTotal: string;
}

interface FormDraft {
  id: string;
  lastSaved: string;
  invoiceType: string;
  buyerBusinessName: string;
}

interface DraftsClientProps {
  initialDrafts: Draft[];
  formDrafts: FormDraft[];
}

export function DraftsClient({ initialDrafts, formDrafts }: DraftsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [markingFinal, setMarkingFinal] = useState<string | null>(null);
  const [deletingFormDraft, setDeletingFormDraft] = useState<string | null>(null);
  const [formDraftList, setFormDraftList] = useState<FormDraft[]>(formDrafts);

  const filtered = useMemo(() => {
    return initialDrafts.filter((draft) => {
      const matchesSearch = search
        ? draft.buyerBusinessName.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesFrom = fromDate ? draft.invoiceDate >= fromDate : true;
      const matchesTo = toDate ? draft.invoiceDate <= toDate : true;
      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [initialDrafts, search, fromDate, toDate]);

  const handleMarkAsFinal = async (id: string) => {
    setMarkingFinal(id);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'validated' }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setMarkingFinal(null);
    }
  };

  const inputClass = 'bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors';

  const handleDeleteFormDraft = async (id: string) => {
    if (!confirm('Delete this saved draft? This cannot be undone.')) return;
    setDeletingFormDraft(id);
    try {
      const res = await fetch(`/api/drafts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFormDraftList((prev) => prev.filter((d) => d.id !== id));
      }
    } finally {
      setDeletingFormDraft(null);
    }
  };

  return (
    <div>
      {/* Saved form drafts (from Save Draft button) */}
      {formDraftList.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-3">
            Saved Form Drafts
          </h2>
          <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Buyer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Last Saved</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formDraftList.map((draft) => (
                    <tr key={draft.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors">
                      <td className="px-4 py-3.5 text-[var(--foreground)]">
                        {draft.invoiceType || <span className="text-[var(--foreground-subtle)]">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-[var(--foreground)]">
                        {draft.buyerBusinessName || <span className="text-[var(--foreground-subtle)]">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[var(--foreground-muted)]">
                        {new Date(draft.lastSaved).toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/invoices/new?draftId=${draft.id}`}
                            className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]"
                          >
                            Continue
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteFormDraft(draft.id)}
                            disabled={deletingFormDraft === draft.id}
                            className="text-xs font-medium text-[var(--error)] hover:opacity-80 disabled:opacity-50"
                          >
                            {deletingFormDraft === draft.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Search and filter */}
      <div className="flex flex-wrap gap-3 mb-4 rounded-xl p-4 bg-[var(--surface)] border border-[var(--border)]">
        <input
          type="text"
          placeholder="Search by buyer name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} flex-1 min-w-[200px]`}
        />
        <div className="flex items-center gap-2">
          <label className="text-xs whitespace-nowrap text-[var(--foreground-muted)]">From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs whitespace-nowrap text-[var(--foreground-muted)]">To:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-[var(--border)] rounded-xl">
          <p className="text-[var(--foreground-muted)] mb-3 text-sm">
            {initialDrafts.length === 0 ? 'No drafts' : 'No drafts match your filters'}
          </p>
          <Link
            href="/invoices/new"
            className="px-5 py-2 rounded-lg font-medium text-sm text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all hover:-translate-y-px"
          >
            Create an invoice
          </Link>
        </div>
      ) : (
        <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Invoice ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Buyer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Last Updated</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((draft) => (
                <tr
                  key={draft.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors"
                >
                  <td className="px-4 py-3.5 font-mono text-xs text-[var(--foreground-muted)]">
                    {draft.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3.5 text-[var(--foreground)]">{draft.invoiceType}</td>
                  <td className="px-4 py-3.5 text-[var(--foreground)]">{draft.invoiceDate}</td>
                  <td className="px-4 py-3.5 text-[var(--foreground)]">
                    {draft.buyerBusinessName || <span className="text-[var(--foreground-subtle)]">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-[var(--foreground)]">
                    PKR {parseFloat(draft.grandTotal || '0').toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-[var(--foreground-muted)]">
                    {draft.updatedAt
                      ? new Date(draft.updatedAt).toLocaleString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/invoices/${draft.id}`}
                        className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-hover)]"
                      >
                        Resume
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleMarkAsFinal(draft.id)}
                        disabled={markingFinal === draft.id}
                        className="text-xs rounded-lg px-2 py-1 font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50"
                      >
                        {markingFinal === draft.id ? 'Saving...' : 'Mark Final'}
                      </button>
                      <DraftDeleteButton invoiceId={draft.id} />
                    </div>
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
