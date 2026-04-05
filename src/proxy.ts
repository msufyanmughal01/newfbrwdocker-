import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-edge";

// Public API routes that bypass the session cookie check.
// All other /api/* routes require a valid Better Auth session cookie.
const PUBLIC_API_PREFIXES = [
  "/api/auth/",    // Better Auth sign-in/sign-up/etc.
  "/api/health",   // Docker health check
  "/api/contact",  // Public contact form
  "/api/admin/",   // Admin panel has its own httpOnly cookie auth
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── API route guard (fast path: cookie presence check) ──────────────────
  // Avoids a DB round-trip on every API call. Full session validation still
  // happens inside each route handler via auth.api.getSession().
  if (pathname.startsWith("/api/")) {
    if (!PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      const sessionToken =
        request.cookies.get("better-auth.session_token") ??
        request.cookies.get("__Secure-better-auth.session_token");
      if (!sessionToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    return NextResponse.next();
  }

  // ── Page route guard (full DB session check via Better Auth) ────────────
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: request.headers,
    });
  } catch (error) {
    console.error("Session validation error:", error);
  }

  const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];
  const isAuthRoute = authRoutes.includes(pathname);
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/members") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/invoices");

  // Redirect authenticated users away from auth pages
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users away from protected routes
  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // API routes (session cookie guard)
    "/api/:path*",
    // Protected page routes (full session check + redirect)
    "/dashboard/:path*",
    "/members/:path*",
    "/settings/:path*",
    "/invoices/:path*",
    // Auth pages (redirect away if already logged in)
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
