import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Reset Password</h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Enter your new password below
        </p>
      </div>
      <Suspense fallback={<div className="text-center text-sm text-[var(--foreground-muted)]">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
