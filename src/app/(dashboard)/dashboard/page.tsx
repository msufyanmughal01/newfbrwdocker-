// T038 [US4]: Dashboard page — analytics with date filtering
// Server component: fetches initial metrics server-side, eliminating client-side waterfall

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import type { Metadata } from "next";
import { getDashboardMetrics, getRevenueTrend, getRecentInvoices } from "@/lib/analytics/dashboard-metrics";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your FBR invoicing analytics — total revenue, sales tax, invoice count, and recent activity.",
};
import { getQuotaStatus } from "@/lib/subscriptions/quota";
import { getBusinessProfile } from "@/lib/settings/business-profile";
import { DashboardContent } from "./DashboardContent";

function getDefaultDates() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return {
    from: firstOfMonth.toISOString().split("T")[0],
    to: today.toISOString().split("T")[0],
  };
}

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { from, to } = getDefaultDates();

  const [initialMetrics, initialTrend, planStatus, recentInvoices, sellerProfile] = await Promise.all([
    getDashboardMetrics(session.user.id, from, to),
    getRevenueTrend(session.user.id, from, to),
    getQuotaStatus(session.user.id),
    getRecentInvoices(session.user.id, 6),
    getBusinessProfile(session.user.id),
  ]);

  return (
    <div className="animate-fade-up">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Welcome back, {session.user.name}
          </p>
        </div>
        <DashboardContent
          initialMetrics={initialMetrics}
          initialTrend={initialTrend}
          initialFrom={from}
          initialTo={to}
          planStatus={{
            planSlug: planStatus.planSlug,
            planName: planStatus.planName,
            invoicesPerMonth: planStatus.invoicesPerMonth,
            invoicesUsed: planStatus.invoicesUsed,
            fbrEnvironment: planStatus.fbrEnvironment,
            limitReached: planStatus.limitReached,
          }}
          recentInvoices={recentInvoices}
          sellerProfile={sellerProfile ? {
            ntnCnic: sellerProfile.ntnCnic,
            cnic: sellerProfile.cnic,
            businessCredentials: sellerProfile.businessCredentials as Array<{ type: string; value: string; includeInInvoice: boolean }> | null,
            fbrTokenHint: sellerProfile.fbrTokenHint,
            fbrEnvironment: sellerProfile.fbrEnvironment,
          } : null}
        />
      </div>
    </div>
  );
}
