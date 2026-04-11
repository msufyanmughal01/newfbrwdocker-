import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getBusinessProfile } from "@/lib/settings/business-profile";
import { FBR_SCENARIOS } from "@/lib/fbr/scenarios";
import { SandboxClient } from "./sandbox-client";
import Link from "next/link";

export default async function SandboxPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const profile = await getBusinessProfile(session.user.id);
  const isSandbox = profile?.fbrEnvironment === "sandbox";

  if (!isSandbox) {
    return (
      <div style={{ maxWidth: "600px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--foreground)", marginBottom: "8px" }}>
          Sandbox Testing
        </h1>
        <p style={{ fontSize: "14px", color: "var(--foreground-muted)", marginBottom: "24px" }}>
          Run pre-built FBR invoice scenarios against the test environment.
        </p>
        <div style={{
          background: "#fffbeb", border: "1px solid #fbbf24",
          borderRadius: "12px", padding: "24px",
          display: "flex", flexDirection: "column", gap: "12px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "24px" }}>⚠️</span>
            <div style={{ fontWeight: 700, fontSize: "15px", color: "#92400e" }}>
              Sandbox mode is not enabled
            </div>
          </div>
          <p style={{ fontSize: "14px", color: "#78350f", margin: 0 }}>
            To use the sandbox testing page, switch your FBR environment to <strong>Sandbox</strong> in Settings.
          </p>
          <Link
            href="/settings?tab=fbr"
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "#d97706", color: "#fff",
              borderRadius: "8px", padding: "9px 18px",
              fontSize: "13px", fontWeight: 700,
              textDecoration: "none", width: "fit-content",
            }}
          >
            Go to FBR Settings →
          </Link>
        </div>
      </div>
    );
  }

  return <SandboxClient scenarios={FBR_SCENARIOS} />;
}
