"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";

interface DashboardShellProps {
  userName: string;
  children: React.ReactNode;
}

export function DashboardShell({ userName, children }: DashboardShellProps) {
  // SSR-safe default: server always renders with sidebar open (true).
  // useEffect will correct this instantly (no transition) on the client.
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // Transitions are disabled until after the initial viewport-based correction
  // fires, preventing the animated collapse flash in production builds.
  const [transitionsEnabled, setTransitionsEnabled] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const handleMobileMenuToggle = () => setIsMobileOpen((prev) => !prev);
  const handleMobileClose = () => setIsMobileOpen(false);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const tabletOrMobileQuery = window.matchMedia("(max-width: 767px)");

    // Immediately correct state to match the actual viewport — no animation yet.
    setIsSidebarOpen(desktopQuery.matches);

    // Enable transitions on the next frame, after the initial correction has
    // been committed to the DOM. User-initiated toggles will animate from here.
    requestAnimationFrame(() => setTransitionsEnabled(true));

    const handleDesktopChange = (e: MediaQueryListEvent) => {
      setIsSidebarOpen(e.matches);
      if (e.matches) setIsMobileOpen(false);
    };

    const handleMobileChange = (e: MediaQueryListEvent) => {
      if (!e.matches) setIsMobileOpen(false);
    };

    desktopQuery.addEventListener("change", handleDesktopChange);
    tabletOrMobileQuery.addEventListener("change", handleMobileChange);

    return () => {
      desktopQuery.removeEventListener("change", handleDesktopChange);
      tabletOrMobileQuery.removeEventListener("change", handleMobileChange);
    };
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        isMobileOpen={isMobileOpen}
        onMobileClose={handleMobileClose}
        transitionsEnabled={transitionsEnabled}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <Header userName={userName} onMobileMenuToggle={handleMobileMenuToggle} />
        <main className="flex-1 overflow-auto bg-transparent p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
