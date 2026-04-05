"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      if (res.ok) {
        router.replace("/admin");
      } else {
        setError("Invalid key.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0a0a0a",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#111",
          border: "1px solid #222",
          borderRadius: "12px",
          padding: "32px",
          width: "320px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <h1 style={{ color: "#fff", fontSize: "18px", fontWeight: 700, margin: 0 }}>
          Admin Access
        </h1>
        <input
          type="password"
          placeholder="Admin key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoComplete="current-password"
          style={{
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: "8px",
            padding: "10px 12px",
            color: "#fff",
            fontSize: "14px",
            outline: "none",
          }}
        />
        {error && (
          <p style={{ color: "#f87171", fontSize: "13px", margin: 0 }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || !key}
          style={{
            background: loading || !key ? "#333" : "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: loading || !key ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Verifying…" : "Login"}
        </button>
      </form>
    </div>
  );
}
