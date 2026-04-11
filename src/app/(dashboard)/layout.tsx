import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getBusinessProfile } from "@/lib/settings/business-profile";

// All dashboard routes are private — never indexed by search engines
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const profile = await getBusinessProfile(session.user.id);
  const isSandbox = (profile?.fbrEnvironment ?? 'sandbox') === 'sandbox';

  return (
    <DashboardShell userName={session.user.name} isSandbox={isSandbox}>
      {children}
    </DashboardShell>
  );
}
