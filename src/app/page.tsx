import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ContactForm } from "@/components/clientcomponents/ContactForm";
import { MobileNav } from "@/components/home/MobileNav";

/* ── Page-level metadata (overrides root layout defaults) ───── */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://easydigitalinvoice.com";

export const metadata: Metadata = {
  title: "Easy Digital Invoice — FBR-Compliant Invoicing for Pakistan",
  description:
    "Pakistan's leading FBR-integrated e-invoicing platform. Create, validate & submit FBR sale invoices with NTN, CNIC, STRN support. Real-time tax calculation, PDF export, and sandbox testing. Start free.",
  keywords: [
    "FBR invoicing Pakistan",
    "FBR e-invoice software",
    "Pakistan e-invoicing",
    "NTN invoicing",
    "STRN sales tax",
    "FBR compliance",
    "sale invoice Pakistan",
    "GST invoicing",
    "digital invoicing Pakistan",
    "FBR API",
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type:        "website",
    url:         SITE_URL,
    title:       "Easy Digital Invoice — FBR-Compliant Invoicing for Pakistan",
    description: "Generate, validate & submit FBR invoices with NTN, CNIC, STRN support. Sandbox + Production. Start free.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Easy Digital Invoice FBR Invoicing Platform" }],
  },
};

/* ── JSON-LD structured data ─────────────────────────────────── */
const JSONLD_ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Easy Digital Invoice",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description:
    "Pakistan's FBR-integrated e-invoicing platform for generating and submitting compliant sale invoices.",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+92-343-3161051",
    contactType: "customer service",
    availableLanguage: ["English", "Urdu"],
  },
  sameAs: [],
};

const JSONLD_SOFTWARE = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Easy Digital Invoice",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Invoicing Software",
  operatingSystem: "Web",
  url: SITE_URL,
  description:
    "FBR-integrated e-invoicing platform for Pakistani businesses. Supports NTN, CNIC, STRN validation and direct FBR API submission.",
  featureList: [
    "FBR API integration",
    "NTN, CNIC, STRN validation",
    "Sales tax calculation",
    "PDF export",
    "Sandbox testing environment",
    "Team & accountant access",
    "Real-time invoice submission",
  ],
  offers: [
    {
      "@type": "Offer",
      name: "Standard",
      price: "0",
      priceCurrency: "PKR",
      description: "Free plan — 3 invoices per month",
    },
    {
      "@type": "Offer",
      name: "Growth",
      price: "2500",
      priceCurrency: "PKR",
      description: "20 invoices per month with production FBR access",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "6000",
      priceCurrency: "PKR",
      description: "100 invoices per month with full feature access",
    },
    {
      "@type": "Offer",
      name: "Unlimited",
      price: "12500",
      priceCurrency: "PKR",
      description: "Unlimited invoices per month — full feature access, dedicated support",
    },
  ],
  provider: {
    "@type": "Organization",
    name: "Easy Digital Invoice",
    url: SITE_URL,
  },
};

const JSONLD_WEBSITE = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Easy Digital Invoice",
  url: SITE_URL,
  description: "FBR-Compliant Invoicing Platform for Pakistan",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/invoices?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

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
      <rect x="60" y="50" width="360" height="300" rx="20" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
      <rect x="60" y="50" width="360" height="68" rx="20" fill="rgba(255,255,255,0.11)" />
      <rect x="60" y="98" width="360" height="20" fill="rgba(255,255,255,0.11)" />
      <rect x="84" y="70" width="110" height="13" rx="4" fill="rgba(255,255,255,0.65)" />
      <rect x="84" y="88" width="72" height="8" rx="3" fill="rgba(255,255,255,0.28)" />
      <rect x="376" y="72" width="28" height="18" rx="9" fill="rgba(52,211,153,0.22)" stroke="rgba(52,211,153,0.5)" strokeWidth="1" />
      <circle cx="390" cy="81" r="4" fill="#34d399" className="animate-pulse-dot" />
      <line x1="84" y1="136" x2="396" y2="136" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      <rect x="84" y="146" width="110" height="8" rx="3" fill="rgba(255,255,255,0.22)" />
      <rect x="268" y="146" width="52" height="8" rx="3" fill="rgba(255,255,255,0.22)" />
      <rect x="344" y="146" width="52" height="8" rx="3" fill="rgba(255,255,255,0.22)" />
      {([170, 192, 214, 236] as number[]).map((y, i) => (
        <g key={i}>
          <rect x="84" y={y} width={90 + i * 14} height="9" rx="3" fill="rgba(255,255,255,0.14)" />
          <rect x="268" y={y} width="48" height="9" rx="3" fill="rgba(255,255,255,0.11)" />
          <rect x="344" y={y} width="52" height="9" rx="3" fill="rgba(255,255,255,0.18)" />
        </g>
      ))}
      <rect x="60" y="264" width="360" height="1" fill="rgba(255,255,255,0.08)" />
      <rect x="84" y="276" width="72" height="11" rx="3" fill="rgba(255,255,255,0.42)" />
      <rect x="312" y="274" width="84" height="14" rx="6" fill="rgba(96,165,250,0.45)" />
      <rect x="84" y="302" width="312" height="34" rx="11" fill="rgba(29,78,216,0.65)" stroke="rgba(96,165,250,0.35)" strokeWidth="1" />
      <rect x="188" y="314" width="104" height="10" rx="4" fill="rgba(255,255,255,0.75)" />
      <rect x="330" y="18" width="168" height="78" rx="14" fill="#0c1a3a" stroke="rgba(96,165,250,0.28)" strokeWidth="1.5" />
      <rect x="350" y="34" width="50" height="8" rx="3" fill="rgba(255,255,255,0.3)" />
      <rect x="350" y="48" width="88" height="17" rx="5" fill="rgba(52,211,153,0.35)" />
      <rect x="354" y="53" width="80" height="7" rx="3" fill="rgba(52,211,153,0.85)" />
      <rect x="350" y="72" width="104" height="7" rx="3" fill="rgba(255,255,255,0.18)" />
      <rect x="10" y="278" width="136" height="88" rx="14" fill="#0c1a3a" stroke="rgba(96,165,250,0.28)" strokeWidth="1.5" />
      <rect x="28" y="294" width="68" height="8" rx="3" fill="rgba(255,255,255,0.32)" />
      <rect x="28" y="308" width="92" height="20" rx="5" fill="rgba(96,165,250,0.28)" />
      <rect x="28" y="313" width="76" height="10" rx="4" fill="rgba(96,165,250,0.85)" />
      <rect x="28" y="336" width="52" height="7" rx="3" fill="rgba(255,255,255,0.2)" />
      <circle cx="464" cy="190" r="5" fill="rgba(96,165,250,0.35)" />
      <circle cx="464" cy="208" r="3.5" fill="rgba(96,165,250,0.2)" />
      <circle cx="464" cy="224" r="2.5" fill="rgba(96,165,250,0.12)" />
      <circle cx="36" cy="150" r="5" fill="rgba(52,211,153,0.35)" />
      <circle cx="36" cy="168" r="3.5" fill="rgba(52,211,153,0.2)" />
      <circle cx="36" cy="184" r="2.5" fill="rgba(52,211,153,0.12)" />
    </svg>
  );
}

/* ── Feature Icons ──────────────────────────────── */
function IconInvoice() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <path d="M9 13l2 2 4-4"/>
    </svg>
  );
}
function IconCalculator() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <line x1="8" y1="6" x2="16" y2="6"/>
      <line x1="8" y1="10" x2="10" y2="10"/>
      <line x1="14" y1="10" x2="16" y2="10"/>
      <line x1="8" y1="14" x2="10" y2="14"/>
      <line x1="14" y1="14" x2="16" y2="14"/>
      <line x1="8" y1="18" x2="16" y2="18"/>
    </svg>
  );
}
function IconPrinter() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  );
}
function IconFlask() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6M9 3v8L4.5 18.5A2 2 0 0 0 6.4 21h11.2a2 2 0 0 0 1.9-2.5L15 11V3"/>
      <line x1="6" y1="15" x2="18" y2="15"/>
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function IconLayers() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  );
}

/* ── App Preview Mock Charts ─────────────────────── */
function PreviewBarChart() {
  const bars = [30, 55, 42, 78, 65, 90, 72, 85];
  return (
    <svg viewBox="0 0 176 76" style={{ width: "100%", height: "76px" }}>
      {bars.map((h, i) => (
        <rect key={i} x={4 + i * 22} y={70 - h * 0.76} width={16} height={h * 0.76} rx="2"
          fill={`rgba(29,78,216,${0.35 + h / 250})`} />
      ))}
      <line x1="0" y1="70" x2="176" y2="70" stroke="#e2e8f0" strokeWidth="1"/>
    </svg>
  );
}
function PreviewLineChart() {
  const pts: [number, number][] = [[0,62],[20,47],[40,54],[60,32],[80,40],[100,22],[120,30],[140,16],[160,19]];
  const ptStr = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const areaStr = `0,70 ${ptStr} 160,70`;
  return (
    <svg viewBox="0 0 160 72" style={{ width: "100%", height: "76px" }}>
      <defs>
        <linearGradient id="plg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28"/>
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={areaStr} fill="url(#plg)"/>
      <polyline points={ptStr} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round"/>
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill="#6366f1"/>)}
      <line x1="0" y1="70" x2="160" y2="70" stroke="#e2e8f0" strokeWidth="1"/>
    </svg>
  );
}

/* ── Logo SVG ── */
function LogoIcon({ size = 38 }: { size?: number }) {
  return (
    <div style={{
      width: `${size}px`, height: `${size}px`, borderRadius: `${size * 0.26}px`,
      background: "linear-gradient(135deg, #1d4ed8, #06b6d4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 4px 12px rgba(29,78,216,0.35)", flexShrink: 0,
    }}>
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 20 20" fill="none">
        <rect x="3" y="2" width="14" height="16" rx="2" stroke="white" strokeWidth="1.5" />
        <line x1="6" y1="7" x2="14" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="6" y1="10" x2="14" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="6" y1="13" x2="10" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/dashboard");

  const features = [
    {
      icon: <IconInvoice />,
      title: "FBR Compliant Invoicing",
      desc: "Submit invoices directly to FBR API with real-time validation, instant error feedback, and full audit trail.",
    },
    {
      icon: <IconCalculator />,
      title: "GST & Income Tax Auto-Calculation",
      desc: "Automatic GST (17%), extra tax, further tax, and income tax calculation with FBR-approved rates — zero manual math.",
    },
    {
      icon: <IconPrinter />,
      title: "PDF Export & Print",
      desc: "Generate professional, FBR-compliant invoice PDFs with your logo, QR code, NTN/STRN, and all required fields.",
    },
    {
      icon: <IconFlask />,
      title: "Sandbox Testing Environment",
      desc: "Test your entire invoice workflow against the FBR sandbox before going live. Zero risk, full confidence.",
    },
    {
      icon: <IconUsers />,
      title: "Team & Accountant Access",
      desc: "Add operators and invite accountants with view-only access. Full role-based permissions built in.",
    },
    {
      icon: <IconLayers />,
      title: "Bulk Excel Upload",
      desc: "Upload hundreds of invoices via spreadsheet. Easy Digital Invoice validates each row and submits to FBR in one click.",
    },
    {
      icon: <IconInvoice />,
      title: "NTN / CNIC / STRN Validation",
      desc: "Every buyer identifier is validated against FBR formats before submission — no rejections from bad data.",
    },
    {
      icon: <IconCalculator />,
      title: "Real-Time FBR Status Tracking",
      desc: "See submitted, pending, and rejected invoices at a glance. Get instant FBR invoice numbers on success.",
    },
    {
      icon: <IconLayers />,
      title: "Client & Product Registry",
      desc: "Store your buyers and products with HS codes for lightning-fast invoice creation — one click to populate.",
    },
    {
      icon: <IconFlask />,
      title: "Revenue & Tax Analytics",
      desc: "Visual dashboards for monthly revenue, total sales tax collected, and invoice trends — all in real time.",
    },
    {
      icon: <IconPrinter />,
      title: "QR Code on Every Invoice",
      desc: "Every printed invoice includes a QR code linking to the FBR verification portal — fully compliant.",
    },
    {
      icon: <IconUsers />,
      title: "Google Sign-In Support",
      desc: "One-click Google login for your team — no separate passwords to manage. Secure and fast.",
    },
  ];

  const plans = [
    {
      slug: "standard",
      name: "Standard",
      price: "Free",
      invoices: "3 invoices/month",
      color: "#16a34a",
      badge: null,
      features: ["FBR sandbox submission", "PDF export & print", "Client management", "Basic dashboard", "Email support"],
      cta: "Get Started Free",
      ctaHref: "/register",
      ctaBg: "#16a34a",
    },
    {
      slug: "growth",
      name: "Growth",
      price: "Rs 2,500/mo",
      invoices: "20 invoices/month",
      color: "#2563eb",
      badge: "Most Popular",
      features: ["FBR production submission", "PDF export & print", "Client & product registry", "Team members (3 seats)", "Priority support"],
      cta: "Start Growth Plan",
      ctaHref: "#contact",
      ctaBg: "#2563eb",
    },
    {
      slug: "pro",
      name: "Pro",
      price: "Rs 6,000/mo",
      invoices: "100 invoices/month",
      color: "#7c3aed",
      badge: null,
      features: ["Everything in Growth", "Accountant access", "Advanced analytics", "Bulk Excel upload", "Dedicated support"],
      cta: "Start Pro Plan",
      ctaHref: "#contact",
      ctaBg: "#7c3aed",
    },
    {
      slug: "unlimited",
      name: "Unlimited",
      price: "Rs 12,500/mo",
      invoices: "Unlimited invoices",
      color: "#b45309",
      badge: "Best Value",
      features: ["Everything in Pro", "Unlimited invoices", "Unlimited team seats", "Custom onboarding", "24/7 dedicated support"],
      cta: "Go Unlimited",
      ctaHref: "#contact",
      ctaBg: "linear-gradient(135deg, #b45309, #d97706)",
    },
  ];

  return (
    <>
      {/* ── JSON-LD Structured Data ──────────────────────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD_ORGANIZATION) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD_SOFTWARE) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD_WEBSITE) }}
      />

    <div style={{ background: "#f0f5ff", minHeight: "100vh", fontFamily: "var(--font-sans)" }}>

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <LogoIcon />
            <span style={{ fontWeight: 800, fontSize: "20px", color: "#0f172a", letterSpacing: "-0.01em" }}>
              Easy<span style={{ color: "#1d4ed8" }}>Digital Invoice</span>
            </span>
          </div>
          <div className="hidden md:flex" style={{ alignItems: "center", gap: "4px" }}>
            <a href="#features" style={{ fontSize: "14px", color: "#64748b", textDecoration: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: 500 }}>Features</a>
            <a href="#how" style={{ fontSize: "14px", color: "#64748b", textDecoration: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: 500 }}>How It Works</a>
            <a href="#pricing" style={{ fontSize: "14px", color: "#64748b", textDecoration: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: 500 }}>Pricing</a>
            <a href="#contact" style={{ fontSize: "14px", color: "#64748b", textDecoration: "none", padding: "8px 14px", borderRadius: "8px", fontWeight: 500 }}>Contact</a>
            <Link href="/login" style={{ marginLeft: "4px", fontSize: "14px", fontWeight: 600, color: "#1d4ed8", padding: "9px 18px", borderRadius: "9px", textDecoration: "none", border: "1.5px solid #bfdbfe" }}>
              Login
            </Link>
            <Link href="/register" style={{
              marginLeft: "4px", fontSize: "14px", fontWeight: 700, color: "white",
              background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
              padding: "9px 22px", borderRadius: "9px", textDecoration: "none",
              boxShadow: "0 3px 10px rgba(29,78,216,0.35)",
            }}>
              Get Started Free
            </Link>
          </div>
          <div className="flex md:hidden" style={{ alignItems: "center", gap: "8px" }}>
            <Link href="/register" style={{
              fontSize: "12px", fontWeight: 700, color: "white",
              background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
              padding: "7px 14px", borderRadius: "8px", textDecoration: "none",
              boxShadow: "0 2px 8px rgba(29,78,216,0.35)",
              whiteSpace: "nowrap",
            }}>Get Started</Link>
            <MobileNav />
          </div>
        </div>
      </nav>

      {/* ── FBR FINE WARNING BANNER ──────────────────────────── */}
      <section style={{ background: "#fff7ed", borderTop: "3px solid #f97316", borderBottom: "3px solid #f97316", padding: "0 20px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            {/* Warning icon */}
            <div style={{
              flexShrink: 0,
              width: "44px", height: "44px", borderRadius: "50%",
              background: "linear-gradient(135deg, #dc2626, #f97316)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 3px 10px rgba(220,38,38,0.3)",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: "220px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                <span style={{
                  background: "#dc2626", color: "#fff",
                  fontSize: "10px", fontWeight: 800, letterSpacing: "0.1em",
                  padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase",
                }}>FBR Mandate</span>
                <span style={{
                  background: "#f97316", color: "#fff",
                  fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em",
                  padding: "2px 8px", borderRadius: "4px",
                }}>Effective Now</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "clamp(14px, 2.5vw, 20px)", fontWeight: 900, color: "#7c2d12", margin: 0, letterSpacing: "-0.01em" }}>
                  ⚠️ FBR Fine: <span style={{ color: "#dc2626" }}>PKR 5,00,000</span> for Non-Compliant Invoicing
                </h2>
                <Link href="/register" style={{
                  background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                  color: "#fff", padding: "7px 16px", borderRadius: "7px",
                  fontSize: "12px", fontWeight: 700, textDecoration: "none",
                  display: "inline-flex", alignItems: "center", gap: "4px",
                  boxShadow: "0 3px 10px rgba(220,38,38,0.3)", flexShrink: 0,
                  whiteSpace: "nowrap",
                }}>
                  Get Compliant Free →
                </Link>
              </div>
            </div>
            {/* Fine amount callout */}
            <div className="hidden sm:block" style={{
              flexShrink: 0,
              background: "linear-gradient(135deg, #dc2626, #b91c1c)",
              borderRadius: "12px", padding: "10px 20px", textAlign: "center",
              boxShadow: "0 4px 16px rgba(220,38,38,0.25)",
            }}>
              <div style={{ fontSize: "9px", fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "2px" }}>Max Fine</div>
              <div style={{ fontSize: "22px", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>
                PKR 5,00,000
              </div>
              <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.65)", marginTop: "2px" }}>per violation</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-24" style={{
        background: "linear-gradient(135deg, #0c1a3a 0%, #1e3a8a 45%, #1d4ed8 100%)",
        paddingLeft: "20px", paddingRight: "20px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px", pointerEvents: "none",
        }} />
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
          <div className="animate-slide-up">
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

            <h1 style={{
              fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 900,
              lineHeight: 1.1, letterSpacing: "-0.03em",
              color: "#ffffff", marginBottom: "20px",
            }}>
              Smart Invoicing<br />
              <span style={{
                background: "linear-gradient(135deg, #60a5fa 0%, #34d399 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                for Pakistani
              </span>
              <br />Businesses
            </h1>

            <p style={{
              fontSize: "17px", color: "rgba(255,255,255,0.72)",
              lineHeight: 1.7, maxWidth: "460px", marginBottom: "40px",
            }}>
              Save time, track payments, and stay FBR compliant — all from one elegant dashboard built for Pakistani businesses.
            </p>

            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <Link href="/register" style={{
                background: "#ffffff", color: "#1d4ed8",
                padding: "13px 30px", borderRadius: "10px",
                fontSize: "15px", fontWeight: 700, textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: "8px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
              }}>
                Start Free →
              </Link>
              <a href="#pricing" style={{
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.9)",
                padding: "13px 30px", borderRadius: "10px",
                fontSize: "15px", fontWeight: 500,
                border: "1px solid rgba(255,255,255,0.18)",
                cursor: "pointer", textDecoration: "none",
              }}>
                See Pricing
              </a>
            </div>

            <div style={{ marginTop: "56px", display: "flex", gap: "44px", flexWrap: "wrap" }}>
              {[
                { n: "500+", l: "Active Businesses" },
                { n: "99.9%", l: "FBR Success Rate" },
                { n: "< 2s", l: "Submission Time" },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em" }}>{s.n}</div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", marginTop: "3px" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

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

      {/* ── APP PREVIEW ──────────────────────────────────────── */}
      <section style={{ background: "#f0f5ff", padding: "80px 28px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }} className="animate-slide-up">
            <div style={{
              display: "inline-block", background: "#dbeafe",
              color: "#1d4ed8", fontSize: "12px", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "5px 14px", borderRadius: "100px", marginBottom: "16px",
            }}>
              Live Preview
            </div>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", margin: "0 0 12px" }}>
              Your dashboard, at a glance
            </h2>
            <p style={{ fontSize: "16px", color: "#64748b", margin: 0 }}>
              Everything you need to manage FBR invoicing — in one clean, powerful interface.
            </p>
          </div>

          {/* Browser window mockup */}
          <div style={{
            borderRadius: "16px", overflow: "hidden",
            border: "1.5px solid #e2e8f0",
            boxShadow: "0 32px 80px rgba(29,78,216,0.16), 0 8px 24px rgba(0,0,0,0.08)",
          }} className="animate-scale-in">
            {/* Browser chrome */}
            <div style={{ background: "#1e293b", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                {(["#ef4444","#f59e0b","#22c55e"] as string[]).map(c => (
                  <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />
                ))}
              </div>
              <div style={{ flex: 1, background: "#334155", borderRadius: "6px", padding: "4px 10px", display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>app.easydigitalinvoice.com/dashboard</span>
              </div>
            </div>

            {/* Scrollable wrapper for mobile */}
            <div style={{ overflowX: "auto" }}>
            {/* Dashboard layout */}
            <div style={{ display: "flex", background: "#f8fafc", minWidth: "680px" }}>
              {/* Sidebar */}
              <div style={{ width: "180px", background: "#0f172a", flexShrink: 0 }}>
                <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "26px", height: "26px", borderRadius: "7px", background: "linear-gradient(135deg,#1d4ed8,#06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                        <rect x="3" y="2" width="14" height="16" rx="2" stroke="white" strokeWidth="1.5"/>
                        <line x1="6" y1="7" x2="14" y2="7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                        <line x1="6" y1="10" x2="14" y2="10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                        <line x1="6" y1="13" x2="10" y2="13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: "13px", color: "#fff" }}>Easy<span style={{ color: "#60a5fa" }}>Digital Invoice</span></span>
                  </div>
                </div>
                {([
                  { label: "Dashboard",  active: true,  d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" },
                  { label: "Invoices",   active: false, d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8" },
                  { label: "Clients",   active: false, d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" },
                  { label: "FBR Submit", active: false, d: "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" },
                  { label: "Settings",  active: false, d: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M4.93 19.07l1.41-1.41 M17.66 6.34l1.41-1.41" },
                ] as { label: string; active: boolean; d: string }[]).map(item => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", margin: "2px 8px", borderRadius: "8px", background: item.active ? "rgba(96,165,250,0.15)" : "transparent" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={item.active ? "#60a5fa" : "rgba(255,255,255,0.38)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={item.d}/>
                    </svg>
                    <span style={{ fontSize: "12px", fontWeight: item.active ? 600 : 400, color: item.active ? "#60a5fa" : "rgba(255,255,255,0.45)" }}>{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div style={{ flex: 1, padding: "20px 24px", minWidth: 0, overflow: "hidden" }}>
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>Dashboard</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Welcome back, Ahmed · April 2026</div>
                </div>

                {/* Metric cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px", marginBottom: "14px" }}>
                  {([
                    { label: "Total Invoices", value: "24",       color: "#6366f1" },
                    { label: "Total Revenue",  value: "PKR 2.4M", color: "#06b6d4" },
                    { label: "Sales Tax",      value: "PKR 384K", color: "#f59e0b" },
                    { label: "Net Revenue",    value: "PKR 2.0M", color: "#10b981" },
                  ] as { label: string; value: string; color: string }[]).map(card => (
                    <div key={card.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px", borderTop: `3px solid ${card.color}` }}>
                      <div style={{ fontSize: "9px", color: "#94a3b8", fontWeight: 600, marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{card.label}</div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>{card.value}</div>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "10px" }}>
                  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>Revenue Trend</div>
                    <PreviewBarChart />
                  </div>
                  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>Invoice Count</div>
                    <PreviewLineChart />
                  </div>
                </div>
              </div>
            </div>
            </div>{/* end scrollable wrapper */}
          </div>
        </div>
      </section>

      {/* ── INVOICE FORM PREVIEW ─────────────────────────────── */}
      <section style={{ background: "#ffffff", padding: "80px 28px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }} className="animate-slide-up">
            <div style={{
              display: "inline-block", background: "#dbeafe",
              color: "#1d4ed8", fontSize: "12px", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "5px 14px", borderRadius: "100px", marginBottom: "16px",
            }}>
              Invoice Builder
            </div>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", margin: "0 0 12px" }}>
              Create FBR-compliant invoices in seconds
            </h2>
            <p style={{ fontSize: "16px", color: "#64748b", margin: 0 }}>
              Every field validated, every tax calculated automatically — just fill and submit.
            </p>
          </div>

          {/* Invoice form mockup */}
          <div style={{
            borderRadius: "16px", overflow: "hidden",
            border: "1.5px solid #e2e8f0",
            boxShadow: "0 32px 80px rgba(29,78,216,0.10), 0 8px 24px rgba(0,0,0,0.06)",
          }} className="animate-scale-in">
            {/* Browser chrome */}
            <div style={{ background: "#1e293b", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                {(["#ef4444","#f59e0b","#22c55e"] as string[]).map(c => (
                  <div key={c} style={{ width: "12px", height: "12px", borderRadius: "50%", background: c }} />
                ))}
              </div>
              <div style={{ flex: 1, background: "#334155", borderRadius: "6px", padding: "5px 12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span style={{ fontSize: "12px", color: "#94a3b8", fontFamily: "monospace" }}>app.easydigitalinvoice.com/invoices/new</span>
              </div>
            </div>

            {/* Invoice form content */}
            <div style={{ background: "#f8fafc", padding: "24px 28px" }}>
              {/* Form header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>New Invoice</div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>FBR-compliant · Auto tax calculation</div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ padding: "6px 14px", borderRadius: "7px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "12px", color: "#64748b", fontWeight: 500 }}>Save Draft</div>
                  <div style={{ padding: "6px 14px", borderRadius: "7px", background: "linear-gradient(135deg,#1d4ed8,#2563eb)", fontSize: "12px", color: "#fff", fontWeight: 700 }}>Submit to FBR</div>
                </div>
              </div>

              {/* Two column: client + invoice details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                {/* Client section */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>Client</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[["Buyer Name *", "Pak Traders Ltd"], ["NTN", "1234567-8"], ["Address", "Block 7, Clifton, Karachi"]].map(([label, val]) => (
                      <div key={label}>
                        <div style={{ fontSize: "9px", color: "#94a3b8", marginBottom: "3px", fontWeight: 600 }}>{label}</div>
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "5px", padding: "5px 8px", fontSize: "11px", color: "#334155" }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invoice details */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>Invoice Details</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {[["Invoice Date *", "06 Apr 2026"], ["Invoice Type", "Sales Invoice"], ["Currency", "PKR"]].map(([label, val]) => (
                      <div key={label}>
                        <div style={{ fontSize: "9px", color: "#94a3b8", marginBottom: "3px", fontWeight: 600 }}>{label}</div>
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "5px", padding: "5px 8px", fontSize: "11px", color: "#334155" }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Line item */}
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden", marginBottom: "12px" }}>
                {/* Item header */}
                <div style={{ background: "#f1f5f9", padding: "8px 14px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Item #1</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#fee2e2", borderRadius: "4px", padding: "2px 8px" }}>
                    <span style={{ fontSize: "9px", color: "#dc2626", fontWeight: 600 }}>✕ Remove</span>
                  </div>
                </div>
                <div style={{ padding: "12px 14px" }}>
                  {/* Product Info section */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "9px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>Product Info</span>
                    <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }}/>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "8px", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontSize: "9px", color: "#94a3b8", marginBottom: "3px" }}>HS Code *</div>
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "5px", padding: "5px 8px", fontSize: "11px", color: "#334155", background: "#f8fafc" }}>6203.42.0000</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "9px", color: "#94a3b8", marginBottom: "3px" }}>Description *</div>
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "5px", padding: "5px 8px", fontSize: "11px", color: "#334155", background: "#f8fafc" }}>Men&apos;s Cotton Trousers — Import Grade A</div>
                    </div>
                  </div>
                  {/* Quantity section */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "9px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>Quantity &amp; Pricing</span>
                    <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }}/>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", marginBottom: "12px" }}>
                    {[["Qty", "50"], ["UOM", "Nos"], ["Value (excl. tax)", "PKR 125,000"], ["Discount", "0"]].map(([l, v]) => (
                      <div key={l}>
                        <div style={{ fontSize: "9px", color: "#94a3b8", marginBottom: "3px" }}>{l}</div>
                        <div style={{ border: "1px solid #e2e8f0", borderRadius: "5px", padding: "5px 8px", fontSize: "11px", color: "#334155", background: "#f8fafc" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {/* Tax section */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "9px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>Tax Details</span>
                    <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }}/>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: "8px" }}>
                    <div>
                      <div style={{ fontSize: "9px", color: "#94a3b8", marginBottom: "3px" }}>Tax Rate</div>
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "5px", padding: "5px 8px", fontSize: "11px", color: "#334155", background: "#f8fafc" }}>17%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "9px", color: "#94a3b8", marginBottom: "3px" }}>Sales Tax (Auto)</div>
                      <div style={{ border: "1px solid #1d4ed8", borderRadius: "5px", padding: "5px 8px", fontSize: "11px", color: "#1d4ed8", background: "#eff6ff", fontFamily: "monospace", fontWeight: 700 }}>PKR 21,250</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "9px", color: "#94a3b8", marginBottom: "3px" }}>Sale Type</div>
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "5px", padding: "5px 8px", fontSize: "11px", color: "#334155", background: "#f8fafc" }}>Local Supply</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add item + totals row */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#1d4ed8", fontWeight: 600, cursor: "pointer" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                  Add Line Item
                </div>
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 18px", minWidth: "220px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Subtotal</span>
                    <span style={{ fontSize: "11px", color: "#334155", fontWeight: 600 }}>PKR 125,000</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Sales Tax (17%)</span>
                    <span style={{ fontSize: "11px", color: "#334155", fontWeight: 600 }}>PKR 21,250</span>
                  </div>
                  <div style={{ height: "1px", background: "#e2e8f0", margin: "8px 0" }}/>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12px", color: "#0f172a", fontWeight: 700 }}>Total</span>
                    <span style={{ fontSize: "13px", color: "#1d4ed8", fontWeight: 800 }}>PKR 146,250</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SPREADSHEET PREVIEW ──────────────────────────────── */}
      <section style={{ background: "#f0f5ff", padding: "80px 28px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }} className="animate-slide-up">
            <div style={{
              display: "inline-block", background: "#dcfce7",
              color: "#16a34a", fontSize: "12px", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "5px 14px", borderRadius: "100px", marginBottom: "16px",
            }}>
              Bulk Upload
            </div>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", margin: "0 0 12px" }}>
              Upload hundreds of invoices at once
            </h2>
            <p style={{ fontSize: "16px", color: "#64748b", margin: 0 }}>
              Paste or import your data from Excel — Easy Digital Invoice validates and submits each row to FBR instantly.
            </p>
          </div>

          {/* Spreadsheet mockup */}
          <div style={{
            borderRadius: "16px", overflow: "hidden",
            border: "1.5px solid #e2e8f0",
            boxShadow: "0 32px 80px rgba(22,163,74,0.10), 0 8px 24px rgba(0,0,0,0.06)",
          }} className="animate-scale-in">
            {/* Browser chrome */}
            <div style={{ background: "#1e293b", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                {(["#ef4444","#f59e0b","#22c55e"] as string[]).map(c => (
                  <div key={c} style={{ width: "12px", height: "12px", borderRadius: "50%", background: c }} />
                ))}
              </div>
              <div style={{ flex: 1, background: "#334155", borderRadius: "6px", padding: "5px 12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span style={{ fontSize: "12px", color: "#94a3b8", fontFamily: "monospace" }}>app.easydigitalinvoice.com/spreadsheet</span>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <div style={{ padding: "4px 12px", borderRadius: "5px", background: "#16a34a", fontSize: "11px", color: "#fff", fontWeight: 700 }}>Submit All to FBR</div>
              </div>
            </div>

            {/* Spreadsheet content */}
            <div style={{ background: "#fff", overflow: "auto" }}>
              {/* Toolbar */}
              <div style={{ padding: "10px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "11px", color: "#334155", fontWeight: 500 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Import Excel
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "6px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "11px", color: "#334155", fontWeight: 500 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add Row
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>5 rows · 3 ready · 1 error · 1 submitted</div>
                </div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <div style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>✓ 1 submitted to FBR</div>
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", minWidth: "800px" }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9" }}>
                      {["#","Buyer Name","NTN","HS Code","Description","Qty","Value (PKR)","Tax Rate","Sales Tax","Status"].map(h => (
                        <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#475569", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap", fontSize: "10px", letterSpacing: "0.04em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { num: 1, buyer: "Pak Traders Ltd", ntn: "1234567-8", hs: "6203.42", desc: "Men's Trousers", qty: "50 Nos", val: "125,000", rate: "17%", tax: "21,250", status: "ready", statusColor: "#2563eb", statusBg: "#eff6ff" },
                      { num: 2, buyer: "Alpha Imports", ntn: "9876543-2", hs: "8471.30", desc: "Laptop Computers", qty: "10 Nos", val: "980,000", rate: "17%", tax: "166,600", status: "submitted", statusColor: "#16a34a", statusBg: "#dcfce7" },
                      { num: 3, buyer: "Beta Supply Co.", ntn: "5555111-0", hs: "3004.90", desc: "Pharmaceutical Goods", qty: "200 Nos", val: "75,000", rate: "0%", tax: "0", status: "error", statusColor: "#dc2626", statusBg: "#fee2e2" },
                      { num: 4, buyer: "Gamma Retail", ntn: "3333999-4", hs: "9403.20", desc: "Office Furniture", qty: "5 Nos", val: "320,000", rate: "17%", tax: "54,400", status: "ready", statusColor: "#2563eb", statusBg: "#eff6ff" },
                      { num: 5, buyer: "Delta Exports", ntn: "7777222-6", hs: "5208.21", desc: "Cotton Fabric", qty: "500 Mtr", val: "250,000", rate: "5%", tax: "12,500", status: "ready", statusColor: "#2563eb", statusBg: "#eff6ff" },
                    ].map((row, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: row.status === "error" ? "#fff5f5" : i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "8px 10px", color: "#94a3b8", fontWeight: 600 }}>{row.num}</td>
                        <td style={{ padding: "8px 10px", color: "#0f172a", fontWeight: 600 }}>{row.buyer}</td>
                        <td style={{ padding: "8px 10px", color: "#475569", fontFamily: "monospace" }}>{row.ntn}</td>
                        <td style={{ padding: "8px 10px", color: "#475569", fontFamily: "monospace" }}>{row.hs}</td>
                        <td style={{ padding: "8px 10px", color: "#334155" }}>{row.desc}</td>
                        <td style={{ padding: "8px 10px", color: "#475569" }}>{row.qty}</td>
                        <td style={{ padding: "8px 10px", color: "#0f172a", fontWeight: 600 }}>PKR {row.val}</td>
                        <td style={{ padding: "8px 10px", color: "#475569" }}>{row.rate}</td>
                        <td style={{ padding: "8px 10px", color: "#1d4ed8", fontWeight: 600, fontFamily: "monospace" }}>PKR {row.tax}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <span style={{ fontSize: "10px", fontWeight: 700, color: row.statusColor, background: row.statusBg, padding: "2px 8px", borderRadius: "20px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            {row.status === "error" ? "⚠ NTN Invalid" : row.status === "submitted" ? "✓ FBR Sent" : "● Ready"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how" style={{ background: "#1e3a8a", padding: "96px 28px", position: "relative", overflow: "hidden" }}>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: "1", title: "Set Up Your Profile", desc: "Configure your company profile, FBR credentials, and invoice preferences in the Settings page." },
              { num: "2", title: "Add Clients & Products", desc: "Build your client registry with NTN verification. Add products with HS codes for quick invoice creation." },
              { num: "3", title: "Create Your Invoice", desc: "Select a client, add line items, and the system auto-calculates GST, further tax, and totals." },
              { num: "4", title: "Submit & Track", desc: "Submit to FBR instantly and get your FBR invoice number. Track paid/unpaid status from your dashboard." },
            ].map((step) => (
              <div key={step.num} style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "20px", padding: "28px 24px", textAlign: "center",
              }} className="animate-slide-up">
                <div style={{
                  width: "52px", height: "52px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #2563eb, #06b6d4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                  fontSize: "22px", fontWeight: 900, color: "#fff",
                  boxShadow: "0 6px 18px rgba(29,78,216,0.4)",
                }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", marginBottom: "8px" }}>{step.title}</h3>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              A complete FBR invoicing solution from creation to analytics
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  animationDelay: `${i * 0.07}s`,
                }}
              >
                <div style={{ marginBottom: "14px", lineHeight: 0 }}>{f.icon}</div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", marginBottom: "8px" }}>{f.title}</h3>
                <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: "96px 28px", background: "#ffffff" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "60px" }} className="animate-slide-up">
            <div style={{
              display: "inline-block", background: "#dbeafe",
              color: "#1d4ed8", fontSize: "12px", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "5px 14px", borderRadius: "100px", marginBottom: "16px",
            }}>
              Pricing
            </div>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", margin: "0 0 12px" }}>
              Simple, transparent pricing
            </h2>
            <p style={{ fontSize: "16px", color: "#64748b", margin: "0 0 16px" }}>
              Start free. Upgrade when your business grows. All plans include FBR compliance.
            </p>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "#fef9c3", border: "1px solid #fbbf24",
              borderRadius: "10px", padding: "10px 18px",
              fontSize: "14px", color: "#92400e", fontWeight: 600,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Avoid the PKR 500,000 FBR fine — any plan makes you compliant
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
            {plans.map(plan => (
              <div
                key={plan.slug}
                style={{
                  border: `2px solid ${plan.badge ? plan.color : "#e2e8f0"}`,
                  borderRadius: "16px",
                  padding: "28px",
                  background: plan.slug === "unlimited"
                    ? "linear-gradient(160deg, #fffbeb 0%, #fef3c7 100%)"
                    : plan.badge ? "#eff6ff" : "#fff",
                  position: "relative",
                  boxShadow: plan.badge ? "0 8px 32px rgba(37,99,235,0.12)" : plan.slug === "unlimited" ? "0 8px 32px rgba(180,83,9,0.14)" : "none",
                }}
              >
                {plan.badge && (
                  <div style={{
                    position: "absolute", top: "-13px", left: "50%", transform: "translateX(-50%)",
                    background: plan.slug === "unlimited" ? "linear-gradient(135deg,#b45309,#d97706)" : plan.color,
                    color: "#fff",
                    fontSize: "11px", fontWeight: 700, padding: "3px 14px",
                    borderRadius: "20px", whiteSpace: "nowrap",
                    letterSpacing: "0.05em",
                  }}>
                    {plan.badge}
                  </div>
                )}
                {plan.slug === "unlimited" && (
                  <div style={{ marginBottom: "10px" }}>
                    <span style={{
                      fontSize: "18px", display: "block", textAlign: "center",
                    }}>♾️</span>
                  </div>
                )}
                <div style={{ fontWeight: 800, fontSize: "20px", color: "#0f172a", marginBottom: "6px" }}>{plan.name}</div>
                <div style={{
                  fontWeight: 800, fontSize: "26px", marginBottom: "4px",
                  background: plan.slug === "unlimited" ? "linear-gradient(135deg,#b45309,#d97706)" : "none",
                  WebkitBackgroundClip: plan.slug === "unlimited" ? "text" : "unset",
                  WebkitTextFillColor: plan.slug === "unlimited" ? "transparent" : plan.color,
                  color: plan.slug === "unlimited" ? undefined : plan.color,
                }}>
                  {plan.price}
                </div>
                <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px", fontWeight: 600 }}>{plan.invoices}</div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", fontSize: "14px", color: "#374151" }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ marginBottom: "8px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <span style={{ color: plan.slug === "unlimited" ? "#b45309" : plan.color, fontWeight: 700, fontSize: "16px", lineHeight: 1.3 }}>✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.ctaHref}
                  style={{
                    display: "block", textAlign: "center",
                    background: plan.ctaBg, color: "#fff",
                    borderRadius: "9px", padding: "11px",
                    fontSize: "14px", fontWeight: 700, textDecoration: "none",
                    boxShadow: plan.slug === "unlimited" ? "0 4px 14px rgba(180,83,9,0.35)" : "none",
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────────────── */}
      <section id="contact" style={{ padding: "96px 28px", background: "#f0f5ff" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }} className="animate-slide-up">
            <div style={{
              display: "inline-block", background: "#dbeafe",
              color: "#1d4ed8", fontSize: "12px", fontWeight: 700,
              letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "5px 14px", borderRadius: "100px", marginBottom: "16px",
            }}>
              Get In Touch
            </div>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", margin: "0 0 12px" }}>
              Ready to get started?
            </h2>
            <p style={{ fontSize: "16px", color: "#64748b" }}>
              Contact us to activate your plan or ask any questions.
            </p>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "16px", flexWrap: "wrap" }}>
              <a href="tel:03433161051" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#1d4ed8", fontWeight: 600, textDecoration: "none" }}>
                📞 03433161051
              </a>
              <a href="mailto:taxdigitalsupport@gmail.com" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: "#1d4ed8", fontWeight: 600, textDecoration: "none" }}>
                ✉️ taxdigitalsupport@gmail.com
              </a>
            </div>
          </div>

          <div style={{
            background: "#ffffff",
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
          alignItems: "flex-start", flexWrap: "wrap", gap: "32px",
          paddingBottom: "28px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <LogoIcon size={32} />
              <span style={{ fontWeight: 800, fontSize: "18px", color: "#ffffff" }}>
                Easy<span style={{ color: "#60a5fa" }}>Digital Invoice</span>
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: "0 0 12px" }}>
              Smart Invoicing for Pakistani Businesses
            </p>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>
              <div>📞 <a href="tel:03433161051" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>03433161051</a></div>
              <div>✉️ <a href="mailto:taxdigitalsupport@gmail.com" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>taxdigitalsupport@gmail.com</a></div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Navigation</div>
              {["#features:Features", "#how:How It Works", "#pricing:Pricing", "#contact:Contact"].map(item => {
                const [href, label] = item.split(":");
                return (
                  <a key={href} href={href} style={{ display: "block", fontSize: "13px", color: "rgba(255,255,255,0.5)", textDecoration: "none", marginBottom: "8px" }}>
                    {label}
                  </a>
                );
              })}
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Account</div>
              <Link href="/login" style={{ display: "block", fontSize: "13px", color: "rgba(255,255,255,0.5)", textDecoration: "none", marginBottom: "8px" }}>Login</Link>
              <Link href="/register" style={{ display: "block", fontSize: "13px", color: "rgba(255,255,255,0.5)", textDecoration: "none", marginBottom: "8px" }}>Create Account</Link>
            </div>
          </div>
        </div>
        <div style={{
          maxWidth: "1200px", margin: "24px auto 0",
          textAlign: "center", fontSize: "13px", color: "rgba(255,255,255,0.3)",
        }}>
          © 2026 My Digital Invoice. All rights reserved.
        </div>
      </footer>

    </div>
    </>
  );
}
//  \