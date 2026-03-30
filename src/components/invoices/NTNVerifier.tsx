'use client';

// NTNVerifier — inline status badge for buyer NTN/CNIC verification via STATL
// Triggers on onBlur of the NTN field with 500ms debounce

import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import type { UseFormReturn } from 'react-hook-form';
import type { InvoiceFormData } from '@/lib/invoices/validation';

interface NTNVerifierProps {
  form: UseFormReturn<InvoiceFormData>;
  ntnCnic: string;
}

type VerifyStatus = 'idle' | 'verifying' | 'active' | 'inactive' | 'unknown';

export function NTNVerifier({ form, ntnCnic }: NTNVerifierProps) {
  const [status, setStatus] = useState<VerifyStatus>('idle');
  const [warning, setWarning] = useState<string | null>(null);

  const verify = useDebouncedCallback(async (value: string) => {
    if (!value || value.trim().length < 7) {
      setStatus('idle');
      return;
    }

    setStatus('verifying');
    setWarning(null);

    try {
      const res = await fetch('/api/fbr/verify-ntn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ntnCnic: value.trim() }),
      });

      const data = await res.json();

      setStatus(data.statlStatus ?? 'unknown');
      if (data.warning) setWarning(data.warning);

      // Auto-set buyer registration type if known
      if (data.registrationType) {
        const regType = data.registrationType.includes('Unregistered')
          ? 'Unregistered'
          : 'Registered';
        form.setValue('buyerRegistrationType', regType as 'Registered' | 'Unregistered');
      }
    } catch {
      setStatus('unknown');
      setWarning('Could not verify NTN. Proceed manually.');
    }
  }, 500);


  if (status === 'idle') {
    return (
      <button
        type="button"
        onClick={() => ntnCnic && verify(ntnCnic)}
        className="text-xs text-[var(--primary)] hover:underline mt-1 block"
      >
        Verify NTN →
      </button>
    );
  }

  return (
    <div className="mt-1">
      {status === 'verifying' && (
        <span className="inline-flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
          <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Verifying...
        </span>
      )}

      {status === 'active' && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--positive-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--positive)]">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
          Active
        </span>
      )}

      {status === 'inactive' && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--warning-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--warning)]">
          ⚠ Inactive — verify before submitting
        </span>
      )}

      {status === 'unknown' && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs text-[var(--foreground-muted)]">
          Could not verify
        </span>
      )}

      {warning && (
        <p className="mt-0.5 text-xs text-[var(--warning)]">{warning}</p>
      )}

      {/* Re-verify link */}
      {status !== 'verifying' && (
        <button
          type="button"
          onClick={() => ntnCnic && verify(ntnCnic)}
          className="ml-2 text-xs text-[var(--primary)] hover:underline"
        >
          Re-verify
        </button>
      )}
    </div>
  );
}

export { type NTNVerifierProps };
