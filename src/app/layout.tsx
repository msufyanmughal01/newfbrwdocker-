import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

/* ─────────────────────────────────────────────────────────────── */
/*  Site constants                                                 */
/* ─────────────────────────────────────────────────────────────── */

const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://easydigitalinvoice.com';
const SITE_NAME = 'Easy Digital Invoice';
const TAGLINE   = 'FBR-Compliant Invoicing for Pakistan';
const DESCRIPTION =
  "Easy Digital Invoice is Pakistan's FBR-integrated e-invoicing platform. " +
  "Generate, validate & submit FBR-compliant sale invoices in minutes. " +
  "Supports NTN, CNIC, STRN validation with direct FBR API submission, " +
  "sales tax calculation, PDF export, and multi-user team access.";

const KEYWORDS = [
  'FBR invoicing Pakistan',
  'FBR e-invoice software',
  'FBR compliance Pakistan',
  'Pakistan e-invoicing',
  'NTN invoicing',
  'STRN sales tax',
  'FBR API submission',
  'digital invoicing Pakistan',
  'FBR portal alternative',
  'tax compliance software Pakistan',
  'sale invoice Pakistan',
  'GST invoicing Pakistan',
  'FBR POS integration',
  'e-invoice generation Pakistan',
  'FBR sandbox testing',
  'business invoicing software Pakistan',
];

/* ─────────────────────────────────────────────────────────────── */
/*  Root metadata                                                  */
/* ─────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  // Canonical base — all relative URLs in metadata resolve against this
  metadataBase: new URL(SITE_URL),

  // Title template — individual pages set their own title; root gets the default
  title: {
    default: `${SITE_NAME} — ${TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },

  description: DESCRIPTION,
  keywords: KEYWORDS,

  // Authorship
  authors:      [{ name: SITE_NAME, url: SITE_URL }],
  creator:      SITE_NAME,
  publisher:    SITE_NAME,
  generator:    'Next.js',
  category:     'Business Software',
  applicationName: SITE_NAME,

  // Referrer policy — don't leak full URL to third parties
  referrer: 'origin-when-cross-origin',

  // ── Open Graph ──────────────────────────────────────────────────
  openGraph: {
    type:      'website',
    locale:    'en_PK',
    url:       SITE_URL,
    siteName:  SITE_NAME,
    title:     `${SITE_NAME} — ${TAGLINE}`,
    description: DESCRIPTION,
    images: [
      {
        url:    '/opengraph-image',   // points to our dynamic OG image route
        width:  1200,
        height: 630,
        alt:    `${SITE_NAME} — FBR-Compliant Invoicing for Pakistan`,
        type:   'image/png',
      },
    ],
  },

  // ── Twitter / X Card ────────────────────────────────────────────
  twitter: {
    card:        'summary_large_image',
    title:       `${SITE_NAME} — ${TAGLINE}`,
    description: DESCRIPTION,
    images:      ['/opengraph-image'],
  },

  // ── Icons ────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut:    '/icon.svg',
    apple:       '/icon.svg',
  },

  // ── PWA Manifest ─────────────────────────────────────────────────
  manifest: '/site.webmanifest',

  // ── Default robots (public pages get indexed; dashboard pages override) ──
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },

  // ── Verification placeholders ─────────────────────────────────────
  // Uncomment and fill these in once you've verified in Search Console / Bing etc.
  // verification: {
  //   google: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  //   yandex: 'XXXXXXXXXXXXXXXX',
  //   bing:   'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  // },

  // ── Alternate links ───────────────────────────────────────────────
  alternates: {
    canonical: SITE_URL,
  },
};

/* ─────────────────────────────────────────────────────────────── */
/*  Viewport (separate export — required in Next.js 14+)          */
/* ─────────────────────────────────────────────────────────────── */

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)',  color: '#09090b' },
  ],
};

/* ─────────────────────────────────────────────────────────────── */
/*  Root layout                                                    */
/* ─────────────────────────────────────────────────────────────── */

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-PK" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
