"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";

interface Session {
  id: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string | Date;
  current?: boolean;
}

export function SecurityTab() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    authClient.listSessions()
      .then(res => {
        if (res.data) setSessions(res.data as Session[]);
      })
      .catch(() => {})
      .finally(() => setSessionsLoading(false));
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setPwError("Password must be at least 8 characters");
      return;
    }
    setPwSaving(true);
    setPwError("");
    setPwMsg("");
    try {
      const res = await authClient.changePassword({ currentPassword, newPassword });
      if (res.error) throw new Error(res.error.message ?? "Failed");
      setPwMsg("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await authClient.revokeSession({ token: sessionId });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch {
      // silently fail
    }
  };

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

  return (
    <div>
      {/* Change Password */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "12px", padding: "20px", marginBottom: "20px",
      }}>
        <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "14px", color: "var(--foreground)" }}>Change Password</h3>
        <form onSubmit={handleChangePassword} style={{ display: "grid", gap: "14px", maxWidth: "400px" }}>
          {[
            { label: "Current Password", value: currentPassword, onChange: setCurrentPassword, placeholder: "••••••••" },
            { label: "New Password", value: newPassword, onChange: setNewPassword, placeholder: "Min 8 characters" },
            { label: "Confirm New Password", value: confirmPassword, onChange: setConfirmPassword, placeholder: "Repeat new password" },
          ].map(f => (
            <div key={f.label}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "5px", textTransform: "uppercase" }}>{f.label}</label>
              <input type="password" style={inputStyle} value={f.value} onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder} required />
            </div>
          ))}
          {pwError && <div style={{ color: "#dc2626", fontSize: "13px" }}>{pwError}</div>}
          {pwMsg && <div style={{ color: "#16a34a", fontSize: "13px" }}>✓ {pwMsg}</div>}
          <button
            type="submit"
            disabled={pwSaving}
            style={{
              background: pwSaving ? "#93c5fd" : "#1d4ed8", color: "#fff",
              border: "none", borderRadius: "8px", padding: "10px 24px",
              fontSize: "14px", fontWeight: 700, cursor: pwSaving ? "not-allowed" : "pointer",
              width: "fit-content",
            }}
          >
            {pwSaving ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* Active Sessions */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "12px", overflow: "hidden",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Active Sessions</h3>
        </div>
        {sessionsLoading ? (
          <div style={{ padding: "20px", color: "var(--foreground-muted)", fontSize: "14px" }}>Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: "20px", color: "var(--foreground-muted)", fontSize: "14px" }}>No active sessions found.</div>
        ) : (
          <div>
            {sessions.map((s, i) => (
              <div key={s.id} style={{
                padding: "14px 20px",
                borderTop: i > 0 ? "1px solid var(--border)" : "none",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap",
              }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)" }}>
                    {s.userAgent ? s.userAgent.substring(0, 60) + (s.userAgent.length > 60 ? "..." : "") : "Unknown device"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginTop: "2px" }}>
                    {s.ipAddress && <span>IP: {s.ipAddress} · </span>}
                    {new Date(s.createdAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button
                  onClick={() => handleRevokeSession(s.id)}
                  style={{
                    background: "none", border: "1px solid #fecaca",
                    borderRadius: "6px", padding: "4px 12px",
                    fontSize: "12px", color: "#dc2626", cursor: "pointer", fontWeight: 600,
                  }}
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2FA Placeholder */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "12px", padding: "20px", marginTop: "16px",
        opacity: 0.6,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--foreground)" }}>Two-Factor Authentication</div>
            <div style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "4px" }}>Coming soon — add an extra layer of security to your account.</div>
          </div>
          <span style={{
            background: "#f1f5f9", color: "#64748b",
            border: "1px solid #e2e8f0",
            borderRadius: "12px", padding: "3px 12px",
            fontSize: "11px", fontWeight: 700,
          }}>Coming Soon</span>
        </div>
      </div>
    </div>
  );
}
