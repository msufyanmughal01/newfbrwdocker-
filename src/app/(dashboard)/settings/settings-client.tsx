"use client";

import Link from "next/link";
import { CompanyTab } from "@/components/settings/tabs/CompanyTab";
import { FBRTab } from "@/components/settings/tabs/FBRTab";
import { BillingTab } from "@/components/settings/tabs/BillingTab";
import { SecurityTab } from "@/components/settings/tabs/SecurityTab";
import type { BusinessProfile } from "@/lib/db/schema/business-profiles";

type Profile = Omit<BusinessProfile, 'fbrTokenEncrypted'>;

interface SettingsClientProps {
  profile: Profile | null;
  user: { name: string; email: string; image: string | null };
  activeTab: string;
}

const TABS = [
  {
    id: "company",
    label: "Company & Invoice",
    description: "Profile, logo, invoice defaults",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: "fbr",
    label: "FBR Integration",
    description: "NTN, CNIC, STRN, API token",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    id: "billing",
    label: "Billing & Payments",
    description: "Plan, usage, upgrade",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    id: "security",
    label: "Security",
    description: "Password, sessions",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SettingsClient({ profile, user: _user, activeTab }: SettingsClientProps) {
  const resolvedTab = TABS.find(t => t.id === activeTab) ? activeTab : "company";

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--foreground)", margin: "0 0 4px" }}>Settings</h1>
        <p style={{ fontSize: "13px", color: "var(--foreground-muted)", margin: 0 }}>
          Manage your company profile, FBR integration, and billing.
        </p>
      </div>

      {/* ── Mobile: horizontal tab strip ─────────────────────
           Visible on <md, hidden on md+ via Tailwind            */}
      <div className="flex md:hidden overflow-x-auto gap-1 pb-3 mb-4" style={{ scrollbarWidth: "none" }}>
        {TABS.map(tab => {
          const isActive = resolvedTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={`/settings?tab=${tab.id}`}
              style={{
                display: "flex", alignItems: "center", gap: "7px",
                padding: "8px 14px", borderRadius: "9px",
                textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
                border: `1.5px solid ${isActive ? "var(--primary)" : "var(--border)"}`,
                background: isActive ? "var(--primary-subtle)" : "var(--surface)",
                color: isActive ? "var(--primary)" : "var(--foreground-muted)",
                fontSize: "13px", fontWeight: isActive ? 700 : 500,
                transition: "all 0.15s",
              }}
            >
              <span style={{ display: "flex", color: isActive ? "var(--primary)" : "var(--foreground-subtle)" }}>
                {tab.icon}
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* ── Desktop: sidebar + content ────────────────────────
           Hidden on <md via className, shown as flex row on md+ */}
      <div className="flex gap-6 items-start">

        {/* Left sidebar nav — desktop only */}
        <nav
          className="hidden md:block"
          style={{
            width: "224px", flexShrink: 0,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "6px",
            position: "sticky", top: "24px",
          }}
        >
          {TABS.map(tab => {
            const isActive = resolvedTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={`/settings?tab=${tab.id}`}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 12px", borderRadius: "8px", marginBottom: "2px",
                  textDecoration: "none",
                  background: isActive ? "var(--primary-subtle)" : "transparent",
                  color: isActive ? "var(--primary)" : "var(--foreground-muted)",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                <span style={{ display: "flex", flexShrink: 0, color: isActive ? "var(--primary)" : "var(--foreground-subtle)" }}>
                  {tab.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: isActive ? 700 : 500, lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {tab.label}
                  </div>
                  <div style={{ fontSize: "11px", color: isActive ? "var(--primary)" : "var(--foreground-subtle)", marginTop: "1px", opacity: 0.85, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {tab.description}
                  </div>
                </div>
                {isActive && (
                  <svg style={{ flexShrink: 0 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Content pane */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {resolvedTab === "company"  && <CompanyTab profile={profile} />}
          {resolvedTab === "fbr"      && <FBRTab profile={profile} />}
          {resolvedTab === "billing"  && <BillingTab profile={profile} />}
          {resolvedTab === "security" && <SecurityTab />}
        </div>

      </div>
    </div>
  );
}
