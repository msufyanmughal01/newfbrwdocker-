'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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

  const { register, handleSubmit, formState: { errors } } = useForm<ClientFormData>({
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
              <input
                type="text"
                {...register('ntnCnic')}
                className={inputClass}
                placeholder="7 or 13 digits"
                maxLength={13}
              />
              {errors.ntnCnic && (
                <p className="text-xs text-[var(--error)] mt-1">{errors.ntnCnic.message}</p>
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
