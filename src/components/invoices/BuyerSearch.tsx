'use client';

// BuyerSearch — autocomplete from buyer registry
// On selection: fills all buyer fields (NTN, businessName, province, address, registrationType)

import { useState, useRef, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import type { UseFormReturn } from 'react-hook-form';
import type { InvoiceFormData } from '@/lib/invoices/validation';
import { FBR_PROVINCES } from '@/lib/invoices/fbr-reference-data';

type Province = (typeof FBR_PROVINCES)[number];
function isValidProvince(val: string | null): val is Province {
  return FBR_PROVINCES.includes(val as Province);
}

interface BuyerRecord {
  id: string;
  ntnCnic: string;
  businessName: string;
  province: string | null;
  address: string | null;
  registrationType: string | null;
  statlStatus: string | null;
  useCount: number;
}

interface BuyerSearchProps {
  form: UseFormReturn<InvoiceFormData>;
}

export function BuyerSearch({ form }: BuyerSearchProps) {
  const [query, setQuery] = useState('');
  const [buyers, setBuyers] = useState<BuyerRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useDebouncedCallback(async (q: string) => {
    if (q.length < 2) {
      setBuyers([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/buyers?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data = await res.json();
      setBuyers(data.buyers ?? []);
      setIsOpen((data.buyers ?? []).length > 0);
    } catch {
      setBuyers([]);
    } finally {
      setIsLoading(false);
    }
  }, 300);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    form.setValue('buyerBusinessName', val);
    search(val);
  };

  const handleSelect = (buyer: BuyerRecord) => {
    form.setValue('buyerBusinessName', buyer.businessName);
    form.setValue('buyerNTNCNIC', buyer.ntnCnic);
    if (buyer.province && isValidProvince(buyer.province)) form.setValue('buyerProvince', buyer.province);
    if (buyer.address) form.setValue('buyerAddress', buyer.address);
    if (buyer.registrationType) {
      form.setValue(
        'buyerRegistrationType',
        buyer.registrationType.includes('Unregistered') ? 'Unregistered' : 'Registered'
      );
    }
    setQuery(buyer.businessName);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && buyers.length > 0 && setIsOpen(true)}
          placeholder="Type to search saved buyers..."
          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] focus:outline-none bg-[var(--surface-2)] text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] text-sm transition-colors"
        />
        {isLoading && (
          <span className="absolute right-2 top-2.5">
            <svg className="h-4 w-4 animate-spin text-[var(--foreground-subtle)]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </span>
        )}
      </div>

      {isOpen && buyers.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded border border-[var(--border)] bg-[var(--surface)] shadow-lg">
          {buyers.map((buyer) => (
            <button
              key={buyer.id}
              type="button"
              onClick={() => handleSelect(buyer)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-2)] border-b border-[var(--border)] last:border-0"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium">{buyer.businessName}</span>
                  <span className="ml-2 text-xs text-[var(--foreground-muted)] font-mono">{buyer.ntnCnic}</span>
                </div>
                <div className="text-right">
                  {buyer.province && (
                    <span className="text-xs text-[var(--foreground-subtle)]">{buyer.province}</span>
                  )}
                  <span className="ml-2 text-xs text-[var(--foreground-subtle)]">×{buyer.useCount}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
