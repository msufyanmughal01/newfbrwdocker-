"use client";

import { useState, useRef } from "react";
import Image from "next/image";

const inp = "mt-1 block w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors";
const lbl = "block text-sm font-medium text-[var(--foreground-muted)]";

export function SettingsClient() {
  const [address, setAddress] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoMsg, setLogoMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!loaded) {
    fetch("/api/settings/business-profile")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.profile) {
          setAddress(d.profile.address ?? "");
          if (d.profile.logoPath) setLogoPreview(`${d.profile.logoPath}?t=${Date.now()}`);
        }
        setLoaded(true);
      });
  }

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(""); setSaving(true);
    try {
      const r = await fetch("/api/settings/business-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      setMsg(r.ok ? "Address saved." : `Error: ${(await r.json()).error || "Failed"}`);
    } catch { setMsg("Error: Failed to save."); } finally { setSaving(false); }
  };

  const uploadLogo = async (file: File) => {
    setLogoMsg(""); setLogoUploading(true);
    const formData = new FormData();
    formData.append("logo", file);
    try {
      const r = await fetch("/api/settings/business-profile/logo", { method: "POST", body: formData });
      const json = await r.json();
      if (r.ok) {
        setLogoPreview(`${json.logoPath}?t=${Date.now()}`);
        setLogoMsg("Logo updated.");
      } else {
        setLogoMsg(`Error: ${json.error || "Upload failed"}`);
      }
    } catch { setLogoMsg("Error: Upload failed."); } finally { setLogoUploading(false); }
  };

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">Update your business logo and address.</p>
      </div>

      {/* Logo */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6 space-y-4">
        <h2 className="text-base font-semibold text-[var(--foreground)]">Business Logo</h2>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-center overflow-hidden shrink-0">
            {logoPreview ? (
              <Image src={logoPreview} alt="Logo" width={80} height={80} style={{ objectFit: "contain" }} unoptimized />
            ) : (
              <span className="text-xs text-[var(--foreground-subtle)]">No logo</span>
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }}
            />
            <button
              type="button"
              disabled={logoUploading}
              onClick={() => fileRef.current?.click()}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-all"
            >
              {logoUploading ? "Uploading…" : "Upload Logo"}
            </button>
            <p className="text-xs text-[var(--foreground-subtle)]">PNG, JPG or SVG · Max 2 MB</p>
          </div>
        </div>
        {logoMsg && (
          <p className={`text-sm ${logoMsg.startsWith("Error") ? "text-[var(--error)]" : "text-[var(--positive)]"}`}>
            {logoMsg}
          </p>
        )}
      </div>

      {/* Address */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6">
        <h2 className="text-base font-semibold text-[var(--foreground)] mb-1">Business Address</h2>
        <p className="text-sm text-[var(--foreground-muted)] mb-5">Appears on your invoices and compliance records.</p>
        <form onSubmit={saveAddress} className="space-y-4">
          <div>
            <label className={lbl}>Address</label>
            <textarea
              className={`${inp} resize-none`}
              rows={3}
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Street address, city, postal code"
            />
          </div>
          {msg && (
            <p className={`text-sm ${msg.startsWith("Error") ? "text-[var(--error)]" : "text-[var(--positive)]"}`}>
              {msg}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-all"
          >
            {saving ? "Saving…" : "Save Address"}
          </button>
        </form>
      </div>
    </div>
  );
}
