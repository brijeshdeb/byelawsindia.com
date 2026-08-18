/**
 * Next.js middleware — auth-based routing.
 *
 * Rules:
 *   /           → redirect to /login (or /dashboard if already authenticated)
 *   /login      → pass through; if already authenticated, redirect to /dashboard
 *   /dashboard  → require authentication; redirect to /login if not
 *   /select-context → require authentication
 *
 * The middleware refreshes the Supabase session cookie on every request
 * so tokens stay valid across page navigations.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/login"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient(request, response);

  // Refresh session — keeps the cookie alive
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Root — authenticated users go to the context selector (which routes platform
  // admins to /platform/console and society users to /dashboard automatically).
  // Unauthenticated users see the public marketing homepage.
  if (pathname === "/") {
    if (session) return NextResponse.redirect(new URL("/select-context", request.url));
    return response;
  }

  // Auth routes — bounce authenticated users away
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }

  // Protected routes — require a session
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     *   - _next/static  (static assets)
     *   - _next/image   (image optimisation)
     *   - favicon.ico
     *   - /api/*        (API routes handle their own auth)
     *   - public static files (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf)).*)",
  ],
};
