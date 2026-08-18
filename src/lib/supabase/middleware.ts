/**
 * Supabase client helper for Next.js middleware.
 *
 * DEPRECATED — do not use this helper for the main auth middleware.
 *
 * This helper has a known limitation: it accepts a `response` parameter that
 * was already created with `NextResponse.next()`. Because `setAll` cannot
 * recreate `response` with `NextResponse.next({ request })`, the refreshed JWT
 * is NOT forwarded to server components when Supabase rotates an expired token.
 * Server components would then call Supabase with the old JWT, `auth.uid()`
 * would be null, and RLS would return empty results for every tenant table.
 *
 * The correct pattern (used in middleware.ts) is:
 *   let response = NextResponse.next({ request });
 *   const supabase = createServerClient(..., {
 *     cookies: {
 *       getAll: () => request.cookies.getAll(),
 *       setAll(cookiesToSet) {
 *         cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
 *         response = NextResponse.next({ request });  // recreate with updated request
 *         cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(...));
 *       },
 *     },
 *   });
 *
 * This file is kept for reference only. middleware.ts creates its client inline.
 *
 * NOTE: createServerClient returns SupabaseClient<Database, SchemaName, Schema>
 * which in the updated supabase-js v2 signature maps Schema (an object) to the
 * SchemaName slot (expects string), causing Schema=never for all query types.
 * We cast to SupabaseClient<Database, "public"> which resolves correctly.
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database";

type MiddlewareClient = SupabaseClient<Database, "public">;

/**
 * @deprecated Use the inline createServerClient pattern in middleware.ts instead.
 * This helper cannot properly forward refreshed JWTs to server components.
 */
export function createMiddlewareClient(
  request: NextRequest,
  response: NextResponse
): MiddlewareClient {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  ) as unknown as MiddlewareClient;
}
