"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SandboxBanner } from "@/components/dashboard/SandboxBanner";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  transitionsEnabled: boolean;
  isSandbox?: boolean;
}

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    href: "/invoices",
    label: "Invoices",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
  {
    href: "/invoices/drafts",
    label: "Drafts",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
  },
  {
    href: "/invoices/new",
    label: "New Invoice",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
  },
  {
    href: "/invoices/bulk",
    label: "Bulk Upload",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
  },
  {
    href: "/spreadsheet",
    label: "Spreadsheet",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="3" y1="15" x2="21" y2="15"/>
        <line x1="9" y1="3" x2="9" y2="21"/>
        <line x1="15" y1="3" x2="15" y2="21"/>
      </svg>
    ),
  },
  {
    href: "/clients",
    label: "Clients",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: "/settings/hs-codes",
    label: "HS Codes",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
  },
  {
    href: "/sandbox",
    label: "Sandbox",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5a2 2 0 0 1-2-2V9m6 5h10a2 2 0 0 0 2-2V9m0 0H3"/>
      </svg>
    ),
  },
];

const settingsIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

function SidebarContent({
  isOpen,
  onToggle,
  onNavClick,
  isSandbox,
}: {
  isOpen: boolean;
  onToggle: () => void;
  onNavClick?: () => void;
  isSandbox?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Logo + Toggle */}
      <div className={`border-b border-[var(--border)] ${isOpen ? "p-4" : "py-3 px-2"}`}>
        <div className={`flex items-center ${isOpen ? "gap-3" : "flex-col gap-2"}`}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)" }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="2" width="14" height="16" rx="2" stroke="white" strokeWidth="1.5" />
              <line x1="6" y1="7" x2="14" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="6" y1="10" x2="14" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="6" y1="13" x2="10" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          {isOpen && (
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-[var(--foreground)] leading-tight">
                Easy Digital Invoice
              </h2>
              <p className="text-xs text-[var(--foreground-subtle)] leading-tight">
                Digital Tax Compliance
              </p>
            </div>
          )}

          <button
            onClick={onToggle}
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="flex items-center justify-center w-6 h-6 rounded-md text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)] transition-all duration-150 shrink-0"
          >
            {isOpen ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto ${isOpen ? "p-3" : "p-2"}`}>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive =
              item.href === "/invoices"
                ? pathname === "/invoices"
                : item.href === "/invoices/drafts"
                ? pathname === "/invoices/drafts"
                : item.href === "/invoices/new"
                ? pathname === "/invoices/new"
                : item.href === "/invoices/bulk"
                ? pathname === "/invoices/bulk"
                : item.href === "/settings/hs-codes"
                ? pathname === "/settings/hs-codes"
                : pathname === item.href ||
                  pathname.startsWith(item.href + "/");

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={item.label}
                  onClick={onNavClick}
                  className={`flex items-center rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                    isOpen ? "gap-3 px-3 py-2.5" : "justify-center px-2 py-2.5"
                  } ${
                    isActive
                      ? "bg-[var(--primary-subtle)] text-[var(--primary)]"
                      : "text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  {isOpen && item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sandbox indicator — pinned above settings */}
      {isSandbox && (
        <div className={`${isOpen ? "pb-2" : "pb-1"}`}>
          <SandboxBanner collapsed={!isOpen} />
        </div>
      )}

      {/* Settings — pinned at bottom */}
      <div className={`border-t border-[var(--border)] ${isOpen ? "p-3" : "p-2"}`}>
        <Link
          href="/settings"
          title="Settings"
          aria-label="Settings"
          onClick={onNavClick}
          className={`flex items-center rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap ${
            isOpen ? "gap-3 px-3 py-2.5" : "justify-center px-2 py-2.5"
          } ${
            pathname.startsWith("/settings")
              ? "bg-[var(--primary-subtle)] text-[var(--primary)]"
              : "text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]"
          }`}
        >
          <span className="shrink-0">{settingsIcon}</span>
          {isOpen && "Settings"}
        </Link>
      </div>
    </div>
  );
}

export function Sidebar({ isOpen, onToggle, isMobileOpen, onMobileClose, transitionsEnabled, isSandbox }: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop — renders behind the drawer, closes on click */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Desktop sidebar — sticky, expand/collapse toggle */}
      {/* transition-all is withheld until after the initial viewport correction
          to prevent the animated collapse flash seen in production builds. */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 h-screen sticky top-0 border-r border-[var(--border)] overflow-hidden ${
          transitionsEnabled ? "transition-all duration-200 ease-in-out" : ""
        } ${isOpen ? "w-60" : "w-14"}`}
        style={{ background: "var(--bg-subtle)" }}
      >
        <SidebarContent isOpen={isOpen} onToggle={onToggle} isSandbox={isSandbox} />
      </aside>

      {/* Mobile drawer — fixed overlay, slides in from left */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-60 lg:hidden border-r border-[var(--border)] transition-transform duration-200 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--bg-subtle)" }}
        aria-hidden={!isMobileOpen}
      >
        <SidebarContent isOpen={true} onToggle={onMobileClose} onNavClick={onMobileClose} isSandbox={isSandbox} />
      </aside>
    </>
  );
}
