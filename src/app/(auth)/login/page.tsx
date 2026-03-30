import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Sign In</h1>
        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Welcome back to TaxDigital
        </p>
      </div>
      <LoginForm />
      <div className="text-center">
        <Link
          href="/"
          className="text-xs text-[var(--foreground-subtle)] hover:text-[var(--foreground-muted)] transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
