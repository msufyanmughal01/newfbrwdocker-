"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";

interface DashboardShellProps {
  userName: string;
  isSandbox?: boolean;
  children: React.ReactNode;
}

export function DashboardShell({ userName, isSandbox = false, children }: DashboardShellProps) {

  // Blank the page immediately if restored from bfcache — prevents any flash
  // of authenticated content while the session check is in flight.
  const [visible, setVisible] = useState(false);

  // Detect bfcache restores (browser Back/Forward after logout).
  // When event.persisted is true the page was served from bfcache — no server
  // request was made, so proxy auth checks never ran. We ping the session API
  // and redirect to /login if the session is gone.
  useEffect(() => {
    // Mark visible immediately for normal (non-bfcache) loads.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);

    const checkSession = async (hideFirst: boolean) => {
      if (hideFirst) setVisible(false);
      try {
        const res = await fetch("/api/auth/get-session", { credentials: "include", cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.user) {
          window.location.replace("/login");
        } else {
          setVisible(true);
        }
      } catch {
        window.location.replace("/login");
      }
    };

    // bfcache restore (desktop browsers / some mobile).
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) checkSession(true);
    };

    // Tab focus / app foreground (mobile browsers, PWA, tab switching).
    // This catches Next.js client-side router cache restores where pageshow
    // never fires with e.persisted = true.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") checkSession(false);
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

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
    const tabletOrMobileQuery = window.matchMedia("(max-width: 1023px)");

    // Immediately correct state to match the actual viewport — no animation yet.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <div className="flex h-screen flex-col" style={{ visibility: visible ? "visible" : "hidden" }}>
      <div className="flex flex-1 min-h-0">
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
          isMobileOpen={isMobileOpen}
          onMobileClose={handleMobileClose}
          transitionsEnabled={transitionsEnabled}
          isSandbox={isSandbox}
        />
        <div className="flex flex-1 flex-col min-w-0">
          <Header userName={userName} onMobileMenuToggle={handleMobileMenuToggle} />
          <main className="flex-1 overflow-auto bg-transparent p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
