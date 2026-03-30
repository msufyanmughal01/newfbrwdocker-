import { SetupOrganizationForm } from "@/components/auth/SetupOrganizationForm";

export default function SetupOrganizationPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          Create Your Organization
        </h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Set up your organization to get started
        </p>
      </div>
      <SetupOrganizationForm />
    </div>
  );
}
