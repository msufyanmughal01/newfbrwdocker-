"use client";

import { useState, useRef } from "react";
import type { BusinessProfile } from "@/lib/db/schema/business-profiles";

type Profile = Omit<BusinessProfile, 'fbrTokenEncrypted'>;

interface CompanyTabProps {
  profile: Profile | null;
}

const FBR_PROVINCES = [
  'Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan',
  'Gilgit Baltistan', 'Azad Kashmir', 'Islamabad',
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid var(--border, #e2e8f0)",
  borderRadius: "8px",
  padding: "9px 12px",
  fontSize: "14px",
  color: "var(--foreground, #0f172a)",
  background: "var(--surface, #f8faff)",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--foreground-muted, #64748b)",
  marginBottom: "5px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const sectionStyle: React.CSSProperties = {
  background: "var(--surface, #fff)",
  border: "1px solid var(--border, #e2e8f0)",
  borderRadius: "12px",
  padding: "20px",
  marginBottom: "16px",
};

export function CompanyTab({ profile }: CompanyTabProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [businessName, setBusinessName] = useState(profile?.businessName ?? "");
  const [businessEmail, setBusinessEmail] = useState(profile?.businessEmail ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [province, setProvince] = useState(profile?.province ?? "");
  const [address, setAddress] = useState(profile?.address ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [postalCode, setPostalCode] = useState(profile?.postalCode ?? "");
  const [invoiceAddressType, setInvoiceAddressType] = useState(profile?.invoiceAddressType ?? "business");
  const [invoiceNote, setInvoiceNote] = useState(profile?.invoiceNote ?? "");
  const [invoiceNoteMode, setInvoiceNoteMode] = useState(profile?.invoiceNoteMode ?? "ask");
  const [paymentDetailsMode, setPaymentDetailsMode] = useState(profile?.paymentDetailsMode ?? "ask");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(profile?.logoPath ?? null);

  const pd = (profile?.paymentDetails as Record<string, string> | null) ?? {};
  const [bankName, setBankName] = useState(pd.bankName ?? "");
  const [iban, setIban] = useState(pd.iban ?? "");
  const [accountTitle, setAccountTitle] = useState(pd.accountTitle ?? "");
  const [branch, setBranch] = useState(pd.branch ?? "");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/settings/business-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName || undefined,
          businessEmail: businessEmail || undefined,
          phone: phone || undefined,
          province: province || undefined,
          address: address || undefined,
          city: city || undefined,
          postalCode: postalCode || undefined,
          invoiceAddressType,
          invoiceNote: invoiceNote || null,
          invoiceNoteMode,
          paymentDetails: (bankName || iban || accountTitle || branch) ? { bankName, iban, accountTitle, branch } : null,
          paymentDetailsMode,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 400 * 1024) {
      setError("Logo must be under 400KB");
      return;
    }
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch("/api/settings/business-profile/logo", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setLogoPreview(data.logoPath || data.profile?.logoPath || null);
    } catch {
      setError("Logo upload failed.");
    } finally {
      setLogoUploading(false);
    }
  };

  return (
    <div>
      {/* Logo */}
      <div style={sectionStyle}>
        <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "14px", color: "var(--foreground)" }}>Company Logo</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div style={{
            width: "80px", height: "80px", borderRadius: "10px",
            border: "1.5px solid var(--border)", background: "#f8faff",
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
          }}>
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            ) : (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--foreground-subtle)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            )}
          </div>
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={logoUploading}
              style={{
                background: "#1d4ed8", color: "#fff", border: "none",
                borderRadius: "7px", padding: "8px 16px", fontSize: "13px",
                fontWeight: 600, cursor: "pointer",
              }}
            >
              {logoUploading ? "Uploading..." : "Upload Logo"}
            </button>
            <p style={{ fontSize: "11px", color: "var(--foreground-muted)", marginTop: "4px" }}>PNG or JPG, max 400KB</p>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" style={{ display: "none" }} onChange={handleLogoUpload} />
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div style={sectionStyle}>
        <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "14px", color: "var(--foreground)" }}>Company Information</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Company Name</label>
            <input style={inputStyle} value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Your Business Name" />
          </div>
          <div>
            <label style={labelStyle}>Business Email</label>
            <input type="email" style={inputStyle} value={businessEmail} onChange={e => setBusinessEmail(e.target.value)} placeholder="billing@yourcompany.pk" />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+92 300 0000000" />
          </div>
          <div>
            <label style={labelStyle}>Postal Code</label>
            <input style={inputStyle} value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="54000" />
          </div>
        </div>
      </div>

      {/* Invoice Address Type */}
      <div style={sectionStyle}>
        <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "6px", color: "var(--foreground)" }}>Invoice Address</h3>
        <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "14px" }}>Write your address below and choose which one appears on printed invoices.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

          {/* Business Address option */}
          <div
            onClick={() => setInvoiceAddressType("business")}
            style={{
              borderRadius: "10px", cursor: "pointer",
              border: `2px solid ${invoiceAddressType === "business" ? "var(--primary)" : "var(--border)"}`,
              background: invoiceAddressType === "business" ? "var(--primary-subtle)" : "var(--surface-2)",
              overflow: "hidden", transition: "border-color 0.15s, background 0.15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px" }}>
              <input
                type="radio" name="invoiceAddressType" value="business"
                checked={invoiceAddressType === "business"}
                onChange={e => setInvoiceAddressType(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--foreground)" }}>Business Address</div>
                  <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>Address you type below</div>
                </div>
              </div>
            </div>
            {/* Editable address textarea inside card */}
            <div style={{ padding: "0 14px 12px", borderTop: `1px solid ${invoiceAddressType === "business" ? "var(--primary)" : "var(--border)"}` }}>
              <textarea
                style={{ ...inputStyle, minHeight: "72px", resize: "vertical", marginTop: "10px", fontSize: "13px" }}
                value={address}
                onChange={e => { e.stopPropagation(); setAddress(e.target.value); }}
                onClick={e => e.stopPropagation()}
                placeholder="Enter your full business address (street, area, city, postal code)..."
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px", marginTop: "8px" }}>
                <input
                  style={{ ...inputStyle, fontSize: "13px" }}
                  value={city} onChange={e => setCity(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  placeholder="City"
                />
                <select
                  style={{ ...inputStyle, fontSize: "13px" }}
                  value={province} onChange={e => setProvince(e.target.value)}
                  onClick={e => e.stopPropagation()}
                >
                  <option value="">Province</option>
                  {FBR_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* FBR Address option */}
          <label style={{
            display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer",
            padding: "12px 14px", borderRadius: "10px",
            border: `2px solid ${invoiceAddressType === "fbr" ? "var(--primary)" : "var(--border)"}`,
            background: invoiceAddressType === "fbr" ? "var(--primary-subtle)" : "var(--surface-2)",
            transition: "border-color 0.15s, background 0.15s",
          }}>
            <input type="radio" name="invoiceAddressType" value="fbr" checked={invoiceAddressType === "fbr"} onChange={e => setInvoiceAddressType(e.target.value)} style={{ marginTop: "2px" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--foreground-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--foreground)" }}>FBR Registered Address</div>
                <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>Address on file with FBR — auto-filled from your NTN registration</div>
              </div>
            </div>
          </label>

        </div>
      </div>

      {/* Supplier Preview */}
      <div style={sectionStyle}>
        <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "10px", color: "var(--foreground)" }}>Supplier Section Preview</h3>
        <div style={{
          background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "8px",
          padding: "14px 16px", fontSize: "13px", lineHeight: "1.75",
          color: "var(--foreground)",
        }}>
          <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "2px" }}>{businessName || "Your Business Name"}</div>
          <div style={{ color: "var(--foreground-muted)" }}>
            {invoiceAddressType === "fbr" ? "(FBR Registered Address — auto-filled)" : (address || "Your Business Address")}
          </div>
          <div style={{ color: "var(--foreground-muted)" }}>{[city, province].filter(Boolean).join(", ") || "City, Province"}</div>
          {phone && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", color: "var(--foreground-muted)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.57 3.54 2 2 0 0 1 3.54 1.36h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l1.68-1.68a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              {phone}
            </div>
          )}
          {businessEmail && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--foreground-muted)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,12 2,6"/>
              </svg>
              {businessEmail}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Note */}
      <div style={sectionStyle}>
        <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "6px", color: "var(--foreground)" }}>Invoice Note</h3>
        <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "10px" }}>This note appears at the bottom of printed invoices (terms, warranty, etc.)</p>
        <textarea
          style={{ ...inputStyle, minHeight: "80px", resize: "vertical", marginBottom: "10px" }}
          value={invoiceNote}
          onChange={e => setInvoiceNote(e.target.value)}
          placeholder="E.g. Payment due within 30 days. All goods sold are non-returnable."
        />
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[{ v: "always", l: "Always include" }, { v: "never", l: "Never include" }, { v: "ask", l: "Ask at print time" }].map(opt => (
            <label key={opt.v} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
              <input type="radio" name="invoiceNoteMode" value={opt.v} checked={invoiceNoteMode === opt.v} onChange={e => setInvoiceNoteMode(e.target.value)} />
              {opt.l}
            </label>
          ))}
        </div>
      </div>

      {/* Payment Details */}
      <div style={sectionStyle}>
        <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "6px", color: "var(--foreground)" }}>Payment Details</h3>
        <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "12px" }}>Bank details shown on invoices for payment.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "10px" }}>
          {[{ lbl: "Bank Name", val: bankName, set: setBankName, ph: "Meezan Bank" }, { lbl: "IBAN", val: iban, set: setIban, ph: "PK00MEZN0000000000000000" }, { lbl: "Account Title", val: accountTitle, set: setAccountTitle, ph: "Business Name" }, { lbl: "Branch", val: branch, set: setBranch, ph: "Main Branch, Lahore" }].map(f => (
            <div key={f.lbl}>
              <label style={labelStyle}>{f.lbl}</label>
              <input style={inputStyle} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[{ v: "always", l: "Always include" }, { v: "never", l: "Never include" }, { v: "ask", l: "Ask at print time" }].map(opt => (
            <label key={opt.v} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
              <input type="radio" name="paymentDetailsMode" value={opt.v} checked={paymentDetailsMode === opt.v} onChange={e => setPaymentDetailsMode(e.target.value)} />
              {opt.l}
            </label>
          ))}
        </div>
      </div>

      {error && <div style={{ color: "#dc2626", fontSize: "13px", marginBottom: "12px" }}>{error}</div>}
      {saved && <div style={{ color: "#16a34a", fontSize: "13px", marginBottom: "12px" }}>✓ Changes saved successfully</div>}

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          background: saving ? "#93c5fd" : "#1d4ed8", color: "#fff", border: "none",
          borderRadius: "9px", padding: "11px 28px", fontSize: "14px",
          fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
        }}
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
