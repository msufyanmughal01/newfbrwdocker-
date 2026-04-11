import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getBusinessProfile } from "@/lib/settings/business-profile";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your company profile, FBR integration credentials, billing plan, and security settings.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const activeTab = resolvedParams?.tab ?? "company";
  const profile = await getBusinessProfile(session.user.id);

  return (
    <SettingsClient
      profile={profile}
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
      activeTab={activeTab}
    />
  );
}
