"use client";

import { useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  provider?: string | null; // 'google' or 'credential'
  // Business info
  businessName?: string | null;
  ntnCnic?: string | null;
  phone?: string | null;
  province?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  fbrTokenHint?: string | null;
  logoPath?: string | null;
  planSlug?: string | null;
  planActivatedAt?: Date | null;
  billingCycleStart?: Date | null;
  // Personal info
  fatherName?: string | null;
  cnic?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  emergencyContact?: string | null;
  notes?: string | null;
}

interface Props {
  users: User[];
}

const FBR_PROVINCES = [
  "Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan",
  "Gilgit Baltistan", "Azad Kashmir", "Islamabad",
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        background: copied ? "var(--positive-bg)" : "var(--primary-subtle)",
        border: `1px solid ${copied ? "var(--positive)" : "var(--primary)"}`,
        color: copied ? "var(--positive)" : "var(--primary)",
        borderRadius: "6px", padding: "3px 10px",
        fontSize: "12px", cursor: "pointer", fontWeight: 600,
        transition: "all 0.15s",
      }}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "#@!$";
  const all = upper + lower + digits + special;
  let pass = upper[Math.floor(Math.random() * upper.length)]
    + lower[Math.floor(Math.random() * lower.length)]
    + digits[Math.floor(Math.random() * digits.length)]
    + special[Math.floor(Math.random() * special.length)];
  for (let i = 0; i < 4; i++) pass += all[Math.floor(Math.random() * all.length)];
  return pass.split("").sort(() => Math.random() - 0.5).join("");
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{
      fontSize: "11px", fontWeight: 800, color: "var(--foreground-subtle)",
      textTransform: "uppercase", letterSpacing: "0.08em",
      borderBottom: "1px solid var(--border)", paddingBottom: "8px",
      marginBottom: "14px", marginTop: "20px",
    }}>
      {title}
    </div>
  );
}

function LogPaymentPanel({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    paidAt: new Date().toISOString().split("T")[0],
    amount: "",
    planSlug: "growth",
    durationMonths: "1",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const inp2: React.CSSProperties = {
    width: "100%", background: "var(--surface)",
    border: "1px solid var(--border)", borderRadius: "8px",
    padding: "9px 12px", color: "var(--foreground)",
    fontSize: "13px", outline: "none", boxSizing: "border-box",
  };

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || isNaN(Number(form.amount))) { setMsg("Error: Enter a valid amount."); return; }
    setSaving(true); setMsg("");
    try {
      const res = await fetch("/api/admin/log-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          paidAt: form.paidAt,
          amount: parseInt(form.amount),
          planSlug: form.planSlug,
          durationMonths: parseInt(form.durationMonths),
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(`Error: ${data.error || "Failed"}`); return; }
      setMsg("Payment logged successfully.");
      setForm(prev => ({ ...prev, amount: "", notes: "" }));
    } catch { setMsg("Error: Network error."); } finally { setSaving(false); }
  };

  return (
    <div style={{
      border: "1px solid var(--border)", borderRadius: "10px",
      marginBottom: "20px", overflow: "hidden",
    }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", background: "var(--surface-2)",
          border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700,
          color: "var(--foreground)", textAlign: "left",
        }}
      >
        <span>💳 Log Manual Payment</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <form onSubmit={handleLog} style={{ padding: "16px", display: "grid", gap: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--foreground-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Paid At</label>
              <input type="date" style={inp2} value={form.paidAt}
                onChange={e => setForm(p => ({ ...p, paidAt: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--foreground-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Amount (PKR)</label>
              <input type="number" style={inp2} value={form.amount} placeholder="5000"
                onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required min="1" />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--foreground-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Plan</label>
              <select style={inp2} value={form.planSlug}
                onChange={e => setForm(p => ({ ...p, planSlug: e.target.value }))}>
                <option value="standard">Standard (Free)</option>
                <option value="growth">Growth (Rs 5,000)</option>
                <option value="pro">Pro (Rs 12,000)</option>
                <option value="unlimited">Unlimited (Rs 15,000)</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--foreground-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Duration (Months)</label>
              <input type="number" style={inp2} value={form.durationMonths}
                onChange={e => setForm(p => ({ ...p, durationMonths: e.target.value }))} min="1" max="24" />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--foreground-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Notes (optional)</label>
            <input type="text" style={inp2} value={form.notes} placeholder="e.g. Bank transfer, receipt no. 123"
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
          {msg && (
            <div style={{
              padding: "8px 12px", borderRadius: "6px",
              background: msg.startsWith("Error") ? "var(--error-bg, #fef2f2)" : "var(--positive-bg, #f0fdf4)",
              border: `1px solid ${msg.startsWith("Error") ? "#fca5a5" : "#86efac"}`,
              color: msg.startsWith("Error") ? "#dc2626" : "#16a34a",
              fontSize: "12px",
            }}>
              {msg}
            </div>
          )}
          <button type="submit" disabled={saving} style={{
            background: saving ? "#93c5fd" : "#1d4ed8", color: "#fff",
            border: "none", borderRadius: "8px", padding: "9px 18px",
            fontSize: "13px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
            width: "fit-content",
          }}>
            {saving ? "Logging..." : "Log Payment"}
          </button>
        </form>
      )}
    </div>
  );
}

function EditUserPanel({
  user,
  onClose,
  onSaved,
}: {
  user: User;
  onClose: () => void;
  onSaved: (updated: User) => void;
}) {
  const [form, setForm] = useState({
    // Business
    businessName: user.businessName ?? "",
    ntnCnic: user.ntnCnic ?? "",
    phone: user.phone ?? "",
    province: user.province ?? "",
    address: user.address ?? "",
    city: user.city ?? "",
    postalCode: user.postalCode ?? "",
    fbrToken: "",
    // Plan
    planSlug: user.planSlug ?? "standard",
    billingCycleStart: user.billingCycleStart
      ? new Date(user.billingCycleStart).toISOString().split("T")[0]
      : "",
    // Personal
    fatherName: user.fatherName ?? "",
    cnic: user.cnic ?? "",
    dateOfBirth: user.dateOfBirth ?? "",
    gender: user.gender ?? "",
    emergencyContact: user.emergencyContact ?? "",
    notes: user.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(user.logoPath ?? null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const inp: React.CSSProperties = {
    width: "100%", background: "var(--surface-2)",
    border: "1px solid var(--border)", borderRadius: "9px",
    padding: "10px 13px", color: "var(--foreground)",
    fontSize: "14px", outline: "none", boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: "12px", fontWeight: 700,
    color: "var(--foreground-muted)", marginBottom: "5px",
    textTransform: "uppercase", letterSpacing: "0.05em",
  };

  const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(""); setSaving(true);
    try {
      const res = await fetch("/api/admin/update-user-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(`Error: ${data.error || "Failed"}`); return; }
      setMsg("Saved successfully.");
      onSaved({
        ...user,
        businessName: form.businessName || null,
        ntnCnic: form.ntnCnic || null,
        phone: form.phone || null,
        province: form.province || null,
        address: form.address || null,
        city: form.city || null,
        postalCode: form.postalCode || null,
        fatherName: form.fatherName || null,
        cnic: form.cnic || null,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        emergencyContact: form.emergencyContact || null,
        notes: form.notes || null,
        fbrTokenHint: form.fbrToken ? form.fbrToken.slice(-4) : user.fbrTokenHint,
        logoPath: logoPreview,
        planSlug: form.planSlug || "standard",
      });
    } catch { setMsg("Error: Network error."); } finally { setSaving(false); }
  };

  const uploadLogo = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) { setMsg("Error: Logo exceeds 2MB limit."); return; }
    setLogoUploading(true);
    const fd = new FormData();
    fd.append("logo", file);
    fd.append("userId", user.id);
    try {
      const res = await fetch("/api/admin/upload-user-logo", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setMsg(`Error: ${data.error || "Logo upload failed"}`); return; }
      setLogoPreview(data.logoPath);
      setMsg("Logo uploaded.");
    } catch { setMsg("Error: Logo upload failed."); } finally { setLogoUploading(false); }
  };

  const fetchPassword = async () => {
    setLoadingPassword(true);
    try {
      const res = await fetch(`/api/admin/user-password?userId=${encodeURIComponent(user.id)}`);
      const data = await res.json();
      if (!res.ok) { setMsg(`Error: ${data.error || "Could not fetch password"}`); return; }
      setCurrentPassword(data.password);
      setShowCurrentPassword(true);
    } catch { setMsg("Error: Could not fetch password."); } finally { setLoadingPassword(false); }
  };

  const savePassword = async () => {
    if (!newPassword || newPassword.length < 8) { setMsg("Error: New password must be at least 8 characters."); return; }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/admin/reset-user-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(`Error: ${data.error || "Failed to update password"}`); return; }
      setMsg("Password updated.");
      setCurrentPassword(newPassword);
      setNewPassword("");
    } catch { setMsg("Error: Failed to update password."); } finally { setSavingPassword(false); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "var(--surface)", borderRadius: "18px", width: "100%", maxWidth: "700px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)", maxHeight: "92vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, background: "var(--surface)", zIndex: 1,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--foreground)" }}>
              Edit User
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: "13px", color: "var(--foreground-muted)" }}>
              {user.name} · {user.email}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: "var(--surface-2)", border: "1px solid var(--border)",
            borderRadius: "8px", padding: "6px 12px", cursor: "pointer",
            fontSize: "13px", color: "var(--foreground-muted)",
          }}>✕ Close</button>
        </div>

        <form onSubmit={save} style={{ padding: "24px" }}>

          {/* ── Logo ─────────────────────────────── */}
          <SectionHeader title="Business Logo" />
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "4px" }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "10px",
              border: "1px solid var(--border)", background: "var(--surface-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", flexShrink: 0,
            }}>
              {logoPreview
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={logoPreview} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                : <span style={{ fontSize: "11px", color: "var(--foreground-subtle)" }}>No logo</span>}
            </div>
            <div>
              <label style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: logoUploading ? "var(--border)" : "var(--surface-2)",
                border: "1px solid var(--border)", borderRadius: "8px",
                padding: "7px 14px", fontSize: "13px", fontWeight: 600,
                color: "var(--foreground-muted)", cursor: logoUploading ? "not-allowed" : "pointer",
              }}>
                {logoUploading ? "Uploading…" : "Upload Logo"}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  style={{ display: "none" }} disabled={logoUploading}
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
              </label>
              <p style={{ fontSize: "11px", color: "var(--foreground-subtle)", margin: "4px 0 0" }}>
                JPG, PNG, WebP, SVG — max 2MB
              </p>
            </div>
          </div>

          {/* ── Business Info ─────────────────────── */}
          <SectionHeader title="Business Information" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={lbl}>Business Name</label>
              <input style={inp} value={form.businessName} onChange={f("businessName")} placeholder="Khan Enterprises Ltd" />
            </div>
            <div>
              <label style={lbl}>NTN / Business CNIC</label>
              <input style={inp} value={form.ntnCnic} onChange={f("ntnCnic")} placeholder="7-digit NTN or 13-digit CNIC" maxLength={13} />
            </div>
            <div>
              <label style={lbl}>Phone</label>
              <input style={inp} value={form.phone} onChange={f("phone")} placeholder="+92 300 0000000" />
            </div>
            <div>
              <label style={lbl}>Province</label>
              <select style={inp} value={form.province} onChange={f("province")}>
                <option value="">Select province…</option>
                {FBR_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>City</label>
              <input style={inp} value={form.city} onChange={f("city")} placeholder="Lahore" />
            </div>
            <div>
              <label style={lbl}>Postal Code</label>
              <input style={inp} value={form.postalCode} onChange={f("postalCode")} placeholder="54000" />
            </div>
          </div>
          <div style={{ marginBottom: "4px" }}>
            <label style={lbl}>Business Address</label>
            <textarea style={{ ...inp, resize: "none" } as React.CSSProperties} rows={2}
              value={form.address} onChange={f("address")} placeholder="Street address, city, postal code" />
          </div>

          {/* ── Personal Info ─────────────────────── */}
          <SectionHeader title="Personal Information" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
            <div>
              <label style={lbl}>Father Name</label>
              <input style={inp} value={form.fatherName} onChange={f("fatherName")} placeholder="Muhammad Khan" />
            </div>
            <div>
              <label style={lbl}>Personal CNIC</label>
              <input style={inp} value={form.cnic} onChange={f("cnic")} placeholder="13-digit CNIC" maxLength={13} />
            </div>
            <div>
              <label style={lbl}>Date of Birth</label>
              <input style={inp} type="date" value={form.dateOfBirth} onChange={f("dateOfBirth")} />
            </div>
            <div>
              <label style={lbl}>Gender</label>
              <select style={inp} value={form.gender} onChange={f("gender")}>
                <option value="">Select…</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Emergency Contact</label>
              <input style={inp} value={form.emergencyContact} onChange={f("emergencyContact")} placeholder="+92 300 0000000" />
            </div>
          </div>
          <div style={{ marginBottom: "4px" }}>
            <label style={lbl}>Admin Notes</label>
            <textarea style={{ ...inp, resize: "none" } as React.CSSProperties} rows={2}
              value={form.notes} onChange={f("notes")} placeholder="Internal notes about this user…" />
          </div>

          {/* ── Subscription Plan ─────────────────── */}
          <SectionHeader title="Subscription Plan" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "14px" }}>
            {[
              { slug: "standard",  name: "Standard",  limit: "3 invoices/month",        price: "Free",           color: "#16a34a" },
              { slug: "growth",    name: "Growth",    limit: "20 invoices/month",        price: "PKR 5,000/mo",   color: "#2563eb" },
              { slug: "pro",       name: "Pro",       limit: "100 invoices/month",       price: "PKR 12,000/mo",  color: "#7c3aed" },
              { slug: "unlimited", name: "Unlimited", limit: "Unlimited invoices/month", price: "PKR 15,000/mo",  color: "#0f172a" },
            ].map(plan => {
              const selected = form.planSlug === plan.slug;
              return (
                <label key={plan.slug} style={{
                  display: "flex", alignItems: "flex-start", gap: "10px",
                  padding: "12px 14px", borderRadius: "10px", cursor: "pointer",
                  border: `2px solid ${selected ? plan.color : "var(--border)"}`,
                  background: selected ? `${plan.color}12` : "var(--surface-2)",
                  transition: "all 0.15s",
                }}>
                  <input
                    type="radio" name="planSlug" value={plan.slug}
                    checked={selected}
                    onChange={f("planSlug")}
                    style={{ marginTop: "2px", accentColor: plan.color }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "13px", color: selected ? plan.color : "var(--foreground)" }}>
                      {plan.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginTop: "2px" }}>{plan.limit}</div>
                    <div style={{ fontSize: "11px", color: "var(--foreground-subtle)" }}>{plan.price}</div>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Billing Cycle Start */}
          <div style={{ marginBottom: "14px" }}>
            <label style={lbl}>Billing Cycle Start Date</label>
            <input
              style={{ ...inp, maxWidth: "220px" }}
              type="date"
              value={form.billingCycleStart}
              onChange={f("billingCycleStart")}
            />
            <p style={{ fontSize: "11px", color: "var(--foreground-subtle)", margin: "4px 0 0" }}>
              Day-of-month anchor for invoice quota resets. Leave blank to use 1st of month.
            </p>
          </div>

          {/* Log Payment Sub-panel */}
          <LogPaymentPanel userId={user.id} />

          {/* ── FBR Token ─────────────────────────── */}
          <SectionHeader title="FBR API Token" />
          <div style={{ marginBottom: "4px" }}>
            {user.fbrTokenHint && (
              <p style={{ fontSize: "12px", color: "var(--foreground-muted)", margin: "0 0 6px" }}>
                Saved token ends in: <span style={{ fontFamily: "monospace", fontWeight: 700 }}>···{user.fbrTokenHint}</span>
              </p>
            )}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                style={{ ...inp, paddingRight: "90px", fontFamily: "monospace" }}
                type={showToken ? "text" : "password"}
                value={form.fbrToken}
                onChange={f("fbrToken")}
                placeholder={user.fbrTokenHint ? "Enter new token to replace…" : "Paste FBR bearer token…"}
                autoComplete="off"
              />
              <button type="button" onClick={() => setShowToken(v => !v)} style={{
                position: "absolute", right: "8px",
                background: "var(--surface-2)", border: "1px solid var(--border)",
                borderRadius: "6px", padding: "4px 10px", cursor: "pointer",
                fontSize: "13px", color: "var(--foreground-muted)",
              }}>
                {showToken ? "🙈" : "👁"}
              </button>
            </div>
            <p style={{ fontSize: "12px", color: "var(--foreground-subtle)", margin: "5px 0 0" }}>
              Stored encrypted. Leave blank to keep existing token.
            </p>
          </div>

          {/* ── Password (only for email/credential users) ──────────────────────────── */}
          {user.provider !== "google" && (
          <><SectionHeader title="Account Password" />
          <div style={{ padding: "16px", background: "var(--surface-2)", borderRadius: "10px", border: "1px solid var(--border)", marginBottom: "4px" }}>
            <div style={{ marginBottom: "12px" }}>
              <label style={lbl}>Current Password</label>
              {currentPassword !== null ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input readOnly type={showCurrentPassword ? "text" : "password"} value={currentPassword}
                    style={{ ...inp, flex: 1, fontFamily: "monospace", background: "var(--surface)" }} />
                  <button type="button" onClick={() => setShowCurrentPassword(v => !v)} style={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: "6px", padding: "8px 12px", cursor: "pointer", fontSize: "13px", color: "var(--foreground-muted)",
                  }}>
                    {showCurrentPassword ? "🙈" : "👁"}
                  </button>
                  <CopyButton text={currentPassword} />
                </div>
              ) : (
                <button type="button" onClick={fetchPassword} disabled={loadingPassword} style={{
                  background: "var(--primary-subtle)", border: "1px solid var(--primary)",
                  borderRadius: "8px", padding: "8px 16px", cursor: loadingPassword ? "not-allowed" : "pointer",
                  fontSize: "13px", fontWeight: 600, color: "var(--primary)",
                }}>
                  {loadingPassword ? "Loading…" : "👁 View Current Password"}
                </button>
              )}
            </div>
            <div>
              <label style={lbl}>Set New Password</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input type={showNewPassword ? "text" : "password"} value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} placeholder="Min 8 characters"
                  style={{ ...inp, flex: 1, fontFamily: "monospace" }} autoComplete="off" />
                <button type="button" onClick={() => setShowNewPassword(v => !v)} style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: "6px", padding: "8px 12px", cursor: "pointer", fontSize: "13px", color: "var(--foreground-muted)",
                }}>{showNewPassword ? "🙈" : "👁"}</button>
                <button type="button" onClick={() => setNewPassword(generatePassword())} style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: "6px", padding: "8px 12px", cursor: "pointer",
                  fontSize: "11px", fontWeight: 700, color: "var(--primary)", whiteSpace: "nowrap",
                }}>Generate</button>
              </div>
              <button type="button" onClick={savePassword} disabled={savingPassword || !newPassword} style={{
                marginTop: "10px",
                background: (!newPassword || savingPassword) ? "var(--border)" : "var(--primary)",
                color: (!newPassword || savingPassword) ? "var(--foreground-muted)" : "white",
                border: "none", borderRadius: "8px", padding: "8px 18px",
                fontSize: "13px", fontWeight: 700,
                cursor: (!newPassword || savingPassword) ? "not-allowed" : "pointer",
              }}>
                {savingPassword ? "Updating…" : "Update Password"}
              </button>
            </div>
          </div>
          </>)}

          {/* ── Feedback + Actions ────────────────── */}
          {msg && (
            <div style={{
              padding: "10px 14px", borderRadius: "8px", margin: "16px 0 0",
              background: msg.startsWith("Error") ? "var(--error-bg)" : "var(--positive-bg)",
              border: `1px solid ${msg.startsWith("Error") ? "var(--error)" : "var(--positive)"}`,
              color: msg.startsWith("Error") ? "var(--error)" : "var(--positive)",
              fontSize: "13px",
            }}>
              {msg}
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button type="submit" disabled={saving} style={{
              background: saving ? "var(--border)" : "var(--primary)",
              color: saving ? "var(--foreground-muted)" : "white",
              border: "none", borderRadius: "9px",
              padding: "10px 24px", fontSize: "14px", fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
            }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" onClick={onClose} style={{
              background: "var(--surface-2)", color: "var(--foreground-muted)",
              border: "1px solid var(--border)", borderRadius: "9px",
              padding: "10px 20px", fontSize: "14px", cursor: "pointer",
            }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminDashboardClient({ users: initialUsers }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleDelete = async (userId: string) => {
    setDeleting(userId);
    try {
      const res = await fetch("/api/admin/delete-user-secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) { setUsers(prev => prev.filter(u => u.id !== userId)); setDeleteConfirmId(null); }
    } finally { setDeleting(null); }
  };

  const card: React.CSSProperties = {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "16px", padding: "28px",
    boxShadow: "var(--shadow-sm)", marginBottom: "24px",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "var(--font-sans, system-ui, sans-serif)" }}>
      {editingUser && (
        <EditUserPanel
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={updated => {
            setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
            setEditingUser(null);
          }}
        />
      )}

      {/* Top bar */}
      <div style={{
        background: "linear-gradient(135deg, #0c1a3a, #1e3a8a)",
        padding: "0 24px", height: "60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "9px",
            background: "linear-gradient(135deg, #60a5fa, #34d399)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="2" width="14" height="16" rx="2" stroke="white" strokeWidth="1.5" />
              <line x1="6" y1="7" x2="14" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="6" y1="10" x2="14" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="6" y1="13" x2="10" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: "17px", color: "#fff" }}>
            Tax<span style={{ color: "#60a5fa" }}>Digital</span>
            <span style={{ fontWeight: 400, fontSize: "12px", color: "rgba(255,255,255,0.45)", marginLeft: "8px" }}>Admin</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            background: "rgba(255,255,255,0.1)", borderRadius: "8px",
            padding: "4px 12px", fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: 600,
          }}>
            {users.length} {users.length === 1 ? "User" : "Users"} · {users.filter(u => u.provider === "google").length}G · {users.filter(u => u.provider !== "google").length}E
          </div>
          <button
            onClick={async () => {
              await fetch("/api/admin/auth", { method: "DELETE" });
              window.location.href = "/admin/login";
            }}
            style={{
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "8px", padding: "4px 12px", fontSize: "12px",
              color: "rgba(255,255,255,0.7)", fontWeight: 600, cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "28px 16px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "14px", marginBottom: "24px" }}>
          {[
            { label: "Total Users", value: users.length, color: "var(--primary)" },
            { label: "Google Sign Up", value: users.filter(u => u.provider === "google").length, color: "#d97706" },
            { label: "Email Sign Up", value: users.filter(u => u.provider !== "google").length, color: "#0369a1" },
            { label: "Verified", value: users.filter(u => u.emailVerified).length, color: "var(--positive)" },
            { label: "Pending", value: users.filter(u => !u.emailVerified).length, color: "var(--warning)" },
          ].map(stat => (
            <div key={stat.label} style={{ ...card, marginBottom: 0, padding: "18px 22px" }}>
              <div style={{ fontSize: "26px", fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "2px" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Users Table */}
        <div style={card}>
          <h2 style={{ fontSize: "15px", fontWeight: 700, color: "var(--foreground)", marginBottom: "20px", marginTop: 0 }}>
            All Users
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--surface-2)" }}>
                  {["Name / Email", "Sign Up", "Business", "Plan", "Father Name", "CNIC", "NTN/Tax CNIC", "City", "FBR Token", "Status", "Joined", "Actions"].map(h => (
                    <th key={h} style={{
                      textAlign: "left", fontSize: "11px", fontWeight: 700,
                      color: "var(--foreground-muted)", textTransform: "uppercase",
                      letterSpacing: "0.06em", padding: "10px 12px", whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} style={{ background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                        <div style={{
                          width: "30px", height: "30px", borderRadius: "50%",
                          background: "linear-gradient(135deg, #1d4ed8, #06b6d4)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "11px", fontWeight: 800, color: "white", flexShrink: 0,
                        }}>
                          {u.name?.slice(0, 2).toUpperCase() || "??"}
                        </div>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>{u.name}</div>
                          <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{u.email}</div>
                          {u.phone && <div style={{ fontSize: "11px", color: "var(--foreground-subtle)" }}>{u.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                      {u.provider === "google" ? (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "100px",
                          background: "#fef3c718", color: "#d97706", border: "1px solid #d9770655",
                        }}>
                          <svg width="11" height="11" viewBox="0 0 18 18" fill="none">
                            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                          </svg>
                          Google
                        </span>
                      ) : (
                        <span style={{
                          fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "100px",
                          background: "#e0f2fe", color: "#0369a1", border: "1px solid #0369a155",
                        }}>
                          Email
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "12px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                      <div>{u.businessName || <span style={{ color: "var(--border-strong)" }}>—</span>}</div>
                      {u.province && <div style={{ fontSize: "11px", color: "var(--foreground-subtle)" }}>{u.province}</div>}
                    </td>
                    <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                      {(() => {
                        const planColors: Record<string, string> = {
                          standard: "#16a34a",
                          growth: "#2563eb",
                          pro: "#7c3aed",
                          unlimited: "#0f172a",
                        };
                        const slug = u.planSlug ?? "standard";
                        const color = planColors[slug] ?? "#16a34a";
                        const label = slug.charAt(0).toUpperCase() + slug.slice(1);
                        return (
                          <span style={{
                            fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "100px",
                            background: `${color}18`, color, border: `1px solid ${color}55`,
                            whiteSpace: "nowrap",
                          }}>{label}</span>
                        );
                      })()}
                    </td>
                    <td style={{ padding: "12px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                      {u.fatherName || <span style={{ color: "var(--border-strong)" }}>—</span>}
                    </td>
                    <td style={{ padding: "12px", fontSize: "13px", fontFamily: "monospace", color: "var(--foreground-muted)" }}>
                      {u.cnic || <span style={{ color: "var(--border-strong)" }}>—</span>}
                    </td>
                    <td style={{ padding: "12px", fontSize: "13px", fontFamily: "monospace", color: "var(--foreground-muted)" }}>
                      {u.ntnCnic || <span style={{ color: "var(--border-strong)" }}>—</span>}
                    </td>
                    <td style={{ padding: "12px", fontSize: "13px", color: "var(--foreground-muted)" }}>
                      {u.city || <span style={{ color: "var(--border-strong)" }}>—</span>}
                    </td>
                    <td style={{ padding: "12px", fontSize: "13px", fontFamily: "monospace", color: "var(--foreground-muted)" }}>
                      {u.fbrTokenHint
                        ? <span style={{ background: "var(--positive-bg)", color: "var(--positive)", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 700 }}>···{u.fbrTokenHint}</span>
                        : <span style={{ color: "var(--border-strong)" }}>—</span>}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "100px",
                        background: u.emailVerified ? "var(--positive-bg)" : "var(--warning-bg)",
                        color: u.emailVerified ? "var(--positive)" : "var(--warning)",
                        border: `1px solid ${u.emailVerified ? "var(--positive)" : "var(--warning)"}`,
                        whiteSpace: "nowrap",
                      }}>
                        {u.emailVerified ? "✓ Verified" : "Pending"}
                      </span>
                    </td>
                    <td style={{ padding: "12px", fontSize: "12px", color: "var(--foreground-subtle)", whiteSpace: "nowrap" }}>
                      {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "nowrap" }}>
                        <button
                          style={{ background: "var(--primary-subtle)", color: "var(--primary)", border: "1px solid var(--primary)", borderRadius: "7px", padding: "5px 12px", fontSize: "12px", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}
                          onClick={() => setEditingUser(u)}
                        >
                          Edit
                        </button>
                        {deleteConfirmId === u.id ? (
                          <>
                            <button
                              style={{ background: "var(--error)", color: "white", border: "none", borderRadius: "7px", padding: "5px 12px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
                              onClick={() => handleDelete(u.id)} disabled={deleting === u.id}
                            >
                              {deleting === u.id ? "..." : "Confirm"}
                            </button>
                            <button
                              style={{ background: "var(--surface-2)", color: "var(--foreground-muted)", border: "1px solid var(--border)", borderRadius: "7px", padding: "5px 12px", fontSize: "12px", cursor: "pointer" }}
                              onClick={() => setDeleteConfirmId(null)}
                            >Cancel</button>
                          </>
                        ) : (
                          <button
                            style={{ background: "var(--error-bg)", color: "var(--error)", border: "1px solid var(--error)", borderRadius: "7px", padding: "5px 12px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
                            onClick={() => setDeleteConfirmId(u.id)}
                          >Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ padding: "40px", textAlign: "center", color: "var(--foreground-subtle)", fontSize: "14px" }}>
                      No users yet. Create the first one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
