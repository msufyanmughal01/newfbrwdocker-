'use client';

// HSCodeMasterManager — add/remove pinned HS codes from personal master list

import { useState, useEffect, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';

interface PinnedCode {
  id: string;
  hsCode: string;
  description: string;
  uom: string | null;
}

interface FBRCodeResult {
  hS_CODE: string;
  description: string;
}

export function HSCodeMasterManager() {
  const [codes, setCodes] = useState<PinnedCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FBRCodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pinning, setPinning] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hs-codes/master');
      if (res.ok) {
        const data = await res.json();
        setCodes(data.codes ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCodes();
  }, [fetchCodes]);

  const searchFBR = useDebouncedCallback(async (q: string) => {
    if (q.length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/fbr/reference/hs-codes?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results ?? []);
      }
    } finally {
      setIsSearching(false);
    }
  }, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    searchFBR(val);
  };

  const handlePin = async (result: FBRCodeResult) => {
    setPinning(result.hS_CODE);
    setError(null);
    try {
      const res = await fetch('/api/hs-codes/master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hsCode: result.hS_CODE,
          description: result.description,
        }),
      });
      if (res.status === 409) {
        setError(`${result.hS_CODE} is already pinned.`);
        return;
      }
      if (!res.ok) {
        setError('Failed to pin HS code. Please try again.');
        return;
      }
      setSearchQuery('');
      setSearchResults([]);
      await fetchCodes();
    } finally {
      setPinning(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    setError(null);
    try {
      const res = await fetch(`/api/hs-codes/master/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setError('Failed to remove HS code.');
        return;
      }
      await fetchCodes();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search to pin */}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-1">
          Search FBR HS Codes to Pin
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Type at least 3 characters to search..."
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors"
          />
          {isSearching && (
            <span className="absolute right-3 top-2.5">
              <svg className="h-4 w-4 animate-spin text-[var(--foreground-subtle)]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </span>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="mt-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] divide-y divide-[var(--border)]">
            {searchResults.slice(0, 10).map((result) => (
              <div
                key={result.hS_CODE}
                className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-[var(--surface-2)] transition-colors"
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[var(--primary)] shrink-0">{result.hS_CODE}</span>
                  <span className="text-xs text-[var(--foreground-muted)] truncate">{result.description}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handlePin(result)}
                  disabled={pinning === result.hS_CODE}
                  className="ml-3 shrink-0 rounded-lg bg-[var(--primary)] px-2 py-1 text-xs font-medium text-white hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-all"
                >
                  {pinning === result.hS_CODE ? 'Pinning...' : '+ Pin'}
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="mt-2 text-sm text-[var(--error)]">{error}</p>
        )}
      </div>

      {/* Pinned codes list */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground-muted)] mb-2">
          Pinned HS Codes ({codes.length})
        </h3>

        {loading ? (
          <div className="text-sm text-[var(--foreground-subtle)] py-4 text-center">Loading...</div>
        ) : codes.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-[var(--border)] py-8 text-center">
            <p className="text-sm text-[var(--foreground-muted)]">No HS codes pinned yet.</p>
            <p className="text-xs text-[var(--foreground-subtle)] mt-1">Search above to add frequently used codes.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">HS Code</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Description</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">UOM</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => (
                  <tr key={code.id} className="hover:bg-[var(--surface-2)] transition-colors border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold text-[var(--primary)]">
                      ★ {code.hsCode}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[var(--foreground)] max-w-xs truncate">
                      {code.description}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-[var(--foreground-muted)]">
                      {code.uom ?? '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => handleDelete(code.id)}
                        disabled={deleting === code.id}
                        className="text-xs text-[var(--error)] hover:bg-[var(--error-bg)] rounded-lg px-2 py-1 transition-colors disabled:opacity-50"
                      >
                        {deleting === code.id ? 'Removing...' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
