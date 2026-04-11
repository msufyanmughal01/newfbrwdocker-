"use client";

import { authClient } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/ThemeToggle";

interface HeaderProps {
  userName: string;
  onMobileMenuToggle: () => void;
}

export function Header({ userName, onMobileMenuToggle }: HeaderProps) {
  const handleLogout = async () => {
    await authClient.signOut();
    // Hard redirect — clears the Next.js client router cache so the dashboard
    // page is fully evicted. Using router.push() would keep the page in the
    // cache and allow the Back button to restore it from bfcache.
    // replace() removes the dashboard from browser history — the Back button
    // can no longer return to it after logout.
    window.location.replace("/login");
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
        background: "var(--bg-subtle)",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger button — visible on mobile/tablet only */}
        <button
          onClick={onMobileMenuToggle}
          aria-label="Open navigation menu"
          className="flex lg:hidden items-center justify-center w-8 h-8 rounded-md text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-all duration-150"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Logo + app name — visible on mobile (hidden on desktop since sidebar shows it) */}
        <div className="flex lg:hidden items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)" }}
          >
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="2" width="14" height="16" rx="2" stroke="white" strokeWidth="1.5" />
              <line x1="6" y1="7" x2="14" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="6" y1="10" x2="14" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="6" y1="13" x2="10" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-sm font-bold text-[var(--foreground)] leading-tight">
            Easy<span style={{ color: "#6366f1" }}>Digital</span> Invoice
          </span>
        </div>

        {/* App name on desktop (sidebar is visible but header still labels the app) */}
        <span className="text-sm font-medium text-[var(--foreground-muted)] hidden lg:block">
          Easy Digital Invoice
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
