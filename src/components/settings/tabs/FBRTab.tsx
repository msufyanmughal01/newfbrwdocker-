"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BusinessProfile } from "@/lib/db/schema/business-profiles";

type Profile = Omit<BusinessProfile, 'fbrTokenEncrypted'>;
type Credential = { type: string; value: string; includeInInvoice: boolean };

interface FBRTabProps {
  profile: Profile | null;
}

/* ── Shared style tokens ──────────────────────────────────── */
const inputBase: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid var(--border)",
  borderRadius: "8px",
  padding: "9px 12px",
  fontSize: "14px",
  color: "var(--foreground)",
  background: "var(--surface-2)",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};
const inputError: React.CSSProperties = {
  ...inputBase,
  border: "1.5px solid var(--error)",
};

const card: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "20px 22px",
  marginBottom: "14px",
};

const sectionHead: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "4px",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  color: "var(--foreground)",
  margin: 0,
};

const sectionSub: React.CSSProperties = {
  fontSize: "12px",
  color: "var(--foreground-muted)",
  margin: "0 0 18px",
  paddingLeft: "24px",   // aligns with title (icon 16px + gap 8px)
};

const fieldLabel: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  color: "var(--foreground-muted)",
  marginBottom: "6px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.07em",
};

const fieldHint: React.CSSProperties = {
  fontSize: "11px",
  color: "var(--foreground-subtle)",
  marginTop: "5px",
  lineHeight: 1.5,
};

const savedBadge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "11px",
  color: "var(--positive)",
  background: "var(--positive-bg)",
  border: "1px solid var(--positive)",
  borderRadius: "20px",
  padding: "2px 8px",
};

/* ── SVG icons ────────────────────────────────────────────── */
function IconWarning() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}
function CheckTick({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="var(--positive)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

/* ── Component ────────────────────────────────────────────── */
export function FBRTab({ profile }: FBRTabProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  /* Environment */
  const [fbrEnvironment, setFbrEnvironment] = useState(profile?.fbrEnvironment ?? "sandbox");

  /* API token — never pre-filled (encrypted) */
  const [fbrToken, setFbrToken] = useState("");

  /* Identity fields — encrypted in DB, shown only when profile has value */
  const [ntn, setNtn] = useState("");
  const [ntnErr, setNtnErr] = useState("");

  const [cnic, setCnic] = useState("");
  const [cnicErr, setCnicErr] = useState("");

  /* STRN — stored in businessCredentials jsonb */
  const existingCreds = (profile?.businessCredentials as Credential[] | null) ?? [];
  const [strn, setStrn] = useState(existingCreds.find(c => c.type === "STRN")?.value ?? "");

  /* Validation */
  const validateNtn = (v: string) => {
    if (!v) { setNtnErr(""); return true; }
    if (!/^\d{7}$/.test(v)) { setNtnErr("NTN must be exactly 7 digits"); return false; }
    setNtnErr(""); return true;
  };
  const validateCnic = (v: string) => {
    if (!v) { setCnicErr(""); return true; }
    if (!/^\d{13}$/.test(v)) { setCnicErr("CNIC must be exactly 13 digits"); return false; }
    setCnicErr(""); return true;
  };

  const handleSave = async () => {
    const ntnOk = validateNtn(ntn);
    const cnicOk = validateCnic(cnic);
    if (!ntnOk || !cnicOk) return;

    setSaving(true);
    setError("");
    try {
      /* Rebuild credentials with updated STRN */
      const otherCreds = existingCreds.filter(c => c.type !== "STRN");
      const newCreds: Credential[] = strn.trim()
        ? [...otherCreds, { type: "STRN", value: strn.trim(), includeInInvoice: true }]
        : otherCreds;

      const payload: Record<string, unknown> = {
        fbrEnvironment,
        businessCredentials: newCreds.length > 0 ? newCreds : null,
      };
      if (fbrToken.trim()) payload.fbrToken = fbrToken.trim();
      if (ntn.trim())      payload.ntnCnic   = ntn.trim();
      if (cnic.trim())     payload.cnic      = cnic.trim();

      const res = await fetch("/api/settings/business-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body?.error ?? "Save failed");
      }

      setSaved(true);
      setFbrToken("");
      setNtn("");
      setCnic("");
      router.refresh();   // invalidate router cache so invoice form picks up new NTN
      setTimeout(() => setSaved(false), 3500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>

      {/* ── Sandbox alert ──────────────────────────────────── */}
      {fbrEnvironment === "sandbox" && (
        <div style={{
          display: "flex", gap: "12px", alignItems: "flex-start",
          background: "var(--warning-bg)",
          border: "1.5px solid var(--warning)",
          borderRadius: "10px", padding: "14px 16px", marginBottom: "16px",
        }}>
          <IconWarning />
          <div>
            <p style={{ fontWeight: 700, color: "var(--warning)", fontSize: "13px", margin: "0 0 3px" }}>
              Sandbox Mode Active
            </p>
            <p style={{ color: "var(--foreground-muted)", fontSize: "12px", margin: 0, lineHeight: 1.55 }}>
              All invoice submissions go to the FBR <strong>test environment</strong> — no real invoices are registered.
              Switch to Production when ready to go live.
            </p>
          </div>
        </div>
      )}

      {/* ── SECTION 1: Business Identity ───────────────────── */}
      <div style={card}>
        <div style={sectionHead}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <circle cx="8" cy="12" r="2"/>
            <line x1="13" y1="10" x2="19" y2="10"/>
            <line x1="13" y1="14" x2="16" y2="14"/>
          </svg>
          <h3 style={sectionTitle}>Business Identity</h3>
        </div>
        <p style={sectionSub}>
          FBR-required identifiers printed on every invoice and sent with each submission.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>

          {/* NTN */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <label style={{ ...fieldLabel, marginBottom: 0 }}>NTN</label>
              {profile?.ntnCnic && <span style={savedBadge}><CheckTick /> Saved</span>}
            </div>
            <input
              style={ntnErr ? inputError : inputBase}
              value={ntn}
              onChange={e => { setNtn(e.target.value); validateNtn(e.target.value); }}
              placeholder={profile?.ntnCnic ? "New 7-digit NTN" : "e.g. 1234567"}
              maxLength={7}
            />
            <p style={{ ...fieldHint, color: ntnErr ? "var(--error)" : "var(--foreground-subtle)" }}>
              {ntnErr || "National Tax Number — 7 digits. Encrypted."}
            </p>
          </div>

          {/* CNIC */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <label style={{ ...fieldLabel, marginBottom: 0 }}>CNIC</label>
              {profile?.cnic && <span style={savedBadge}><CheckTick /> Saved</span>}
            </div>
            <input
              style={cnicErr ? inputError : inputBase}
              value={cnic}
              onChange={e => { setCnic(e.target.value); validateCnic(e.target.value); }}
              placeholder={profile?.cnic ? "New 13-digit CNIC" : "e.g. 3520112345671"}
              maxLength={13}
            />
            <p style={{ ...fieldHint, color: cnicErr ? "var(--error)" : "var(--foreground-subtle)" }}>
              {cnicErr || "National Identity Card — 13 digits. Encrypted."}
            </p>
          </div>

          {/* STRN */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <label style={{ ...fieldLabel, marginBottom: 0 }}>STRN</label>
              {existingCreds.find(c => c.type === "STRN")?.value && <span style={savedBadge}><CheckTick /> Saved</span>}
            </div>
            <input
              style={inputBase}
              value={strn}
              onChange={e => setStrn(e.target.value)}
              placeholder="e.g. 4210123456789"
              maxLength={50}
            />
            <p style={fieldHint}>Sales Tax Reg. No. — shown on invoices.</p>
          </div>

        </div>
      </div>

      {/* ── SECTION 2: FBR Environment ─────────────────────── */}
      <div style={card}>
        <div style={sectionHead}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3h6M9 3v8L4.5 18.5A2 2 0 0 0 6.4 21h11.2a2 2 0 0 0 1.9-2.5L15 11V3"/>
            <line x1="6" y1="15" x2="18" y2="15"/>
          </svg>
          <h3 style={sectionTitle}>FBR Environment</h3>
        </div>
        <p style={sectionSub}>Choose whether submissions go to the test or live FBR server.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
          {[
            {
              value: "sandbox",
              label: "Sandbox",
              desc: "Test submissions — no real invoices registered",
              icon: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 3h6M9 3v8L4.5 18.5A2 2 0 0 0 6.4 21h11.2a2 2 0 0 0 1.9-2.5L15 11V3"/>
                  <line x1="6" y1="15" x2="18" y2="15"/>
                </svg>
              ),
              activeColor: "var(--warning)",
              activeBg: "var(--warning-bg)",
              activeBorder: "var(--warning)",
            },
            {
              value: "production",
              label: "Production",
              desc: "Live FBR submissions — real invoices registered with FBR",
              icon: (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              ),
              activeColor: "var(--positive)",
              activeBg: "var(--positive-bg)",
              activeBorder: "var(--positive)",
            },
          ].map(opt => {
            const isActive = fbrEnvironment === opt.value;
            return (
              <label key={opt.value} style={{
                display: "flex", alignItems: "flex-start", gap: "12px",
                padding: "14px 16px", borderRadius: "10px", cursor: "pointer",
                border: `2px solid ${isActive ? opt.activeBorder : "var(--border)"}`,
                background: isActive ? opt.activeBg : "var(--surface-2)",
                transition: "border-color 0.15s, background 0.15s",
              }}>
                <input
                  type="radio" name="fbrEnvironment" value={opt.value}
                  checked={isActive} onChange={e => setFbrEnvironment(e.target.value)}
                  style={{ marginTop: "2px", flexShrink: 0 }}
                />
                <div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    fontSize: "13px", fontWeight: 700,
                    color: isActive ? opt.activeColor : "var(--foreground)",
                    marginBottom: "4px",
                  }}>
                    <span style={{ color: isActive ? opt.activeColor : "var(--foreground-subtle)", display: "flex" }}>
                      {opt.icon}
                    </span>
                    {opt.label}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--foreground-muted)", lineHeight: 1.45 }}>
                    {opt.desc}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 3: API Token ────────────────────────────── */}
      <div style={card}>
        <div style={sectionHead}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="7.5" cy="15.5" r="5.5"/>
            <path d="M21 2l-9.6 9.6M15.5 7.5l3 3"/>
          </svg>
          <h3 style={sectionTitle}>FBR API Token</h3>
        </div>
        <p style={sectionSub}>Authentication token issued by FBR for your registered account.</p>

        {profile?.fbrTokenHint && (
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "var(--surface-2)", border: "1px solid var(--border)",
            borderRadius: "8px", padding: "10px 14px", marginBottom: "12px",
          }}>
            <CheckTick size={13}/>
            <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
              Token on file:{" "}
              <code style={{
                background: "var(--surface-3)", padding: "2px 8px",
                borderRadius: "5px", fontFamily: "monospace", fontSize: "12px",
                color: "var(--foreground)",
              }}>
                ••••••••{profile.fbrTokenHint}
              </code>
            </span>
          </div>
        )}

        <input
          type="password"
          style={inputBase}
          value={fbrToken}
          onChange={e => setFbrToken(e.target.value)}
          placeholder={profile?.fbrTokenHint ? "Enter new token to replace current" : "Paste your FBR API token here"}
        />
        <p style={fieldHint}>Stored encrypted — the token is never shown again after saving.</p>
      </div>

      {/* ── Status + Save ───────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            color: "var(--error)", fontSize: "13px",
            background: "var(--error-bg)", border: "1px solid var(--error)",
            borderRadius: "8px", padding: "10px 14px",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {saved && (
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            color: "var(--positive)", fontSize: "13px",
            background: "var(--positive-bg)", border: "1px solid var(--positive)",
            borderRadius: "8px", padding: "10px 14px",
          }}>
            <CheckTick size={14}/>
            FBR settings saved successfully
          </div>
        )}

        <div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? "var(--foreground-subtle)" : "var(--primary)",
              color: "#fff", border: "none",
              borderRadius: "9px", padding: "11px 32px",
              fontSize: "14px", fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              transition: "background 0.15s",
              display: "inline-flex", alignItems: "center", gap: "8px",
            }}
          >
            {saving && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            )}
            {saving ? "Saving…" : "Save FBR Settings"}
          </button>
        </div>
      </div>

    </div>
  );
}
