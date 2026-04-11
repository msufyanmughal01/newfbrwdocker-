import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0c1a3a 0%, #1e3a8a 50%, #1d4ed8 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      position: "relative",
      overflowX: "hidden",
      overflowY: "auto",
    }}>
      {/* Grid dot pattern */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
        pointerEvents: "none",
      }} />
      {/* Glow orbs */}
      <div style={{
        position: "absolute", top: "-200px", right: "-100px",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-100px", left: "-100px",
        width: "380px", height: "380px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: "440px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "10px",
            marginBottom: "8px",
          }}>
            <div style={{
              width: "42px", height: "42px", borderRadius: "12px",
              background: "linear-gradient(135deg, #60a5fa, #34d399)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(96,165,250,0.4)",
            }}>
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="2" width="14" height="16" rx="2" stroke="white" strokeWidth="1.5" />
                <line x1="6" y1="7" x2="14" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="6" y1="10" x2="14" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="6" y1="13" x2="10" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: "22px", color: "#ffffff", letterSpacing: "-0.01em" }}>
              Easy<span style={{ color: "#60a5fa" }}>Digital</span> Invoice
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", margin: 0 }}>
            Digital Tax Compliance Portal · Pakistan
          </p>
        </div>

        {/* White card */}
        <div style={{
          background: "#ffffff",
          borderRadius: "20px",
          padding: "36px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.2)",
        }}>
          {children}
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "20px" }}>
          © {new Date().getFullYear()} Easy Digital Invoice · Secure Portal
        </p>
      </div>
    </div>
  );
}
