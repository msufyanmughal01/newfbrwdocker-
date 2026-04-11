"use client";

import Link from "next/link";

export function SandboxBanner({ collapsed }: { collapsed?: boolean }) {
  return (
    <div
      style={{
        margin: collapsed ? "0 6px 0" : "0 8px",
        borderRadius: "10px",
        background: "linear-gradient(135deg, rgba(217,119,6,0.12) 0%, rgba(180,83,9,0.12) 100%)",
        border: "1px solid rgba(217,119,6,0.28)",
        overflow: "hidden",
      }}
    >
      {collapsed ? (
        /* Collapsed: just pulsing dot */
        <div style={{ display: "flex", justifyContent: "center", padding: "9px 0" }}>
          <div style={{ position: "relative", width: "8px", height: "8px" }}>
            <span style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "#f59e0b", display: "block",
              animation: "pulse-dot 1.8s ease-in-out infinite",
            }} />
            <span style={{
              position: "absolute", inset: "-4px", borderRadius: "50%",
              background: "rgba(245,158,11,0.25)", display: "block",
              animation: "pulse-dot 1.8s ease-in-out infinite 0.3s",
            }} />
          </div>
        </div>
      ) : (
        /* Expanded: full indicator */
        <div style={{ padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "6px" }}>
            <div style={{ position: "relative", width: "7px", height: "7px", flexShrink: 0 }}>
              <span style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "#f59e0b", display: "block",
                animation: "pulse-dot 1.8s ease-in-out infinite",
              }} />
            </div>
            <span style={{
              fontSize: "10px", fontWeight: 800, color: "#b45309",
              letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              Sandbox Mode
            </span>
          </div>
          <p style={{ fontSize: "10px", color: "#92400e", margin: "0 0 8px", lineHeight: 1.45 }}>
            FBR test environment — no real invoices generated.
          </p>
          <Link
            href="/settings?tab=fbr"
            style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              fontSize: "10px", fontWeight: 700,
              color: "#b45309", textDecoration: "none",
              background: "rgba(217,119,6,0.12)",
              padding: "3px 9px", borderRadius: "6px",
              border: "1px solid rgba(217,119,6,0.22)",
              transition: "background 0.15s",
            }}
          >
            Switch to Production →
          </Link>
        </div>
      )}
    </div>
  );
}
