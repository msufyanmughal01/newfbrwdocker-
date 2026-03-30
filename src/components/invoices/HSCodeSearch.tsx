'use client';

// HSCodeSearch — searchable HS code dropdown
// On focus: shows pinned master codes instantly (no minimum chars)
// On typing (3+ chars): additionally shows FBR reference API results below pinned section

import { useState, useRef, useEffect, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import type { UseFormReturn } from 'react-hook-form';
import type { InvoiceFormData } from '@/lib/invoices/validation';

interface HSCodeSearchProps {
  form: UseFormReturn<InvoiceFormData>;
  index: number;
  onUOMChange?: (uom: string) => void;
}

interface HSCodeResult {
  hS_CODE: string;
  description: string;
}

interface MasterCode {
  id: string;
  hsCode: string;
  description: string;
  uom: string | null;
}

export function HSCodeSearch({ form, index, onUOMChange }: HSCodeSearchProps) {
  const [query, setQuery] = useState('');
  const [masterCodes, setMasterCodes] = useState<MasterCode[]>([]);
  const [fbrResults, setFbrResults] = useState<HSCodeResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUOM, setIsLoadingUOM] = useState(false);
  const [masterLoaded, setMasterLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Current HS code value from form
  const currentHSCode = form.watch(`items.${index}.hsCode` as const);

  // Initialize query with current form value
  useEffect(() => {
    if (currentHSCode && !query) {
      setQuery(currentHSCode);
    }
  }, [currentHSCode, query]);

  // Load master codes on mount (once)
  useEffect(() => {
    if (masterLoaded) return;
    fetch('/api/hs-codes/master')
      .then((res) => res.ok ? res.json() : { codes: [] })
      .then((data) => {
        setMasterCodes(data.codes ?? []);
        setMasterLoaded(true);
      })
      .catch(() => setMasterLoaded(true));
  }, [masterLoaded]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced FBR search (only for 3+ chars)
  const searchFBR = useDebouncedCallback(async (q: string) => {
    if (q.length < 3) {
      setFbrResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/fbr/reference/hs-codes?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data = await res.json();
      setFbrResults(data.results ?? []);
    } catch {
      setFbrResults([]);
    } finally {
      setIsLoading(false);
    }
  }, 300);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    form.setValue(`items.${index}.hsCode` as const, val);
    setIsOpen(true);
    searchFBR(val);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  // Filter master codes by query
  const filteredMaster = query
    ? masterCodes.filter(
        (c) =>
          c.hsCode.toLowerCase().includes(query.toLowerCase()) ||
          c.description.toLowerCase().includes(query.toLowerCase())
      )
    : masterCodes;

  const hasResults = filteredMaster.length > 0 || fbrResults.length > 0;

  const handleSelect = useCallback(
    async (hsCode: string, description: string, uom?: string | null) => {
      setQuery(hsCode);
      form.setValue(`items.${index}.hsCode` as const, hsCode);
      form.setValue(`items.${index}.productDescription` as const, description);
      setIsOpen(false);

      // If UOM known from master, set it directly
      if (uom) {
        form.setValue(`items.${index}.uom` as const, uom);
        onUOMChange?.(uom);
        return;
      }

      // Auto-populate UOM from FBR reference
      setIsLoadingUOM(true);
      try {
        const res = await fetch(
          `/api/fbr/reference/hs-uom?hs_code=${encodeURIComponent(hsCode)}`
        );
        if (res.ok) {
          const uomData = await res.json();
          if (Array.isArray(uomData) && uomData[0]?.description) {
            const uomDesc = uomData[0].description;
            form.setValue(`items.${index}.uom` as const, uomDesc);
            onUOMChange?.(uomDesc);
          }
        }
      } catch {
        // UOM auto-populate failed — leave field unchanged
      } finally {
        setIsLoadingUOM(false);
      }
    },
    [form, index, onUOMChange]
  );

  const fieldError = form.formState.errors.items?.[index]?.hsCode;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder="Search HS code..."
          disabled={isLoadingUOM}
          className={`
            w-full rounded border px-2 py-1 text-sm bg-[var(--surface-2)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors
            ${fieldError ? 'border-[var(--error)] bg-[var(--error-bg)]' : 'border-[var(--border)]'}
            ${isLoadingUOM ? 'opacity-60 cursor-not-allowed' : ''}
          `}
        />
        {(isLoading || isLoadingUOM) && (
          <span className="absolute right-2 top-1.5">
            <svg className="h-4 w-4 animate-spin text-[var(--foreground-subtle)]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </span>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && hasResults && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded border border-[var(--border)] bg-[var(--surface)] shadow-lg">
          {/* Master codes section */}
          {filteredMaster.length > 0 && (
            <>
              <div className="px-3 py-1 bg-[var(--primary-subtle)] border-b border-[var(--border)]">
                <span className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide">
                  ★ Master Codes
                </span>
              </div>
              {filteredMaster.map((code) => (
                <button
                  key={code.id}
                  type="button"
                  onClick={() => handleSelect(code.hsCode, code.description, code.uom)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--surface-2)] border-b border-[var(--border)] last:border-0"
                >
                  <span className="font-mono font-semibold text-indigo-700">★ {code.hsCode}</span>
                  <span className="ml-2 text-[var(--foreground-muted)] truncate">{code.description}</span>
                  {code.uom && (
                    <span className="ml-2 text-[var(--foreground-subtle)] text-xs">({code.uom})</span>
                  )}
                </button>
              ))}
            </>
          )}

          {/* FBR reference results section */}
          {fbrResults.length > 0 && (
            <>
              {filteredMaster.length > 0 && (
                <div className="px-3 py-1 bg-[var(--surface-2)] border-b border-[var(--border)]">
                  <span className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wide">
                    FBR Reference
                  </span>
                </div>
              )}
              {fbrResults.map((entry) => (
                <button
                  key={entry.hS_CODE}
                  type="button"
                  onClick={() => handleSelect(entry.hS_CODE, entry.description)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--surface-2)] border-b border-[var(--border)] last:border-0"
                >
                  <span className="font-mono font-semibold text-[var(--primary)]">{entry.hS_CODE}</span>
                  <span className="ml-2 text-[var(--foreground-muted)] truncate">{entry.description}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* No results */}
      {isOpen && !isLoading && !hasResults && query.length >= 3 && (
        <div className="absolute z-50 mt-1 w-full rounded border border-[var(--border)] bg-[var(--surface)] p-3 shadow-lg">
          <p className="text-xs text-[var(--foreground-muted)]">No matching HS codes found</p>
        </div>
      )}
    </div>
  );
}
