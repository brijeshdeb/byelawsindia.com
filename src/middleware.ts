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
 *
 * IMPORTANT — correct session propagation pattern:
 *   1. Create `let response = NextResponse.next({ request })` — passing `request`
 *      forwards the current cookies (including auth tokens) to server components.
 *   2. In `setAll`, recreate `response = NextResponse.next({ request })` after
 *      mutating `request.cookies` — this ensures server components see the
 *      refreshed JWT when Supabase rotates the token, not the expired one.
 *   3. Use `getUser()` (validates against the auth server) not `getSession()`
 *      (trusts the locally cached JWT without re-checking).
 *
 *   If `NextResponse.next()` is called without `{ request }`, server components
 *   receive the original request headers and see an expired JWT even though the
 *   middleware refreshed it. Pages then return empty results because RLS sees
 *   auth.uid() = null.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type MiddlewareSupabaseClient = SupabaseClient<Database, "public">;

const PUBLIC_PATHS = ["/login"];
const PASSWORD_PATHS = ["/reset-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Belt-and-suspenders: bypass auth for public crawler / SEO paths.
  // The config.matcher regex should already exclude these, but the Vercel
  // edge runtime can still invoke the function for public-directory files
  // in Next.js App Router. An early return costs nothing and guarantees
  // these routes are never accidentally redirected to /login.
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") {
    return NextResponse.next();
  }

  // CRITICAL: pass { request } so server components inherit the current cookies.
  // `let` because setAll may recreate this with the refreshed-token request.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          // Write refreshed tokens into the request so server components see them.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Recreate the response with the updated request headers, then set
          // the response cookies so the browser receives the new tokens too.
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  ) as unknown as MiddlewareSupabaseClient;

  // getUser() validates the token with the Supabase auth server on every call.
  // getSession() only trusts the local JWT without re-checking — not safe for
  // routing decisions and will not trigger a token refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Root — authenticated users go to the context selector (which routes platform
  // admins to /platform/console and society users to /dashboard automatically).
  // Unauthenticated users see the public marketing homepage.
  if (pathname === "/") {
    if (user) return NextResponse.redirect(new URL("/select-context", request.url));
    return response;
  }

  // Password recovery must remain reachable before and after the email-link
  // callback establishes a short-lived recovery session.
  if (PASSWORD_PATHS.some((p) => pathname.startsWith(p))) {
    return response;
  }

  // Auth routes — bounce authenticated users away
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (user) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return response;
  }

  // Protected routes — require a session
  if (!user) {
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
     *   - robots.txt, sitemap.xml (must be publicly accessible for SEO)
     *   - public static files (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|robots\\.txt|sitemap\\.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|otf)).*)",
  ],
};
