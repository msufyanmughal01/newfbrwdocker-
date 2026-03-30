"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

interface HeaderProps {
  userName: string;
  onMobileMenuToggle: () => void;
}

export function Header({ userName, onMobileMenuToggle }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header
      className="flex h-14 items-center justify-between px-4 sm:px-6 border-b border-[var(--border)] sticky top-0 z-40"
      style={{
        background: "var(--bg-subtle-glass)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger button — visible on mobile only */}
        <button
          onClick={onMobileMenuToggle}
          aria-label="Open navigation menu"
          className="flex md:hidden items-center justify-center w-8 h-8 rounded-md text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-all duration-150"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <span className="text-sm font-medium text-[var(--foreground-muted)] hidden sm:block">
          TaxDigital
        </span>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* Avatar */}
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ml-1 shrink-0"
          style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)" }}
        >
          {initials}
        </div>

        <span className="text-sm text-[var(--foreground-muted)] hidden sm:block">
          {userName}
        </span>

        <button
          onClick={handleLogout}
          className="rounded-lg px-3 py-1.5 text-sm font-medium border border-[var(--border)] bg-transparent hover:bg-[var(--surface-2)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all duration-200 ml-1"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
