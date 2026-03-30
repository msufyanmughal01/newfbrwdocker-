"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SetupOrganizationForm() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const slug = organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const result = await authClient.organization.create({
        name: organizationName,
        slug: slug || `org-${Date.now()}`,
      });

      if (result.error) {
        setError(result.error.message ?? "Failed to create organization");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
      <div>
        <label
          htmlFor="organizationName"
          className="block text-sm font-medium text-[var(--foreground-muted)] mb-1"
        >
          Organization Name
        </label>
        <input
          id="organizationName"
          type="text"
          required
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          placeholder="e.g., Acme Corporation"
          className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-colors"
        />
      </div>
      {error && <p className="text-sm text-[var(--error)]">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2 text-sm font-medium text-white transition-all disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Organization"}
      </button>
    </form>
  );
}
