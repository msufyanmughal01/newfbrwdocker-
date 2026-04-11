"use client";
import { useState } from "react";
import Link from "next/link";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Open menu"
        style={{
          background: "none", border: "1px solid #e2e8f0", borderRadius: "8px",
          padding: "7px 9px", cursor: "pointer", color: "#0f172a",
          display: "flex", flexDirection: "column", gap: "4px",
        }}
      >
        <span style={{ width: "18px", height: "2px", background: "#334155", borderRadius: "2px", display: "block", transition: "all 0.2s", transform: open ? "rotate(45deg) translate(4px, 4px)" : "none" }} />
        <span style={{ width: "18px", height: "2px", background: "#334155", borderRadius: "2px", display: "block", opacity: open ? 0 : 1, transition: "all 0.2s" }} />
        <span style={{ width: "18px", height: "2px", background: "#334155", borderRadius: "2px", display: "block", transition: "all 0.2s", transform: open ? "rotate(-45deg) translate(4px, -4px)" : "none" }} />
      </button>

      {open && (
        <div style={{
          position: "fixed", top: "68px", left: 0, right: 0, zIndex: 100,
          background: "#ffffff", borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
          padding: "16px 20px",
          display: "flex", flexDirection: "column", gap: "4px",
        }}>
          {[
            { href: "#features", label: "Features" },
            { href: "#how", label: "How It Works" },
            { href: "#pricing", label: "Pricing" },
            { href: "#contact", label: "Contact" },
          ].map(item => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              style={{
                fontSize: "15px", fontWeight: 600, color: "#334155",
                textDecoration: "none", padding: "12px 16px",
                borderRadius: "10px", display: "block",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {item.label}
            </a>
          ))}

          <div style={{ borderTop: "1px solid #e2e8f0", marginTop: "8px", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              style={{
                fontSize: "15px", fontWeight: 600, color: "#1d4ed8",
                textDecoration: "none", padding: "12px 16px",
                borderRadius: "10px", display: "block", textAlign: "center",
                border: "1.5px solid #bfdbfe", background: "#eff6ff",
              }}
            >
              Login
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              style={{
                fontSize: "15px", fontWeight: 700, color: "white",
                textDecoration: "none", padding: "13px 16px",
                borderRadius: "10px", display: "block", textAlign: "center",
                background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
                boxShadow: "0 4px 14px rgba(29,78,216,0.35)",
              }}
            >
              Get Started Free →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
