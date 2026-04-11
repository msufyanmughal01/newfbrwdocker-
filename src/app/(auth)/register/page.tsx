import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/SignupForm";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create a free Easy Digital Invoice account and start generating FBR-compliant invoices for your business.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://easydigitalinvoice.com"}/register`,
  },
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <SignupForm />
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
