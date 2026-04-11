"use client";

import { useState, useCallback } from "react";
import type { FBRScenario } from "@/lib/fbr/scenarios";

type ScenarioStatus = "idle" | "running" | "passed" | "failed";

interface ScenarioResult {
  status: ScenarioStatus;
  result?: Record<string, unknown>;
  error?: string;
  invoiceId?: string;
}

interface SandboxClientProps {
  scenarios: FBRScenario[];
}

export function SandboxClient({ scenarios }: SandboxClientProps) {
  const [statuses, setStatuses] = useState<Record<string, ScenarioResult>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [runningAll, setRunningAll] = useState(false);
  const [allProgress, setAllProgress] = useState(0);

  const runScenario = useCallback(async (scenarioId: string): Promise<ScenarioResult> => {
    setStatuses(prev => ({ ...prev, [scenarioId]: { status: "running" } }));
    try {
      const res = await fetch("/api/sandbox/run-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId }),
      });
      const data = await res.json();
      const result: ScenarioResult = {
        status: data.success ? "passed" : "failed",
        result: data.result,
        error: data.error,
        invoiceId: data.invoiceId,
      };
      setStatuses(prev => ({ ...prev, [scenarioId]: result }));
      return result;
    } catch (err) {
      const result: ScenarioResult = {
        status: "failed",
        error: err instanceof Error ? err.message : "Network error",
      };
      setStatuses(prev => ({ ...prev, [scenarioId]: result }));
      return result;
    }
  }, []);

  const runAll = async () => {
    setRunningAll(true);
    setAllProgress(0);
    for (let i = 0; i < scenarios.length; i++) {
      await runScenario(scenarios[i].id);
      setAllProgress(i + 1);
    }
    setRunningAll(false);
  };

  const passedCount = Object.values(statuses).filter(s => s.status === "passed").length;
  const failedCount = Object.values(statuses).filter(s => s.status === "failed").length;
  const totalRun = passedCount + failedCount;

  return (
    <div style={{ maxWidth: "960px" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--foreground)", margin: "0 0 4px" }}>
          Sandbox Testing
        </h1>
        <p style={{ fontSize: "14px", color: "var(--foreground-muted)", margin: 0 }}>
          Run FBR invoice scenarios in sandbox mode. No real submissions are made.
        </p>
      </div>

      {/* Summary bar + Run All */}
      <div style={{
        background: "#fffbeb", border: "1px solid #fbbf24",
        borderRadius: "10px", padding: "12px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "12px", marginBottom: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#92400e" }}>
            🧪 SANDBOX MODE
          </span>
          {totalRun > 0 && (
            <>
              <span style={{ fontSize: "13px", color: "#16a34a", fontWeight: 600 }}>
                ✓ {passedCount} passed
              </span>
              {failedCount > 0 && (
                <span style={{ fontSize: "13px", color: "#dc2626", fontWeight: 600 }}>
                  ✗ {failedCount} failed
                </span>
              )}
              <span style={{ fontSize: "13px", color: "var(--foreground-muted)" }}>
                ({totalRun}/{scenarios.length} run)
              </span>
            </>
          )}
          {runningAll && (
            <span style={{ fontSize: "13px", color: "#2563eb", fontWeight: 600 }}>
              ⟳ Running {allProgress}/{scenarios.length}...
            </span>
          )}
        </div>
        <button
          onClick={runAll}
          disabled={runningAll}
          style={{
            background: runningAll ? "#93c5fd" : "#1d4ed8",
            color: "#fff", border: "none",
            borderRadius: "8px", padding: "8px 18px",
            fontSize: "13px", fontWeight: 700,
            cursor: runningAll ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {runningAll ? `Running ${allProgress}/${scenarios.length}...` : "▶ Run All Scenarios"}
        </button>
      </div>

      {/* Progress bar when running all */}
      {runningAll && (
        <div style={{
          height: "6px", background: "#e2e8f0",
          borderRadius: "3px", marginBottom: "20px", overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${(allProgress / scenarios.length) * 100}%`,
            background: "#2563eb",
            borderRadius: "3px",
            transition: "width 0.3s ease",
          }} />
        </div>
      )}

      {/* Scenario Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "12px",
      }}>
        {scenarios.map(scenario => {
          const s = statuses[scenario.id];
          const status = s?.status ?? "idle";
          const isExpanded = expanded[scenario.id];

          return (
            <div
              key={scenario.id}
              style={{
                background: "var(--surface)",
                border: `1px solid ${
                  status === "passed" ? "#86efac" :
                  status === "failed" ? "#fca5a5" :
                  "var(--border, #e2e8f0)"
                }`,
                borderRadius: "10px",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {/* Card header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    background: "#1e3a8a", color: "#fff",
                    borderRadius: "6px", padding: "2px 8px",
                    fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px",
                    flexShrink: 0,
                  }}>
                    {scenario.id}
                  </span>
                  <StatusBadge status={status} />
                </div>
                <button
                  onClick={() => runScenario(scenario.id)}
                  disabled={status === "running" || runningAll}
                  style={{
                    background: status === "running" ? "#e2e8f0" : "#f0f9ff",
                    border: `1px solid ${status === "running" ? "#cbd5e1" : "#bfdbfe"}`,
                    borderRadius: "6px",
                    padding: "3px 10px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: status === "running" ? "#94a3b8" : "#1d4ed8",
                    cursor: (status === "running" || runningAll) ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {status === "running" ? "⟳" : "▶ Run"}
                </button>
              </div>

              {/* Description */}
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)", lineHeight: "1.3" }}>
                {scenario.description}
              </div>

              {/* Meta */}
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>
                  <span style={{ fontWeight: 600 }}>Tax: </span>{scenario.taxVariant}
                </div>
                <div style={{ fontSize: "11px", color: "var(--foreground-muted)" }}>
                  <span style={{ fontWeight: 600 }}>Type: </span>{scenario.saleType}
                </div>
              </div>

              {/* Required fields pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {scenario.requiredFields.map(f => (
                  <span key={f} style={{
                    background: "#f1f5f9", color: "#475569",
                    border: "1px solid #e2e8f0",
                    borderRadius: "4px", padding: "1px 7px",
                    fontSize: "10px", fontWeight: 600,
                  }}>
                    {f}
                  </span>
                ))}
              </div>

              {/* Notes */}
              {scenario.notes && (
                <div style={{ fontSize: "11px", color: "var(--foreground-muted)", lineHeight: "1.4", fontStyle: "italic" }}>
                  {scenario.notes}
                </div>
              )}

              {/* Result section */}
              {s && s.status !== "idle" && s.status !== "running" && (
                <div style={{
                  marginTop: "4px",
                  borderTop: "1px solid var(--border, #e2e8f0)",
                  paddingTop: "8px",
                }}>
                  {s.status === "failed" && s.error && (
                    <div style={{ fontSize: "11px", color: "#dc2626", marginBottom: "6px" }}>
                      Error: {s.error}
                    </div>
                  )}
                  {s.invoiceId && (
                    <div style={{ fontSize: "11px", color: "#16a34a", marginBottom: "4px", fontWeight: 600 }}>
                      Invoice created: {s.invoiceId.substring(0, 8)}...
                    </div>
                  )}
                  <button
                    onClick={() => setExpanded(prev => ({ ...prev, [scenario.id]: !prev[scenario.id] }))}
                    style={{
                      background: "none", border: "none", padding: 0,
                      fontSize: "11px", color: "#64748b", cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {isExpanded ? "▲ Hide result" : "▼ Show result JSON"}
                  </button>
                  {isExpanded && (
                    <pre style={{
                      marginTop: "6px",
                      background: "#f8faff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      padding: "8px",
                      fontSize: "10px",
                      color: "#374151",
                      overflow: "auto",
                      maxHeight: "150px",
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}>
                      {JSON.stringify(s.result ?? { error: s.error }, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ScenarioStatus }) {
  const config = {
    idle:    { label: "Idle",    bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" },
    running: { label: "⟳ Running", bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
    passed:  { label: "✓ Pass",  bg: "#f0fdf4", color: "#16a34a", border: "#86efac" },
    failed:  { label: "✗ Fail",  bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" },
  }[status];

  return (
    <span style={{
      background: config.bg, color: config.color,
      border: `1px solid ${config.border}`,
      borderRadius: "4px", padding: "1px 7px",
      fontSize: "10px", fontWeight: 700,
    }}>
      {config.label}
    </span>
  );
}
