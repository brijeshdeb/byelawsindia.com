/**
 * Next.js middleware — runs on every matched request.
 *
 * Responsibilities:
 *  1. Refresh the Supabase session (keeps the auth token alive).
 *  2. Redirect unauthenticated users away from protected routes.
 *  3. Redirect authenticated users away from auth routes (login).
 *
 * Authorization (which society, which wing, which permission) is NOT
 * handled here. Middleware only establishes "are you logged in at all."
 * Fine-grained authorization happens in Server Components and Route Handlers
 * via AccessService.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/activate", "/reset-password", "/api/auth"];

// Routes that should redirect authenticated users away (e.g. login page)
const AUTH_ROUTES = ["/login"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  // Create a Supabase client scoped to this request/response pair.
  // This refreshes the session token if it is close to expiry.
  const supabase = createMiddlewareClient(request, response);

  // IMPORTANT: always use getUser() — never getSession() for auth checks.
  // getSession() reads from the (unverified) cookie; getUser() validates
  // the token against the Supabase Auth server.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Allow API webhook endpoints without authentication
  if (pathname.startsWith("/api/webhooks")) {
    return response;
  }

  // Allow static files and Next.js internals through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return response;
  }

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Authenticated user on an auth-only page (e.g. /login) → redirect to app
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  if (user && !error && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Unauthenticated user on a protected page → redirect to login
  if (!user && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    // Preserve the intended destination so we can redirect after login
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
