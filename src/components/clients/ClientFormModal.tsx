'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Client } from '@/lib/db/schema/clients';

const FBR_PROVINCES = [
  'Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan',
  'Gilgit Baltistan', 'Azad Kashmir', 'Islamabad',
] as const;

const clientSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(255),
  ntnCnic: z
    .string()
    .regex(/^(\d{7}|\d{13}|)$/, 'Must be 7 (NTN) or 13 (CNIC) digits')
    .optional()
    .or(z.literal('')),
  province: z.string().optional(),
  address: z.string().max(1000).optional(),
  registrationType: z.enum(['Registered', 'Unregistered', '']).optional(),
  notes: z.string().max(2000).optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormModalProps {
  client?: Client | null;
  onClose: () => void;
  onSaved: (client: Client) => void;
}

const inputClass = 'w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors';
const labelClass = 'block text-sm font-medium text-[var(--foreground-muted)] mb-1';

export function ClientFormModal({ client, onClose, onSaved }: ClientFormModalProps) {
  const isEdit = !!client;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [ntnValidation, setNtnValidation] = useState<{ ok: boolean; message: string } | null>(null);

  const { register, handleSubmit, control, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      businessName: client?.businessName ?? '',
      ntnCnic: client?.ntnCnic ?? '',
      province: client?.province ?? '',
      address: client?.address ?? '',
      registrationType: (client?.registrationType as 'Registered' | 'Unregistered' | '') ?? '',
      notes: client?.notes ?? '',
    },
  });

  const ntnCnicValue = useWatch({ control, name: 'ntnCnic' }) ?? '';

  async function validateNtn(ntn: string) {
    if (!ntn || !/^\d{7}$|^\d{13}$/.test(ntn)) {
      setNtnValidation({ ok: false, message: 'Enter a valid 7-digit NTN or 13-digit CNIC first' });
      return;
    }
    setValidating(true);
    setNtnValidation(null);
    try {
      const res = await fetch(`/api/fbr/validate-ntn?ntn=${encodeURIComponent(ntn)}`);
      const json = await res.json() as { valid?: boolean; name?: string; error?: string; message?: string };
      if (res.ok && json.valid) {
        setNtnValidation({ ok: true, message: json.name ? `✓ Verified — ${json.name}` : '✓ Verified with FBR' });
      } else {
        setNtnValidation({ ok: false, message: json.message ?? json.error ?? 'Not found in FBR registry' });
      }
    } catch {
      setNtnValidation({ ok: false, message: 'Network error — could not reach FBR' });
    } finally {
      setValidating(false);
    }
  }

  async function onSubmit(data: ClientFormData) {
    setSaving(true);
    setError(null);

    const url = isEdit ? `/api/clients/${client!.id}` : '/api/clients';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? 'Failed to save client');
        return;
      }

      const json = await res.json();
      onSaved(json.client);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-subtle)] border border-[var(--border-strong)] rounded-2xl shadow-[var(--shadow-lg)] w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {isEdit ? 'Edit Client' : 'Add Client'}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] text-xl font-bold leading-none transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className={labelClass}>
              Business Name <span className="text-[var(--error)]">*</span>
            </label>
            <input
              type="text"
              {...register('businessName')}
              className={inputClass}
              placeholder="Acme Corp (Pvt.) Ltd."
            />
            {errors.businessName && (
              <p className="text-xs text-[var(--error)] mt-1">{errors.businessName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>NTN / CNIC</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  {...register('ntnCnic', { onChange: () => setNtnValidation(null) })}
                  className={inputClass}
                  placeholder="7 or 13 digits"
                  maxLength={13}
                />
                <button
                  type="button"
                  onClick={() => validateNtn(ntnCnicValue)}
                  disabled={validating}
                  className="shrink-0 px-3 py-2 text-xs font-medium rounded-lg border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  title="Validate NTN/CNIC with FBR"
                >
                  {validating ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : 'Verify'}
                </button>
              </div>
              {errors.ntnCnic && (
                <p className="text-xs text-[var(--error)] mt-1">{errors.ntnCnic.message}</p>
              )}
              {ntnValidation && (
                <p className={`text-xs mt-1 font-medium ${ntnValidation.ok ? 'text-[var(--positive,#16a34a)]' : 'text-[var(--error)]'}`}>
                  {ntnValidation.message}
                </p>
              )}
            </div>

            <div>
              <label className={labelClass}>Registration</label>
              <select
                {...register('registrationType')}
                className={inputClass}
              >
                <option value="">Select...</option>
                <option value="Registered">Registered</option>
                <option value="Unregistered">Unregistered</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Province</label>
            <select
              {...register('province')}
              className={inputClass}
            >
              <option value="">Select province...</option>
              {FBR_PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Address</label>
            <textarea
              {...register('address')}
              rows={2}
              className={inputClass}
              placeholder="Street, City"
            />
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              {...register('notes')}
              rows={2}
              className={inputClass}
              placeholder="Optional internal notes"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-[var(--error-bg)] border border-[var(--error)]/20 px-4 py-3 text-sm text-[var(--error)]">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[var(--border)] bg-transparent rounded-lg text-sm font-medium text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm font-medium rounded-lg transition-all hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
