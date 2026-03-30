"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

interface Member {
  id: string;
  userId: string;
  user: { name: string; email: string };
}

interface MembersClientProps {
  members: Member[];
}

export function MembersClient({ members }: MembersClientProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const result = await authClient.organization.inviteMember({
        email,
        role: "member" as const,
      });

      if (result.error) {
        setMessage(`Error: ${result.error.message}`);
      } else {
        setMessage(`Invitation sent to ${email}`);
        setEmail("");
      }
    } catch {
      setMessage("Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Members</h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Manage your organization members
        </p>
      </div>

      {/* Invite Form */}
      <div className="rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">Invite Member</h2>
        <form onSubmit={handleInvite} className="flex gap-3">
          <input
            type="email"
            placeholder="Email address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Invite"}
          </button>
        </form>
        {message && (
          <p
            className={`mt-2 text-sm ${
              message.startsWith("Error")
                ? "text-[var(--error)]"
                : "text-[var(--positive)]"
            }`}
          >
            {message}
          </p>
        )}
      </div>

      {/* Members List */}
      <div className="rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-sm)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]">
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                Email
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr
                key={member.id}
                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors"
              >
                <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                  {member.user.name}
                </td>
                <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                  {member.user.email}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
