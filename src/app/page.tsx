import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ContactForm } from "@/components/clientcomponents/ContactForm";
import { MobileNav } from "@/components/home/MobileNav";

/* ── Inline SVG: hero illustration ─────────────────────────── */
function InvoiceIllustration() {
  return (
    <svg
      viewBox="0 0 520 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", maxWidth: "500px", filter: "drop-shadow(0 24px 64px rgba(0,0,0,0.35))" }}
      className="animate-float"
    >
      {/* Main card */}
      <rect x="60" y="50" width="360" height="300" rx="20" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
      {/* Header bar */}
      <rect x="60" y="50" width="360" height="68" rx="20" fill="rgba(255,255,255,0.11)" />
      <rect x="60" y="98" width="360" height="20" fill="rgba(255,255,255,0.11)" />
      {/* Title + subtitle */}
      <rect x="84" y="70" width="110" height="13" rx="4" fill="rgba(255,255,255,0.65)" />
      <rect x="84" y="88" width="72" height="8" rx="3" fill="rgba(255,255,255,0.28)" />
      {/* Status badge */}
      <rect x="376" y="72" width="28" height="18" rx="9" fill="rgba(52,211,153,0.22)" stroke="rgba(52,211,153,0.5)" strokeWidth="1" />
      <circle cx="390" cy="81" r="4" fill="#34d399" className="animate-pulse-dot" />
      {/* Divider */}
      <line x1="84" y1="136" x2="396" y2="136" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      {/* Column headers */}
      <rect x="84" y="146" width="110" height="8" rx="3" fill="rgba(255,255,255,0.22)" />
      <rect x="268" y="146" width="52" height="8" rx="3" fill="rgba(255,255,255,0.22)" />
      <rect x="344" y="146" width="52" height="8" rx="3" fill="rgba(255,255,255,0.22)" />
      {/* Line items */}
      {([170, 192, 214, 236] as number[]).map((y, i) => (
        <g key={i}>
          <rect x="84" y={y} width={90 + i * 14} height="9" rx="3" fill="rgba(255,255,255,0.14)" />
          <rect x="268" y={y} width="48" height="9" rx="3" fill="rgba(255,255,255,0.11)" />
          <rect x="344" y={y} width="52" height="9" rx="3" fill="rgba(255,255,255,0.18)" />
        </g>
      ))}
      {/* Total row */}
      <rect x="60" y="264" width="360" height="1" fill="rgba(255,255,255,0.08)" />
      <rect x="84" y="276" width="72" height="11" rx="3" fill="rgba(255,255,255,0.42)" />
      <rect x="312" y="274" width="84" height="14" rx="6" fill="rgba(96,165,250,0.45)" />
      {/* Submit button */}
      <rect x="84" y="302" width="312" height="34" rx="11" fill="rgba(29,78,216,0.65)" stroke="rgba(96,165,250,0.35)" strokeWidth="1" />
      <rect x="188" y="314" width="104" height="10" rx="4" fill="rgba(255,255,255,0.75)" />

      {/* ── Floating FBR card ── */}
      <rect x="330" y="18" width="168" height="78" rx="14" fill="#0c1a3a" stroke="rgba(96,165,250,0.28)" strokeWidth="1.5" />
      <rect x="350" y="34" width="50" height="8" rx="3" fill="rgba(255,255,255,0.3)" />
      <rect x="350" y="48" width="88" height="17" rx="5" fill="rgba(52,211,153,0.35)" />
      <rect x="354" y="53" width="80" height="7" rx="3" fill="rgba(52,211,153,0.85)" />
      <rect x="350" y="72" width="104" height="7" rx="3" fill="rgba(255,255,255,0.18)" />

      {/* ── Floating Stats card ── */}
      <rect x="10" y="278" width="136" height="88" rx="14" fill="#0c1a3a" stroke="rgba(96,165,250,0.28)" strokeWidth="1.5" />
      <rect x="28" y="294" width="68" height="8" rx="3" fill="rgba(255,255,255,0.32)" />
      <rect x="28" y="308" width="92" height="20" rx="5" fill="rgba(96,165,250,0.28)" />
      <rect x="28" y="313" width="76" height="10" rx="4" fill="rgba(96,165,250,0.85)" />
      <rect x="28" y="336" width="52" height="7" rx="3" fill="rgba(255,255,255,0.2)" />

      {/* Decorative dots */}
      <circle cx="464" cy="190" r="5" fill="rgba(96,165,250,0.35)" />
      <circle cx="464" cy="208" r="3.5" fill="rgba(96,165,250,0.2)" />
      <circle cx="464" cy="224" r="2.5" fill="rgba(96,165,250,0.12)" />
      <circle cx="36" cy="150" r="5" fill="rgba(52,211,153,0.35)" />
      <circle cx="36" cy="168" r="3.5" fill="rgba(52,211,153,0.2)" />
      <circle cx="36" cy="184" r="2.5" fill="rgba(52,211,153,0.12)" />
    </svg>
  );
}

/* ── Feature SVG icons ──────────────────────────────────────── */
function IconInvoice() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
      <line x1="8" y1="9" x2="10" y2="9" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}
function IconUpload() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  );
}
function IconShield() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}
function IconZap() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/dashboard");

  const features = [
    { icon: <IconInvoice />, title: "FBR Invoice Submission", desc: "Submit invoices directly to FBR API with real-time validation and instant error feedback." },
    { icon: <IconUsers />, title: "Client Management", desc: "Maintain verified client records with NTN lookup and smart auto-fill on every invoice." },
    { icon: <IconChart />, title: "Revenue Analytics", desc: "Track monthly revenue, invoice counts, and tax collected with interactive visual charts." },
    { icon: <IconUpload />, title: "Bulk Upload", desc: "Upload hundreds of invoices via Excel or CSV, validate them all at once, and submit in bulk." },
    { icon: <IconShield />, title: "Secure Platform", desc: "Admin-controlled access. Only approved users can log in — no public self-registration." },
    { icon: <IconZap />, title: "Built for Speed", desc: "Hosted in South Asia with a static IP whitelisted directly with FBR for fast submissions." },
  ];

  return (
    <div style={{ background: "#f0f5ff", minHeight: "100vh", fontFamily: "var(--font-sans)" }}>

      {/* ── NAVBAR — solid white ─────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
      }}>
        <div style={{
          maxWidth: "1200px", margin: "0 auto", padding: "0 28px",
          height: "68px", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "10px",
              background: "linear-gradient(135deg, #1d4ed8, #06b6d4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(29,78,216,0.35)",
            }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="2" width="14" height="16" rx="2" stroke="white" strokeWidth="1.5" />
                <line x1="6" y1="7" x2="14" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="6" y1="10" x2="14" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="6" y1="13" x2="10" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: "20px", color: "#0f172a", letterSpacing: "-0.01em" }}>
              Tax<span style={{ color: "#1d4ed8" }}>Digital</span>
            </span>
          </div>
          {/* Desktop Links */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: "4px" }}>
            <a href="#features" style={{ fontSize: "14px", color: "#64748b", textDecoration: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: 500 }}>Features</a>
            <a href="#how" style={{ fontSize: "14px", color: "#64748b", textDecoration: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: 500 }}>How It Works</a>
            <a href="#contact" style={{ fontSize: "14px", color: "#64748b", textDecoration: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: 500 }}>Contact</a>
            <Link href="/login" style={{
              marginLeft: "8px", fontSize: "14px", fontWeight: 700, color: "white",
              background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
              padding: "9px 22px", borderRadius: "9px", textDecoration: "none",
              boxShadow: "0 3px 10px rgba(29,78,216,0.35)",
            }}>Sign In</Link>
          </div>
          {/* Mobile: Sign In + Hamburger */}
          <div className="flex md:hidden" style={{ alignItems: "center", gap: "10px" }}>
            <Link href="/login" style={{
              fontSize: "13px", fontWeight: 700, color: "white",
              background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
              padding: "8px 16px", borderRadius: "8px", textDecoration: "none",
            }}>Sign In</Link>
            <MobileNav />
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-24" style={{
        background: "linear-gradient(135deg, #0c1a3a 0%, #1e3a8a 45%, #1d4ed8 100%)",
        padding: undefined,
        paddingLeft: "20px", paddingRight: "20px",
        position: "relative",
        overflow: "hidden",
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
          position: "absolute", top: "-240px", right: "-160px",
          width: "640px", height: "640px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-80px", left: "-80px",
          width: "400px", height: "400px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div className="grid grid-cols-1 md:grid-cols-2" style={{
          maxWidth: "1200px", margin: "0 auto",
          alignItems: "center", gap: "48px",
          position: "relative", zIndex: 1,
        }}>
          {/* Left */}
          <div className="animate-slide-up">
            {/* Pill */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: "100px", padding: "6px 16px", marginBottom: "28px",
            }}>
              <span className="animate-pulse-dot" style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: "#22c55e", display: "inline-block",
              }} />
              <span style={{ fontSize: "13px", fontWeight: 500, color: "rgba(255,255,255,0.85)" }}>
                Digital Tax Compliance · Pakistan
              </span>
            </div>

            {/* H1 */}
            <h1 style={{
              fontSize: "clamp(38px, 5vw, 64px)", fontWeight: 900,
              lineHeight: 1.08, letterSpacing: "-0.03em",
              color: "#ffffff", marginBottom: "22px",
            }}>
              Smarter<br />
              <span style={{
                background: "linear-gradient(135deg, #60a5fa 0%, #34d399 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Invoicing
              </span>
              <br />for Pakistan
            </h1>

            <p style={{
              fontSize: "17px", color: "rgba(255,255,255,0.72)",
              lineHeight: 1.7, maxWidth: "460px", marginBottom: "40px",
            }}>
              Generate FBR-compliant invoices, manage clients, and submit tax data — all from one elegant dashboard built for Pakistani businesses.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <Link href="/login" style={{
                background: "#ffffff", color: "#1d4ed8",
                padding: "13px 30px", borderRadius: "10px",
                fontSize: "15px", fontWeight: 700, textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: "8px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
              }}>
                Get Started →
              </Link>
              <a href="#contact" style={{
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.9)",
                padding: "13px 30px", borderRadius: "10px",
                fontSize: "15px", fontWeight: 500,
                border: "1px solid rgba(255,255,255,0.18)",
                cursor: "pointer", textDecoration: "none",
              }}>
                Contact Admin
              </a>
            </div>

            {/* Stats */}
            <div style={{ marginTop: "56px", display: "flex", gap: "44px", flexWrap: "wrap" }}>
              {[
                { n: "500+", l: "Active Businesses" },
                { n: "99.9%", l: "FBR Success Rate" },
                { n: "< 2s", l: "Response Time" },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>{s.n}</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", marginTop: "3px" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: illustration — hidden on small screens */}
          <div className="hidden md:flex" style={{ justifyContent: "center", alignItems: "center" }}>
            <InvoiceIllustration />
          </div>
        </div>
      </section>

      {/* ── WAVE ─────────────────────────────────────────────── */}
      <div style={{ background: "#f0f5ff", marginTop: "-2px" }}>
        <svg viewBox="0 0 1440 72" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%" }}>
          <path d="M0 0C240 72 480 72 720 36C960 0 1200 0 1440 36V72H0V0Z" fill="#1d4ed8" fillOpacity="0.06" />
          <path d="M0 24C240 72 480 48 720 48C960 48 1200 24 1440 48V72H0V24Z" fill="#1d4ed8" fillOpacity="0.04" />
        </svg>
      </div>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" style={{ padding: "96px 28px", background: "#f0f5ff" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }} className="animate-slide-up">
            <div style={{
              display: "inline-block", background: "#dbeafe",
              color: "#1d4ed8", fontSize: "12px", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "5px 14px", borderRadius: "100px", marginBottom: "16px",
            }}>
              Features
            </div>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", margin: 0 }}>
              Everything your business needs
            </h2>
            <p style={{ fontSize: "16px", color: "#64748b", marginTop: "12px" }}>
              A complete FBR invoicing solution from submission to analytics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="animate-scale-in"
                style={{
                  background: "#ffffff",
                  border: "1px solid #dbeafe",
                  borderRadius: "16px",
                  padding: "28px",
                  boxShadow: "0 2px 8px rgba(29,78,216,0.06)",
                  borderLeft: "4px solid #1d4ed8",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  animationDelay: `${i * 0.07}s`,
                }}
              >
                <div style={{
                  width: "48px", height: "48px", borderRadius: "12px",
                  background: "linear-gradient(135deg, #dbeafe, #eff6ff)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "18px", color: "#1d4ed8",
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.65, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how" style={{ background: "#1e3a8a", padding: "96px 28px", position: "relative", overflow: "hidden" }}>
        {/* Subtle grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "24px 24px", pointerEvents: "none",
        }} />
        <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }} className="animate-slide-up">
            <div style={{
              display: "inline-block", background: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.85)", fontSize: "12px", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "5px 14px", borderRadius: "100px", marginBottom: "16px",
            }}>
              How It Works
            </div>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", margin: 0 }}>
              Up and running in minutes
            </h2>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            {[
              {
                num: "1",
                title: "Contact the Admin",
                desc: "Fill in the contact form with your business details. The admin reviews and approves your registration.",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                ),
              },
              {
                num: "2",
                title: "Receive Your Credentials",
                desc: "The admin creates your account and sends your login email and password directly to you.",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 7l-10 7L2 7" />
                  </svg>
                ),
              },
              {
                num: "3",
                title: "Start Invoicing",
                desc: "Log in and start creating FBR-compliant invoices immediately. No setup or configuration required.",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                ),
              },
            ].map((step, i) => (
              <div key={step.num} style={{
                flex: 1, background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "20px", padding: "36px 28px", textAlign: "center",
              }} className="animate-slide-up">
                <div style={{
                  width: "64px", height: "64px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #2563eb, #06b6d4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 20px",
                  boxShadow: "0 8px 24px rgba(29,78,216,0.4)",
                }}>
                  {step.icon}
                </div>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: "rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.6)", fontSize: "13px", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#ffffff", marginBottom: "10px" }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.65)", lineHeight: 1.7, margin: 0 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────────────── */}
      <section id="contact" style={{ padding: "96px 28px", background: "#ffffff" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }} className="animate-slide-up">
            <div style={{
              display: "inline-block", background: "#dbeafe",
              color: "#1d4ed8", fontSize: "12px", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "5px 14px", borderRadius: "100px", marginBottom: "16px",
            }}>
              Get Access
            </div>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", margin: "0 0 12px" }}>
              Ready to get started?
            </h2>
            <p style={{ fontSize: "16px", color: "#64748b" }}>
              Fill in your details and we will get back to you within 24 hours.
            </p>
          </div>

          <div style={{
            background: "#f8faff",
            border: "1px solid #dbeafe",
            borderRadius: "20px",
            padding: "40px",
            boxShadow: "0 8px 32px rgba(29,78,216,0.08)",
          }} className="animate-scale-in">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ background: "#0c1a3a", padding: "48px 28px 32px" }}>
        <div style={{
          maxWidth: "1200px", margin: "0 auto",
          display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: "24px",
          paddingBottom: "28px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "34px", height: "34px", borderRadius: "9px",
              background: "linear-gradient(135deg, #1d4ed8, #06b6d4)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="2" width="14" height="16" rx="2" stroke="white" strokeWidth="1.5" />
                <line x1="6" y1="7" x2="14" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="6" y1="10" x2="14" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="6" y1="13" x2="10" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: "18px", color: "#ffffff" }}>
                Tax<span style={{ color: "#60a5fa" }}>Digital</span>
              </span>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", margin: "2px 0 0" }}>
                Digital Tax Compliance · Pakistan
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "24px" }}>
            <a href="#features" style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Features</a>
            <a href="#how" style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>How It Works</a>
            <a href="#contact" style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Contact</a>
            <Link href="/login" style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>Sign In</Link>
          </div>
        </div>
        <div style={{
          maxWidth: "1200px", margin: "24px auto 0",
          textAlign: "center", fontSize: "13px", color: "rgba(255,255,255,0.3)",
        }}>
          © {new Date().getFullYear()} TaxDigital · All rights reserved · Built for Pakistan
        </div>
      </footer>

    </div>
  );
}
