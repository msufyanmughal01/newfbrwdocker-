'use client';

import { useState } from 'react';
import { encryptedPut } from '@/lib/crypto/transit-client';

const FBR_PROVINCES = [
  'Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan',
  'Gilgit Baltistan', 'Azad Kashmir', 'Islamabad',
];

interface ProfileData {
  businessName?: string | null;
  businessEmail?: string | null;
  ntnCnic?: string | null;
  cnic?: string | null;
  phone?: string | null;
  province?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  logoPath?: string | null;
  fbrTokenHint?: string | null;
  fbrEnvironment?: string | null;
  fbrPosid?: string | null;
}

interface BusinessProfileFormProps {
  profile: ProfileData | null;
}

const inputClass =
  'w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors';
const labelClass = 'block text-sm font-medium text-[var(--foreground-muted)] mb-1';
const sectionClass = 'border-t border-[var(--border)] pt-6 mt-6 first:border-0 first:pt-0 first:mt-0';

export function BusinessProfileForm({ profile }: BusinessProfileFormProps) {
  // Company info
  const [businessName, setBusinessName] = useState(profile?.businessName ?? '');
  const [businessEmail, setBusinessEmail] = useState(profile?.businessEmail ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [province, setProvince] = useState(profile?.province ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [postalCode, setPostalCode] = useState(profile?.postalCode ?? '');

  // Tax IDs
  const [ntnCnic, setNtnCnic] = useState(profile?.ntnCnic ?? '');
  const [cnic, setCnic] = useState(profile?.cnic ?? '');

  // FBR settings
  const [fbrToken, setFbrToken] = useState('');
  const [fbrEnvironment, setFbrEnvironment] = useState(profile?.fbrEnvironment ?? 'sandbox');
  const [fbrPosid, setFbrPosid] = useState(profile?.fbrPosid ?? '');

  // Logo
  const [logoPreview, setLogoPreview] = useState<string | null>(
    profile?.logoPath ? `${profile.logoPath}?t=${Date.now()}` : null
  );
  const [logoUploading, setLogoUploading] = useState(false);

  // Form state
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    // Client-side validation for NTN / CNIC lengths
    if (ntnCnic && ntnCnic.length !== 7) {
      setSaveError('NTN must be exactly 7 digits');
      return;
    }
    if (cnic && cnic.length !== 13) {
      setSaveError('CNIC must be exactly 13 digits');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const payload: Record<string, unknown> = {
      businessName: businessName.trim() || undefined,
      businessEmail: businessEmail.trim() || undefined,
      ntnCnic: ntnCnic || undefined,
      cnic: cnic || undefined,
      phone: phone.trim() || undefined,
      province: province || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      postalCode: postalCode.trim() || undefined,
      fbrEnvironment,
      fbrPosid: fbrPosid.trim() || null,
    };

    // Only include fbrToken if the user typed a new one
    if (fbrToken.trim()) {
      payload.fbrToken = fbrToken.trim();
    }

    try {
      const res = await encryptedPut('/api/settings/business-profile', payload);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSaveError(err.error ?? 'Failed to save settings');
        return;
      }
      setSaveSuccess(true);
      setFbrToken(''); // clear token field after save
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-0">

      {/* ── Logo ── */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-[var(--foreground)] mb-4">Business Logo</h2>
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

      {/* ── Company Info ── */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-[var(--foreground)] mb-4">Company Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="businessName" className={labelClass}>Business Name</label>
            <input
              id="businessName"
              type="text"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              className={inputClass}
              placeholder="My Company (Pvt) Ltd"
            />
          </div>
          <div>
            <label htmlFor="businessEmail" className={labelClass}>Business Email</label>
            <input
              id="businessEmail"
              type="email"
              value={businessEmail}
              onChange={e => setBusinessEmail(e.target.value)}
              className={inputClass}
              placeholder="info@mycompany.com"
            />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>Phone</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className={inputClass}
              placeholder="+92 300 1234567"
            />
          </div>
          <div>
            <label htmlFor="province" className={labelClass}>Province</label>
            <select
              id="province"
              value={province}
              onChange={e => setProvince(e.target.value)}
              className={inputClass}
            >
              <option value="">Select province…</option>
              {FBR_PROVINCES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="city" className={labelClass}>City</label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              className={inputClass}
              placeholder="Lahore"
            />
          </div>
          <div>
            <label htmlFor="postalCode" className={labelClass}>Postal Code</label>
            <input
              id="postalCode"
              type="text"
              value={postalCode}
              onChange={e => setPostalCode(e.target.value)}
              className={inputClass}
              placeholder="54000"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="address" className={labelClass}>Business Address</label>
            <textarea
              id="address"
              rows={3}
              value={address}
              onChange={e => setAddress(e.target.value)}
              className={`${inputClass} resize-none`}
              placeholder="123 Business Street, Lahore"
            />
          </div>
        </div>
      </div>

      {/* ── Tax Identifiers ── */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-[var(--foreground)] mb-1">Tax Identifiers</h2>
        <p className="text-xs text-[var(--foreground-muted)] mb-4">
          Stored encrypted. These are auto-filled as seller info on every new invoice.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="ntnCnic" className={labelClass}>NTN (7 digits)</label>
            <input
              id="ntnCnic"
              type="text"
              inputMode="numeric"
              maxLength={7}
              value={ntnCnic}
              onChange={e => setNtnCnic(e.target.value.replace(/\D/g, '').slice(0, 7))}
              className={inputClass}
              placeholder="1234567"
            />
          </div>
          <div>
            <label htmlFor="cnic" className={labelClass}>CNIC (13 digits)</label>
            <input
              id="cnic"
              type="text"
              inputMode="numeric"
              maxLength={13}
              value={cnic}
              onChange={e => setCnic(e.target.value.replace(/\D/g, '').slice(0, 13))}
              className={inputClass}
              placeholder="3520212345678"
            />
          </div>
        </div>
      </div>

      {/* ── FBR Settings ── */}
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-[var(--foreground)] mb-1">FBR Integration</h2>
        <p className="text-xs text-[var(--foreground-muted)] mb-4">
          Your FBR credentials for digital invoice submission.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fbrEnvironment" className={labelClass}>Environment</label>
            <select
              id="fbrEnvironment"
              value={fbrEnvironment}
              onChange={e => setFbrEnvironment(e.target.value)}
              className={inputClass}
            >
              <option value="sandbox">Sandbox (Testing)</option>
              <option value="production">Production (Live)</option>
            </select>
          </div>
          <div>
            <label htmlFor="fbrPosid" className={labelClass}>FBR POS ID</label>
            <input
              id="fbrPosid"
              type="text"
              value={fbrPosid}
              onChange={e => setFbrPosid(e.target.value)}
              className={inputClass}
              placeholder="Your FBR Point of Sale ID"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="fbrToken" className={labelClass}>
              FBR Bearer Token
              {profile?.fbrTokenHint && (
                <span className="ml-2 font-mono text-[var(--foreground-subtle)]">
                  (saved: {profile.fbrTokenHint})
                </span>
              )}
            </label>
            <input
              id="fbrToken"
              type="password"
              value={fbrToken}
              onChange={e => setFbrToken(e.target.value)}
              className={inputClass}
              placeholder={profile?.fbrTokenHint ? 'Enter new token to replace existing…' : 'Paste your FBR bearer token'}
              autoComplete="new-password"
            />
            <p className="text-xs text-[var(--foreground-subtle)] mt-1">
              Leave blank to keep the existing token. Token is stored encrypted.
            </p>
          </div>
        </div>
      </div>

      {/* ── Errors / Success ── */}
      {saveError && (
        <div className="rounded-lg bg-[var(--error-bg)] border border-[var(--error)]/20 px-4 py-3 text-sm text-[var(--error)] mt-4">
          {saveError}
        </div>
      )}
      {saveSuccess && (
        <div className="rounded-lg bg-[var(--positive-bg)] border border-[var(--positive)]/20 px-4 py-3 text-sm text-[var(--positive)] mt-4">
          Settings saved successfully.
        </div>
      )}

      {/* ── Save button ── */}
      <div className="pt-6 border-t border-[var(--border)] mt-6">
        <button
          type="submit"
          disabled={saving || logoUploading}
          className="px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium rounded-lg transition-all hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
}
