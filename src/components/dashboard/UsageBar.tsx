"use client";

interface UsageBarProps {
  used: number;
  limit: number | null;
}

export function UsageBar({ used, limit }: UsageBarProps) {
  if (limit === null) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "13px", color: "var(--foreground-muted, #64748b)" }}>
          Invoices: <strong style={{ color: "var(--foreground, #0f172a)" }}>{used}</strong> used
        </span>
        <span
          style={{
            background: "#dcfce7",
            color: "#166534",
            fontSize: "11px",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "10px",
          }}
        >
          Unlimited
        </span>
      </div>
    );
  }

  const pct = Math.min(100, (used / limit) * 100);
  const isWarning = pct >= 75;
  const isDanger = pct >= 90;

  const barColor = isDanger ? "#ef4444" : isWarning ? "#f59e0b" : "#22c55e";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", minWidth: "180px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--foreground-muted, #64748b)" }}>
          Invoices this cycle
        </span>
        <span style={{ fontSize: "12px", fontWeight: 700, color: isDanger ? "#ef4444" : "var(--foreground, #0f172a)" }}>
          {used} / {limit}
        </span>
      </div>
      <div
        style={{
          height: "6px",
          borderRadius: "3px",
          background: "var(--border, #e2e8f0)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: barColor,
            borderRadius: "3px",
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}
