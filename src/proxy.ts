import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-edge";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Validate session using better-auth
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: request.headers,
    });
  } catch (error) {
    // Session validation failed
    console.error("Session validation error:", error);
  }

  // Define auth and protected routes
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
    "/dashboard/:path*",
    "/members/:path*",
    "/settings/:path*",
    "/invoices/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
