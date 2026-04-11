"use client";

import { useState, useEffect } from "react";
import { PLAN_LIST } from "@/lib/subscriptions/plans";
import type { BusinessProfile } from "@/lib/db/schema/business-profiles";

type Profile = Omit<BusinessProfile, 'fbrTokenEncrypted'>;

interface BillingTabProps {
  profile: Profile | null;
}

interface QuotaData {
  planSlug: string;
  planName: string;
  monthlyPrice: number | null;
  invoicesPerMonth: number | null;
  invoicesUsed: number;
  cycleStart: string;
  fbrEnvironment: string;
  limitReached: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      style={{
        background: copied ? "var(--positive-bg)" : "var(--surface-3)",
        border: `1px solid ${copied ? "var(--positive)" : "var(--border)"}`,
        borderRadius: "6px",
        padding: "4px 10px",
        fontSize: "12px",
        cursor: "pointer",
        color: copied ? "var(--positive)" : "var(--foreground-muted)",
        fontWeight: 600,
        transition: "all 0.15s",
      }}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

export function BillingTab({ profile }: BillingTabProps) {
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/plan-status")
      .then(r => r.json())
      .then(setQuota)
      .catch(() => {});
  }, []);

  const currentPlan = PLAN_LIST.find(p => p.slug === (quota?.planSlug ?? profile?.planSlug ?? "standard")) ?? PLAN_LIST[0];
  const pct = quota && quota.invoicesPerMonth ? Math.min(100, (quota.invoicesUsed / quota.invoicesPerMonth) * 100) : 0;
  const barColor = pct >= 90 ? "#ef4444" : pct >= 75 ? "#f59e0b" : "#22c55e";

  return (
    <div>
      {/* Current Plan */}
      <div style={{
        background: "var(--surface)", border: `2px solid ${currentPlan.color}40`,
        borderRadius: "12px", padding: "20px", marginBottom: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{
                background: currentPlan.color + "18", color: currentPlan.color,
                border: `1.5px solid ${currentPlan.color}40`,
                borderRadius: "20px", padding: "3px 12px",
                fontSize: "12px", fontWeight: 700,
              }}>{currentPlan.name} Plan</span>
              {currentPlan.monthlyPrice === 0 && (
                <span style={{ background: "#dcfce7", color: "#166534", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 700 }}>FREE</span>
              )}
            </div>
            <div style={{ fontSize: "13px", color: "var(--foreground-muted)", marginTop: "6px" }}>
              {currentPlan.monthlyPrice === 0 ? "Free plan" : `Rs ${currentPlan.monthlyPrice.toLocaleString()}/month`}
              {profile?.planActivatedAt && (
                <span style={{ marginLeft: "10px" }}>
                  · Active since {new Date(profile.planActivatedAt).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Usage Bar */}
        {quota && quota.invoicesPerMonth && (
          <div style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
              <span style={{ color: "var(--foreground-muted)", fontWeight: 600 }}>Invoices this billing cycle</span>
              <span style={{ fontWeight: 700, color: pct >= 90 ? "#ef4444" : "var(--foreground)" }}>
                {quota.invoicesUsed} / {quota.invoicesPerMonth}
              </span>
            </div>
            <div style={{ height: "8px", borderRadius: "4px", background: "var(--border, #e2e8f0)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: "4px", transition: "width 0.4s" }} />
            </div>
            {quota.cycleStart && (
              <div style={{ fontSize: "11px", color: "var(--foreground-muted)", marginTop: "4px" }}>
                Cycle started {new Date(quota.cycleStart).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Plans Comparison */}
      <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "14px", color: "var(--foreground)" }}>Available Plans</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {PLAN_LIST.map(plan => {
          const isCurrent = plan.slug === currentPlan.slug;
          return (
            <div key={plan.slug} style={{
              border: `2px solid ${isCurrent ? plan.color : "var(--border)"}`,
              borderRadius: "12px", padding: "18px",
              background: isCurrent ? plan.color + "08" : "var(--surface)",
              position: "relative",
            }}>
              {isCurrent && (
                <div style={{
                  position: "absolute", top: "-10px", right: "14px",
                  background: plan.color, color: "#fff",
                  fontSize: "10px", fontWeight: 700, padding: "2px 10px",
                  borderRadius: "10px", letterSpacing: "0.05em",
                }}>CURRENT</div>
              )}
              <div style={{ fontWeight: 800, fontSize: "16px", color: "var(--foreground)", marginBottom: "4px" }}>{plan.name}</div>
              <div style={{ fontWeight: 700, fontSize: "20px", color: plan.color, marginBottom: "12px" }}>
                {plan.monthlyPrice === 0 ? "Free" : `Rs ${plan.monthlyPrice.toLocaleString()}/mo`}
              </div>
              <div style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "12px" }}>
                {plan.invoicesPerMonth === null ? "Unlimited invoices/month" : `${plan.invoicesPerMonth} invoices/month`}
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 14px", fontSize: "12px", color: "var(--foreground-muted)" }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ marginBottom: "4px" }}>✓ {f}</li>
                ))}
              </ul>
              {!isCurrent && (
                <button
                  onClick={() => { setSelectedPlan(plan.slug); setShowModal(true); }}
                  style={{
                    width: "100%", background: plan.color, color: "#fff",
                    border: "none", borderRadius: "7px", padding: "9px",
                    fontSize: "13px", fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Upgrade to {plan.name}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Upgrade Modal */}
      {showModal && selectedPlan && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: "16px",
        }}>
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "16px", padding: "28px",
            maxWidth: "460px", width: "100%", position: "relative",
          }}>
            <button
              onClick={() => setShowModal(false)}
              style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "var(--foreground-muted)" }}
            >×</button>
            <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px", color: "var(--foreground)" }}>Upgrade to {PLAN_LIST.find(p => p.slug === selectedPlan)?.name}</h2>
            <p style={{ color: "var(--foreground-muted)", fontSize: "14px", marginBottom: "20px" }}>
              To upgrade your plan, contact our team and we&apos;ll activate it within 24 hours after payment confirmation.
            </p>

            <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--primary)", marginBottom: "12px" }}>Contact Us</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--foreground-subtle)" }}>Phone / WhatsApp</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--foreground)" }}>03433161051</div>
                </div>
                <CopyButton text="03433161051" />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--foreground-subtle)" }}>Email</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--foreground)" }}>taxdigitalsupport@gmail.com</div>
                </div>
                <CopyButton text="taxdigitalsupport@gmail.com" />
              </div>
            </div>

            <div style={{ background: "var(--warning-bg)", border: "1px solid var(--warning)", borderRadius: "8px", padding: "12px", fontSize: "12px", color: "var(--warning)" }}>
              After payment confirmation, your plan will be upgraded within 24 hours.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
