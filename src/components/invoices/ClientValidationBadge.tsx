"use client";

import { useState, useEffect } from "react";

type ValidationState = "idle" | "loading" | "valid" | "invalid" | "error";

interface ClientValidationBadgeProps {
  ntnCnic: string | undefined | null;
}

interface VerifyResult {
  ntnCnic: string;
  statlStatus: string;
  registrationType?: string;
  cached?: boolean;
  warning?: string;
}

export function ClientValidationBadge({ ntnCnic }: ClientValidationBadgeProps) {
  const [state, setState] = useState<ValidationState>("idle");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  // Reset when ntnCnic changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState("idle");
    setResult(null);
    setLastChecked(null);
  }, [ntnCnic]);

  const handleVerify = async () => {
    if (!ntnCnic || ntnCnic.trim().length < 7) return;
    setState("loading");
    setResult(null);
    try {
      const res = await fetch("/api/fbr/verify-ntn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ntnCnic: ntnCnic.trim() }),
      });
      const data: VerifyResult = await res.json();
      if (!res.ok || data.statlStatus === "unknown") {
        setState("error");
        setResult(data);
      } else if (
        data.statlStatus === "Active" ||
        data.statlStatus === "active" ||
        data.registrationType === "Registered"
      ) {
        setState("valid");
        setResult(data);
      } else {
        setState("invalid");
        setResult(data);
      }
      setLastChecked(new Date().toLocaleTimeString());
    } catch {
      setState("error");
    }
  };

  if (!ntnCnic || ntnCnic.trim().length < 7) return null;

  const badge = {
    idle: {
      bg: "var(--surface-2)",
      border: "var(--border)",
      text: "var(--foreground-muted)",
      label: "Verify NTN with FBR",
      icon: "🔍",
    },
    loading: {
      bg: "var(--info-bg)",
      border: "var(--info)",
      text: "var(--info)",
      label: "Verifying...",
      icon: "⏳",
    },
    valid: {
      bg: "var(--positive-bg, #0d2818)",
      border: "var(--positive, #22c55e)",
      text: "var(--positive, #4ade80)",
      label: `Verified: ${result?.registrationType ?? result?.statlStatus}${result?.cached ? " (cached)" : ""}`,
      icon: "✓",
    },
    invalid: {
      bg: "var(--warning-bg)",
      border: "var(--warning)",
      text: "var(--warning)",
      label: `Status: ${result?.statlStatus ?? "Unregistered"}`,
      icon: "⚠️",
    },
    error: {
      bg: "var(--error-bg)",
      border: "var(--error)",
      text: "var(--error)",
      label: result?.warning ?? "Could not verify NTN — STATL unavailable",
      icon: "✗",
    },
  }[state];

  return (
    <div
      style={{
        marginTop: "8px",
        padding: "8px 12px",
        borderRadius: "8px",
        background: badge.bg,
        border: `1px solid ${badge.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <span style={{ fontSize: "14px" }}>{badge.icon}</span>
        <span style={{ fontSize: "13px", color: badge.text, fontWeight: "500" }}>
          {badge.label}
        </span>
        {lastChecked && state !== "idle" && (
          <span style={{ fontSize: "11px", color: "var(--foreground-subtle)" }}>
            at {lastChecked}
          </span>
        )}
      </div>
      {(state === "idle" || state === "error") && (
        <button
          type="button"
          onClick={handleVerify}
          disabled={false}
          style={{
            background: "var(--primary)",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "4px 10px",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer",
            opacity: 1,
          }}
        >
          {state === "error" ? "Retry" : "Verify"}
        </button>
      )}
      {(state === "valid" || state === "invalid") && (
        <button
          type="button"
          onClick={handleVerify}
          style={{
            background: "transparent",
            color: "var(--foreground-subtle)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "3px 8px",
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          Re-check
        </button>
      )}
    </div>
  );
}
