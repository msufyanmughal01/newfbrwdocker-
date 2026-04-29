"use client";

import { useState, useCallback } from "react";
import type { FBRScenario } from "@/lib/fbr/scenarios";

type CheckStatus = "idle" | "running" | "passed" | "failed";
type ScenarioStatus = "idle" | "running" | "passed" | "failed";

interface ApiCallDetails {
  method: string;
  endpoint: string;
  body?: unknown;
  response?: unknown;
  durationMs?: number;
  statusCode?: number | string;
}

interface PreflightCheck {
  id: string;
  description: string;
  status: CheckStatus;
  message?: string;
  endpoint?: string;
  durationMs?: number;
  apiCall?: ApiCallDetails;
}

interface ScenarioResult {
  status: ScenarioStatus;
  result?: Record<string, unknown>;
  error?: string;
  message?: string;
  invoiceId?: string;
  durationMs?: number;
  apiCall?: ApiCallDetails;
}

interface SandboxClientProps {
  scenarios: FBRScenario[];
}

const INITIAL_PREFLIGHT: PreflightCheck[] = [
  { id: "API_CONN",    description: "Test basic connectivity to FBR sandbox API" ,              status: "idle" },
  { id: "TOKEN_VALID", description: "Verify sandbox API token is valid and has required permissions", status: "idle" },
];

export function SandboxClient({ scenarios }: SandboxClientProps) {
  const [statuses, setStatuses] = useState<Record<string, ScenarioResult>>({});
  const [runningAll, setRunningAll] = useState(false);
  const [allProgress, setAllProgress] = useState(0);
  const [preflight, setPreflight] = useState<PreflightCheck[]>(INITIAL_PREFLIGHT);
  const [preflightRunning, setPreflightRunning] = useState(false);

  const runPreflightChecks = useCallback(async (): Promise<boolean> => {
    setPreflightRunning(true);
    setPreflight(INITIAL_PREFLIGHT.map(c => ({ ...c, status: "running" as CheckStatus })));
    const t0 = Date.now();
    try {
      const res = await fetch("/api/sandbox/check-connection", { method: "POST" });
      const data = await res.json();
      if (data.checks) {
        setPreflight(data.checks.map((c: PreflightCheck) => ({ ...c })));
        return data.checks.every((c: PreflightCheck) => c.status === "passed");
      }
      const durationMs = Date.now() - t0;
      setPreflight(INITIAL_PREFLIGHT.map(c => ({
        ...c,
        status: "failed",
        message: data.error ?? "Unknown error",
        durationMs,
        apiCall: {
          method: "POST",
          endpoint: "/api/sandbox/check-connection",
          response: data,
          durationMs,
          statusCode: res.status,
        },
      })));
      return false;
    } catch (err) {
      const durationMs = Date.now() - t0;
      setPreflight(INITIAL_PREFLIGHT.map(c => ({
        ...c,
        status: "failed",
        message: "Network error",
        durationMs,
        apiCall: {
          method: "POST",
          endpoint: "/api/sandbox/check-connection",
          response: { error: err instanceof Error ? err.message : "Network error" },
          durationMs,
        },
      })));
      return false;
    } finally {
      setPreflightRunning(false);
    }
  }, []);

  const runScenario = useCallback(async (scenarioId: string): Promise<ScenarioResult> => {
    setStatuses(prev => ({ ...prev, [scenarioId]: { status: "running" } }));
    const t0 = Date.now();
    try {
      const res = await fetch("/api/sandbox/run-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId }),
      });
      const data = await res.json();
      const apiCall = {
        method: "POST",
        endpoint: "/api/sandbox/run-scenario",
        body: { scenarioId },
        response: data,
        durationMs: Date.now() - t0,
        statusCode: res.status,
      };
      const result: ScenarioResult = {
        status: data.success ? "passed" : "failed",
        result: data.result,
        error: data.error,
        message: data.message,
        invoiceId: data.invoiceId,
        durationMs: data.durationMs ?? apiCall.durationMs,
        apiCall: data.apiCall ?? apiCall,
      };
      setStatuses(prev => ({ ...prev, [scenarioId]: result }));
      return result;
    } catch (err) {
      const result: ScenarioResult = {
        status: "failed",
        error: err instanceof Error ? err.message : "Network error",
        durationMs: Date.now() - t0,
        apiCall: {
          method: "POST",
          endpoint: "/api/sandbox/run-scenario",
          body: { scenarioId },
          response: { error: err instanceof Error ? err.message : "Network error" },
          durationMs: Date.now() - t0,
        },
      };
      setStatuses(prev => ({ ...prev, [scenarioId]: result }));
      return result;
    }
  }, []);

  const runAll = async () => {
    setRunningAll(true);
    setAllProgress(0);
    const ok = await runPreflightChecks();
    if (!ok) {
      setRunningAll(false);
      return;
    }
    for (let i = 0; i < scenarios.length; i++) {
      await runScenario(scenarios[i].id);
      setAllProgress(i + 1);
    }
    setRunningAll(false);
  };

  const passedCount = Object.values(statuses).filter(s => s.status === "passed").length;
  const failedCount = Object.values(statuses).filter(s => s.status === "failed").length;
  const totalRun = passedCount + failedCount;

  const preflightDone = preflight.some(c => c.status !== "idle");

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

      {/* Pre-flight Checks */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border, #e2e8f0)",
        borderRadius: "10px", padding: "14px 18px", marginBottom: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: preflightDone ? "12px" : "0" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--foreground-muted)", letterSpacing: "0.6px", textTransform: "uppercase" }}>
            Pre-flight Checks
          </span>
          <button
            onClick={runPreflightChecks}
            disabled={preflightRunning || runningAll}
            style={{
              background: (preflightRunning || runningAll) ? "#e2e8f0" : "#f0f9ff",
              border: `1px solid ${(preflightRunning || runningAll) ? "#cbd5e1" : "#bfdbfe"}`,
              borderRadius: "6px", padding: "3px 12px",
              fontSize: "11px", fontWeight: 700,
              color: (preflightRunning || runningAll) ? "#94a3b8" : "#1d4ed8",
              cursor: (preflightRunning || runningAll) ? "not-allowed" : "pointer",
            }}
          >
            {preflightRunning ? "⟳ Checking..." : "Run Checks"}
          </button>
        </div>

        {preflightDone && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {preflight.map(check => (
              <div key={check.id} style={{
                display: "flex", alignItems: "flex-start", gap: "10px",
                padding: "8px 10px",
                background: check.status === "passed" ? "#f0fdf4" : check.status === "failed" ? "#fef2f2" : check.status === "running" ? "#eff6ff" : "#f8fafc",
                border: `1px solid ${check.status === "passed" ? "#86efac" : check.status === "failed" ? "#fca5a5" : check.status === "running" ? "#bfdbfe" : "#e2e8f0"}`,
                borderRadius: "7px",
              }}>
                <span style={{
                  background: "#1e3a8a", color: "#fff",
                  borderRadius: "5px", padding: "2px 7px",
                  fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px",
                  flexShrink: 0, marginTop: "1px",
                }}>
                  {check.id}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>{check.description}</span>
                    <CheckStatusBadge status={check.status} />
                    {check.durationMs !== undefined && check.status !== "running" && (
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                        {(check.durationMs / 1000).toFixed(2)}s
                      </span>
                    )}
                  </div>
                  {check.message && (
                    <div style={{ fontSize: "11px", color: check.status === "failed" ? "#dc2626" : "#16a34a", marginTop: "2px", fontWeight: 500 }}>
                      {check.message}
                    </div>
                  )}
                  {check.endpoint && (
                    <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px", fontFamily: "monospace", wordBreak: "break-all" }}>
                      {check.endpoint}
                    </div>
                  )}
                  <ApiDetails apiCall={check.apiCall} />
                </div>
              </div>
            ))}
          </div>
        )}
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
                  {/* Timing */}
                  {s.durationMs !== undefined && (
                    <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px", fontWeight: 600 }}>
                      ⏱ {(s.durationMs / 1000).toFixed(2)}s
                    </div>
                  )}
                  {s.status === "failed" && s.error && (
                    <div style={{ fontSize: "11px", color: "#dc2626", marginBottom: "6px" }}>
                      Error: {s.error}
                    </div>
                  )}
                  {s.status === "passed" && s.result && (
                    <div style={{ fontSize: "11px", color: "#16a34a", marginBottom: "4px", fontWeight: 500 }}>
                      FBR Invoice: {String(s.result.fbrInvoiceNumber ?? "")}
                    </div>
                  )}
                  {s.invoiceId && (
                    <div style={{ fontSize: "11px", color: "#16a34a", marginBottom: "4px" }}>
                      Invoice ID: {s.invoiceId.substring(0, 8)}...
                    </div>
                  )}
                  <ApiDetails apiCall={s.apiCall} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ApiDetails({ apiCall }: { apiCall?: ApiCallDetails }) {
  if (!apiCall) return null;

  return (
    <details style={{ marginTop: "6px" }}>
      <summary style={{
        fontSize: "11px",
        color: "#64748b",
        cursor: "pointer",
        fontWeight: 700,
      }}>
        Show API details
      </summary>
      <div style={{
        marginTop: "6px",
        background: "#f8faff",
        border: "1px solid #e2e8f0",
        borderRadius: "6px",
        padding: "8px",
      }}>
        <div style={{ fontSize: "10px", color: "#475569", fontFamily: "monospace", wordBreak: "break-all", marginBottom: "6px" }}>
          {apiCall.method} {apiCall.endpoint}
          {apiCall.statusCode !== undefined ? ` (${apiCall.statusCode})` : ""}
          {apiCall.durationMs !== undefined ? ` - ${(apiCall.durationMs / 1000).toFixed(2)}s` : ""}
        </div>
        <JsonBlock title="Request body" value={apiCall.body ?? null} />
        <JsonBlock title="Response" value={apiCall.response ?? null} />
      </div>
    </details>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div style={{ marginTop: "6px" }}>
      <div style={{ fontSize: "10px", color: "#334155", fontWeight: 700, marginBottom: "3px" }}>
        {title}
      </div>
      <pre style={{
        margin: 0,
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "5px",
        padding: "7px",
        fontSize: "10px",
        color: "#374151",
        overflow: "auto",
        maxHeight: "180px",
        fontFamily: "monospace",
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
      }}>
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function CheckStatusBadge({ status }: { status: CheckStatus }) {
  const config = {
    idle:    { label: "Idle",       bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0" },
    running: { label: "⟳ Checking", bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
    passed:  { label: "✓ Pass",     bg: "#f0fdf4", color: "#16a34a", border: "#86efac" },
    failed:  { label: "✗ Fail",     bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" },
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
