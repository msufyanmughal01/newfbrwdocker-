'use client';

import { useState } from 'react';

interface BusinessProfileFormProps {
  profile: {
    address?: string | null;
    logoPath?: string | null;
  } | null;
}

const inputClass = 'w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors';
const labelClass = 'block text-sm font-medium text-[var(--foreground-muted)] mb-1';

export function BusinessProfileForm({ profile }: BusinessProfileFormProps) {
  const [address, setAddress] = useState(profile?.address ?? '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    profile?.logoPath ? `${profile.logoPath}?t=${Date.now()}` : null
  );
  const [logoUploading, setLogoUploading] = useState(false);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSaveError('Logo file exceeds 5MB limit');
      return;
    }

    setLogoUploading(true);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await fetch('/api/settings/business-profile/logo', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const json = await res.json();
        setLogoPreview(`${json.logoPath}?t=${Date.now()}`);
      } else {
        const err = await res.json().catch(() => ({}));
        setSaveError(err.error ?? 'Logo upload failed');
      }
    } catch {
      setSaveError('Logo upload failed. Please try again.');
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleSaveAddress(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/settings/business-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveError(err.error ?? 'Failed to save address');
        return;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div>
        <label className={labelClass}>Business Logo</label>
        <div className="flex items-center gap-4">
          {logoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoPreview}
              alt="Business logo"
              className="h-16 w-16 rounded-lg object-contain border border-[var(--border)] bg-[var(--surface-2)]"
            />
          ) : (
            <div className="h-16 w-16 rounded-lg border-2 border-dashed border-[var(--border)] flex items-center justify-center text-[var(--foreground-subtle)] text-xs">
              No logo
            </div>
          )}
          <div>
            <label className="cursor-pointer inline-flex items-center px-3 py-2 border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] rounded-lg text-sm font-medium text-[var(--foreground-muted)] transition-colors">
              {logoUploading ? 'Uploading...' : 'Upload Logo'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                className="sr-only"
                onChange={handleLogoChange}
                disabled={logoUploading}
              />
            </label>
            <p className="text-xs text-[var(--foreground-subtle)] mt-1">JPG, PNG, WebP, SVG — max 5MB</p>
          </div>
        </div>
      </div>

      {/* Address */}
      <form onSubmit={handleSaveAddress} className="space-y-4">
        <div>
          <label htmlFor="address" className={labelClass}>
            Business Address
          </label>
          <textarea
            id="address"
            rows={3}
            value={address}
            onChange={e => setAddress(e.target.value)}
            className={`${inputClass} resize-none`}
            placeholder="123 Business Street, Lahore"
          />
        </div>

        {saveError && (
          <div className="rounded-lg bg-[var(--error-bg)] border border-[var(--error)]/20 px-4 py-3 text-sm text-[var(--error)]">
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="rounded-lg bg-[var(--positive-bg)] border border-[var(--positive)]/20 px-4 py-3 text-sm text-[var(--positive)]">
            Address saved successfully.
          </div>
        )}

        <button
          type="submit"
          disabled={saving || logoUploading}
          className="px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium rounded-lg transition-all hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Address'}
        </button>
      </form>
    </div>
  );
}
