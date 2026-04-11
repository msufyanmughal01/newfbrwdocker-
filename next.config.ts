import type { NextConfig } from "next";

// Security headers applied at the Next.js layer.
// These act as a defence-in-depth fallback for environments where the nginx
// reverse-proxy is not in front of the app (e.g. local dev, direct container
// access). In production the nginx.conf layer sets the same headers; having
// them here means a single misconfigured proxy cannot strip all protection.
const securityHeaders = [
  // Never send the "X-Powered-By: Next.js" banner
  // (handled via poweredByHeader:false, but belt-and-suspenders here too)
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Enforce HTTPS for 2 years, including sub-domains (preload-ready)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Block all framing — prevents clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers from MIME-sniffing away from the declared content-type
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only send full referrer to same-origin; only origin to cross-origin HTTPS
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable sensitive browser APIs that the app never uses
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // Legacy XSS filter for older browsers
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Prevent cross-origin reads of this site's resources
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  // Isolate the browsing context — enables cross-origin isolation APIs
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  output: "standalone",

  // Remove the "X-Powered-By: Next.js" response header from every response.
  poweredByHeader: false,

  // ── Client-side router cache ─────────────────────────────────────────────
  // staleTimes controls how long the client-side router cache keeps prefetched
  // pages before considering them stale. Raising these reduces redundant
  // server round-trips when users navigate back and forth.
  allowedDevOrigins: ["192.168.1.8"],

  experimental: {
    staleTimes: {
      dynamic: 0,    // never cache dynamic pages — ensures auth checks run on every navigation
      static: 180,   // reuse static pages for 3 min
    },
  },

  // ── Dev performance ──────────────────────────────────────────────────────
  // Reduce output-file-tracing work during standalone builds.
  // Excludes large native binaries that don't need to be traced.
  outputFileTracingExcludes: {
    "*": [
      "./node_modules/@swc/core-win32-x64-msvc/**",
      "./node_modules/sharp/**",
      "./node_modules/esbuild/**",
    ],
  },

  // Apply security headers to every route.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Dashboard routes must never be stored in bfcache.
      // Cache-Control: no-store prevents the browser from restoring a
      // stale authenticated page when the user presses Back after logout.
      {
        source: "/(dashboard|invoices|clients|settings|sandbox|spreadsheet)(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
