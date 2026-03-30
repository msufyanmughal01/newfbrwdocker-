// T038 [US4]: Dashboard page — analytics with date filtering
// Server component: fetches initial metrics server-side, eliminating client-side waterfall

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardMetrics, getRevenueTrend } from "@/lib/analytics/dashboard-metrics";
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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const { from, to } = getDefaultDates();

  const [initialMetrics, initialTrend] = await Promise.all([
    getDashboardMetrics(session.user.id, from, to),
    getRevenueTrend(session.user.id, from, to),
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
        />
      </div>
    </div>
  );
}
