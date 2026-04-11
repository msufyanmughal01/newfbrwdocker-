import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// In-memory sliding-window rate limiter  (Edge Runtime — lightweight guard)
//
// Rate-limit classes and their budgets:
//   auth      — /api/auth/**          POST  10 req / 60 s   (login, register, etc.)
//   adminAuth — /api/admin/auth        POST   5 req / 15 min (admin login brute-force)
//   contact   — /api/contact           POST   5 req / 60 min (spam / abuse)
//   upload    — file-upload endpoints  POST  10 req / 60 s   (DoS via large payloads)
//   fbr       — /api/fbr/**            POST  30 req / 60 s   (FBR external-call cost)
//   invoice   — /api/invoices          POST  20 req / 60 s   (quota-abuse / DoS)
//
// This proxy runs on the Edge Runtime and therefore uses an in-process Map.
// For multi-replica deployments a Redis-backed limiter is wired into the
// individual API route handlers — see src/lib/rate-limit/index.ts.
// The nginx layer adds a third, independent limit on top (defence-in-depth).
//
// BoundedRateLimitStore: caps memory at MAX_ENTRIES per key — no setInterval
// needed. Edge Runtime instances are ephemeral; a periodic interval would
// almost never fire before the instance is recycled.
// ─────────────────────────────────────────────────────────────────────────────

interface WindowEntry {
  count: number;
  windowStart: number;
}

interface LimitConfig {
  window: number; // milliseconds
  max: number;    // max requests per window
}

const LIMITS = {
  auth:      { window: 60_000,          max: 10 },
  adminAuth: { window: 15 * 60_000,     max: 5  },
  contact:   { window: 60 * 60_000,     max: 5  },
  upload:    { window: 60_000,          max: 10 },
  fbr:       { window: 60_000,          max: 30 },
  invoice:   { window: 60_000,          max: 20 },
} satisfies Record<string, LimitConfig>;

type LimitKey = keyof typeof LIMITS;

// Bounded Map — evicts oldest entry (FIFO) when capacity is reached.
// Keeps memory use O(MAX_ENTRIES) without requiring a background interval.
const MAX_ENTRIES = 5_000;

class BoundedRateLimitStore {
  private map = new Map<string, WindowEntry>();

  get(key: string): WindowEntry | undefined {
    return this.map.get(key);
  }

  set(key: string, entry: WindowEntry): void {
    if (this.map.size >= MAX_ENTRIES) {
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) this.map.delete(firstKey);
    }
    this.map.set(key, entry);
  }
}

const stores: Record<LimitKey, BoundedRateLimitStore> = {
  auth:      new BoundedRateLimitStore(),
  adminAuth: new BoundedRateLimitStore(),
  contact:   new BoundedRateLimitStore(),
  upload:    new BoundedRateLimitStore(),
  fbr:       new BoundedRateLimitStore(),
  invoice:   new BoundedRateLimitStore(),
};

function checkLimit(
  key: LimitKey,
  ip: string
): { limited: boolean; retryAfter: number } {
  const { window, max } = LIMITS[key];
  const store = stores[key];
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now - entry.windowStart >= window) {
    store.set(ip, { count: 1, windowStart: now });
    return { limited: false, retryAfter: 0 };
  }

  if (entry.count >= max) {
    const retryAfter = Math.ceil((window - (now - entry.windowStart)) / 1000);
    return { limited: true, retryAfter };
  }

  entry.count += 1;
  return { limited: false, retryAfter: 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function tooManyRequests(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please wait and try again." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Security headers added to every matched response.
// nginx sets the same headers in production; having them here too means a
// single misconfigured proxy cannot strip all protection.
// ─────────────────────────────────────────────────────────────────────────────
const SECURITY_HEADERS: [string, string][] = [
  ["X-Content-Type-Options",        "nosniff"],
  ["X-Frame-Options",               "DENY"],
  ["X-XSS-Protection",              "1; mode=block"],
  ["Referrer-Policy",               "strict-origin-when-cross-origin"],
  ["Permissions-Policy",            "camera=(), microphone=(), geolocation=()"],
  ["Cross-Origin-Resource-Policy",  "same-origin"],
  ["Cross-Origin-Opener-Policy",    "same-origin"],
];

function withSecurityHeaders(res: NextResponse): NextResponse {
  for (const [key, value] of SECURITY_HEADERS) {
    if (!res.headers.has(key)) {
      res.headers.set(key, value);
    }
  }
  return res;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API routes that bypass the session cookie check.
// ─────────────────────────────────────────────────────────────────────────────
const PUBLIC_API_PREFIXES = [
  "/api/auth/",    // Better Auth sign-in/sign-up/etc.
  "/api/health",   // Docker health check
  "/api/contact",  // Public contact form
  "/api/admin/",   // Admin panel has its own httpOnly cookie auth
];

// ─────────────────────────────────────────────────────────────────────────────
// Proxy entry point
// ─────────────────────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;
  const ip = getClientIp(request);

  // ── Rate limiting ──────────────────────────────────────────────────────────

  if (method === "POST" && pathname.startsWith("/api/auth/")) {
    const { limited, retryAfter } = checkLimit("auth", ip);
    if (limited) return tooManyRequests(retryAfter);
  }

  if (method === "POST" && pathname === "/api/admin/auth") {
    const { limited, retryAfter } = checkLimit("adminAuth", ip);
    if (limited) return tooManyRequests(retryAfter);
  }

  if (method === "POST" && pathname === "/api/contact") {
    const { limited, retryAfter } = checkLimit("contact", ip);
    if (limited) return tooManyRequests(retryAfter);
  }

  const isUploadEndpoint =
    method === "POST" &&
    (pathname === "/api/bulk-invoices/upload" ||
      pathname === "/api/settings/business-profile/logo" ||
      pathname === "/api/admin/upload-user-logo");

  if (isUploadEndpoint) {
    const { limited, retryAfter } = checkLimit("upload", ip);
    if (limited) return tooManyRequests(retryAfter);
  }

  if (
    method === "POST" &&
    (pathname.startsWith("/api/fbr/") || pathname.startsWith("/api/bulk-invoices/"))
  ) {
    const { limited, retryAfter } = checkLimit("fbr", ip);
    if (limited) return tooManyRequests(retryAfter);
  }

  if (method === "POST" && pathname === "/api/invoices") {
    const { limited, retryAfter } = checkLimit("invoice", ip);
    if (limited) return tooManyRequests(retryAfter);
  }

  // ── API route guard (fast path: cookie presence check) ──────────────────
  if (pathname.startsWith("/api/")) {
    if (!PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      const sessionToken =
        request.cookies.get("better-auth.session_token") ??
        request.cookies.get("__Secure-better-auth.session_token");
      if (!sessionToken) {
        return withSecurityHeaders(
          NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        );
      }
    }
    return withSecurityHeaders(NextResponse.next());
  }

  // ── Page route guard (fast cookie check — no DB roundtrip) ─────────────
  // Full session validation with DB lookup happens once per render tree via
  // React.cache()-wrapped getSession() in layout/page server components.
  // The cookie presence check here is sufficient to gate routing; if the
  // cookie is forged or expired the server component will catch it and
  // redirect(). This avoids a database query on every navigation.
  const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
  const protectedPrefixes = [
    "/dashboard",
    "/members",
    "/settings",
    "/invoices",
    "/clients",
    "/spreadsheet",
  ];
  const isAuthRoute = authRoutes.includes(pathname);
  const isProtectedRoute = protectedPrefixes.some((p) => pathname.startsWith(p));

  if (isProtectedRoute || isAuthRoute) {
    const sessionToken =
      request.cookies.get("better-auth.session_token") ??
      request.cookies.get("__Secure-better-auth.session_token");

    if (!sessionToken && isProtectedRoute) {
      return withSecurityHeaders(
        NextResponse.redirect(new URL("/login", request.url))
      );
    }

    if (sessionToken && isAuthRoute) {
      return withSecurityHeaders(
        NextResponse.redirect(new URL("/dashboard", request.url))
      );
    }

    // Prevent browser bfcache from freezing authenticated pages.
    // Without this, pressing Back after logout restores the page from memory
    // and bypasses all server-side auth checks entirely.
    if (isProtectedRoute && sessionToken) {
      const res = NextResponse.next();
      res.headers.set("Cache-Control", "no-store, must-revalidate");
      return withSecurityHeaders(res);
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};
