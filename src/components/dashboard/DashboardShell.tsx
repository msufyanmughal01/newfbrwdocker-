"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";

interface DashboardShellProps {
  userName: string;
  children: React.ReactNode;
}

export function DashboardShell({ userName, children }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const handleMobileMenuToggle = () => setIsMobileOpen((prev) => !prev);
  const handleMobileClose = () => setIsMobileOpen(false);

  // Collapse sidebar on tablet (< 1024px); auto-close mobile drawer on resize to desktop
  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const tabletOrMobileQuery = window.matchMedia("(max-width: 767px)");

    const handleDesktopChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        // Crossed into desktop — restore sidebar open state
        setIsSidebarOpen(true);
        setIsMobileOpen(false);
      } else {
        // Dropped below 1024px — collapse sidebar for tablet
        setIsSidebarOpen(false);
      }
    };

    const handleMobileChange = (e: MediaQueryListEvent) => {
      if (!e.matches) {
        // Crossed above mobile breakpoint — close mobile drawer
        setIsMobileOpen(false);
      }
    };

    // Set initial state based on current viewport
    if (!desktopQuery.matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSidebarOpen(false);
    }

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
