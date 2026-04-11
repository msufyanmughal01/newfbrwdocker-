"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";

interface Member {
  id: string;
  name?: string | null;
  email: string;
  role: string;
  userId?: string;
}

interface TeamTabProps {
  role?: string; // current user's role in the organization
}

export function TeamTab({ role }: TeamTabProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"operator" | "owner">("operator");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");
  const [error, setError] = useState("");

  const fetchMembers = async () => {
    try {
      const res = await authClient.organization.getFullOrganization();
      if (res.data?.members) {
        type OrgMember = { id: string; role: string; userId: string; user?: { name?: string | null; email?: string | null } | null };
        const filtered = (res.data.members as OrgMember[]).filter(m => m.role !== "accountant");
        setMembers(filtered.map(m => ({
          id: m.id,
          name: m.user?.name,
          email: m.user?.email ?? "",
          role: m.role,
          userId: m.userId,
        })));
      }
    } catch {
      // org may not exist yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    setError("");
    setInviteMsg("");
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (authClient.organization.inviteMember as any)({ email: email.trim(), role: inviteRole });
      if (res.error) throw new Error(res.error.message ?? "Failed to invite");
      setInviteMsg(`Invitation sent to ${email}`);
      setEmail("");
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite member");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("Remove this team member?")) return;
    try {
      await authClient.organization.removeMember({ memberIdOrEmail: memberId });
      await fetchMembers();
    } catch {
      setError("Failed to remove member");
    }
  };

  const isOwner = role === "owner";

  return (
    <div>
      {/* Invite Form */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "12px", padding: "20px", marginBottom: "20px",
      }}>
        <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "14px", color: "var(--foreground)" }}>Invite Team Member</h3>
        <form onSubmit={handleInvite} style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "2", minWidth: "200px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "5px", textTransform: "uppercase" }}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="colleague@company.pk"
              style={{
                width: "100%", border: "1.5px solid var(--border)", borderRadius: "8px",
                padding: "9px 12px", fontSize: "14px", color: "var(--foreground)",
                background: "var(--surface)", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ flex: "1", minWidth: "140px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted)", marginBottom: "5px", textTransform: "uppercase" }}>Role</label>
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as "operator" | "owner")}
              style={{
                width: "100%", border: "1.5px solid var(--border)", borderRadius: "8px",
                padding: "9px 12px", fontSize: "14px", background: "var(--surface)",
                color: "var(--foreground)", outline: "none",
              }}
            >
              <option value="operator">Member</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={inviting}
            style={{
              background: "#1d4ed8", color: "#fff", border: "none",
              borderRadius: "8px", padding: "10px 20px", fontSize: "14px",
              fontWeight: 700, cursor: inviting ? "not-allowed" : "pointer",
              opacity: inviting ? 0.7 : 1, whiteSpace: "nowrap",
            }}
          >
            {inviting ? "Sending..." : "Send Invite"}
          </button>
        </form>
        {inviteMsg && <div style={{ color: "#16a34a", fontSize: "13px", marginTop: "10px" }}>✓ {inviteMsg}</div>}
        {error && <div style={{ color: "#dc2626", fontSize: "13px", marginTop: "10px" }}>{error}</div>}
      </div>

      {/* Members List */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: "12px", overflow: "hidden",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Team Members</h3>
        </div>
        {loading ? (
          <div style={{ padding: "20px", color: "var(--foreground-muted)", fontSize: "14px" }}>Loading...</div>
        ) : members.length === 0 ? (
          <div style={{ padding: "20px", color: "var(--foreground-muted)", fontSize: "14px" }}>No team members yet. Invite someone above.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {members.map((m, i) => (
                <tr key={m.id} style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
                  <td style={{ padding: "12px 20px" }}>
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)" }}>{m.name || m.email}</div>
                    {m.name && <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{m.email}</div>}
                  </td>
                  <td style={{ padding: "12px 20px" }}>
                    <span style={{
                      background: m.role === "owner" ? "#eff6ff" : "#f0fdf4",
                      color: m.role === "owner" ? "#1d4ed8" : "#166534",
                      border: `1px solid ${m.role === "owner" ? "#bfdbfe" : "#86efac"}`,
                      borderRadius: "12px", padding: "2px 10px",
                      fontSize: "11px", fontWeight: 700,
                    }}>
                      {m.role === "owner" ? "Owner" : "Member"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 20px", textAlign: "right" }}>
                    {isOwner && (
                      <button
                        onClick={() => handleRemove(m.id)}
                        style={{
                          background: "none", border: "1px solid #fecaca",
                          borderRadius: "6px", padding: "4px 10px",
                          fontSize: "12px", color: "#dc2626", cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
