'use client';

// ClientSearch — browseable combobox for selecting saved clients in the invoice form.
// Upgraded from search-only (2+ char min) to browse+filter:
//   - Opens a dropdown listing ALL saved clients on click (no typing required)
//   - Filters client-side on typing (no minimum, no network round-trip)
//   - Keyboard: Escape closes, Enter selects focused item, Tab navigates list

import { useState, useEffect, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { InvoiceFormData } from '@/lib/invoices/validation';

interface ClientResult {
  id: string;
  businessName: string;
  ntnCnic?: string | null;
  province?: string | null;
  address?: string | null;
  registrationType?: string | null;
}

interface ClientSearchProps {
  form: UseFormReturn<InvoiceFormData>;
}

export function ClientSearch({ form }: ClientSearchProps) {
  // T003: Full client list + derived filtered list + error state
  const [allClients, setAllClients] = useState<ClientResult[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedName, setSelectedName] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown and reset filter when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [allClients]); // eslint-disable-line react-hooks/exhaustive-deps

  // T012: Auto-focus the filter input whenever the dropdown opens
  useEffect(() => {
    if (isOpen && filterInputRef.current) {
      filterInputRef.current.focus();
    }
  }, [isOpen]);

  function closeDropdown() {
    setIsOpen(false);
    // T015: Reset filter to full list when closing
    setQuery('');
    setFilteredClients(allClients);
  }

  // T004: Fetch all saved clients when picker opens (once per open; re-fetches after clear)
  async function handleOpen() {
    setIsOpen(true);
    if (allClients.length > 0) return; // Already loaded — skip re-fetch
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        const clients: ClientResult[] = data.clients ?? [];
        setAllClients(clients);
        setFilteredClients(clients);
      } else {
        setError('Could not load clients. Enter buyer details manually.');
      }
    } catch {
      setError('Could not load clients. Enter buyer details manually.');
    } finally {
      setLoading(false);
    }
  }

  // T013: Client-side filter — no API call, no debounce, no minimum length
  function handleInputChange(value: string) {
    setQuery(value);
    if (value === '') {
      setFilteredClients(allClients);
    } else {
      setFilteredClients(
        allClients.filter((c) =>
          c.businessName.toLowerCase().includes(value.toLowerCase())
        )
      );
    }
  }

  // T011: Auto-fill all buyer fields on selection (null-guards preserved from original)
  function handleSelect(client: ClientResult) {
    setSelectedName(client.businessName);
    setIsOpen(false);
    setQuery('');
    setFilteredClients(allClients);

    form.setValue('buyerBusinessName', client.businessName);
    if (client.ntnCnic) form.setValue('buyerNTNCNIC', client.ntnCnic);
    if (client.address) form.setValue('buyerAddress', client.address);
    if (client.registrationType === 'Registered' || client.registrationType === 'Unregistered') {
      form.setValue('buyerRegistrationType', client.registrationType);
    }
    // Province: apply only if value is a valid FBR province (type guard via cast)
    if (client.province) {
      form.setValue('buyerProvince', client.province as InvoiceFormData['buyerProvince']);
    }
  }

  // T017: Clear resets all local state and clears auto-filled text fields
  // Province and registrationType are required enum fields — left for user to adjust
  function handleClear() {
    setSelectedName('');
    setAllClients([]);       // T018: force re-fetch next time picker opens
    setFilteredClients([]);
    setQuery('');
    setIsOpen(false);
    setError(null);
    form.setValue('buyerBusinessName', '');
    form.setValue('buyerNTNCNIC', '');
    form.setValue('buyerAddress', '');
  }

  // T022: Keyboard support — Escape closes the dropdown
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      closeDropdown();
    }
  }

  // T022: Enter or Space on a list item triggers selection
  function handleItemKeyDown(e: React.KeyboardEvent, client: ClientResult) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(client);
    }
  }

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {selectedName ? (
        // Selected state — chip showing chosen client name + Clear button (T016)
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 border border-[var(--primary)] rounded-md bg-[var(--surface-2)] text-sm text-[var(--primary)] font-medium">
            {selectedName}
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-[var(--foreground-muted)] hover:text-[var(--error)] px-2 py-1 rounded transition-colors"
            title="Clear selection"
          >
            ✕ Clear
          </button>
        </div>
      ) : (
        // T006: Click-to-open trigger button — no typing required to see client list
        <button
          type="button"
          onClick={handleOpen}
          className="w-full text-left px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--surface-2)] text-[var(--foreground-subtle)] text-sm hover:border-[var(--primary)] hover:text-[var(--foreground)] transition-colors flex items-center justify-between"
        >
          <span>Select a saved client…</span>
          <span className="text-xs text-[var(--foreground-subtle)]">▾</span>
        </button>
      )}

      {/* T007: Dropdown — visible when isOpen */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--bg-subtle)] border border-[var(--border)] rounded-lg shadow-lg">
          {/* T012: Filter input — autofocused, updates filteredClients client-side */}
          <div className="p-2 border-b border-[var(--border)]">
            <input
              ref={filterInputRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Type to filter…"
              className="w-full px-3 py-1.5 border border-[var(--border)] rounded-md text-sm bg-[var(--surface-2)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20"
            />
          </div>

          <div className="max-h-48 overflow-y-auto">
            {/* T008: Loading state */}
            {loading && (
              <div className="px-4 py-3 text-sm text-[var(--foreground-muted)]">
                Loading clients…
              </div>
            )}

            {/* T010: Error state */}
            {!loading && error && (
              <div className="px-4 py-3 text-sm text-[var(--error)]">
                {error}
              </div>
            )}

            {/* T009: Empty state — user has no saved clients */}
            {!loading && !error && allClients.length === 0 && (
              <div className="px-4 py-3 text-sm text-[var(--foreground-muted)]">
                No saved clients yet.{' '}
                <a
                  href="/clients"
                  className="text-[var(--primary)] underline hover:no-underline"
                >
                  Go to Clients page
                </a>
              </div>
            )}

            {/* T014: No-match state — clients exist but filter found nothing */}
            {!loading && !error && allClients.length > 0 && filteredClients.length === 0 && (
              <div className="px-4 py-3 text-sm text-[var(--foreground-muted)]">
                No clients match &quot;{query}&quot;
              </div>
            )}

            {/* Client list (T007) — rendered from filteredClients */}
            {!loading && !error && filteredClients.map((client) => (
              <button
                key={client.id}
                type="button"
                tabIndex={0}
                onClick={() => handleSelect(client)}
                onKeyDown={(e) => handleItemKeyDown(e, client)}
                className="w-full text-left px-4 py-3 hover:bg-[var(--surface-2)] border-b border-[var(--border)] last:border-0 transition-colors focus:outline-none focus:bg-[var(--surface-2)]"
              >
                <div className="font-medium text-sm text-[var(--foreground)]">{client.businessName}</div>
                <div className="text-xs text-[var(--foreground-muted)] mt-0.5">
                  {[client.ntnCnic, client.province, client.registrationType]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
