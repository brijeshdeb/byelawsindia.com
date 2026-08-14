/**
 * Supabase client for use in Next.js middleware.
 *
 * This is a specialized client that can read and write cookies during
 * the middleware phase, enabling session refresh for every request.
 * It does NOT persist sessions — it only refreshes them in-flight.
 *
 * NOTE: createServerClient returns SupabaseClient<Database, SchemaName, Schema>
 * which in the updated supabase-js v2 signature maps Schema (an object) to the
 * SchemaName slot (expects string), causing Schema=never for all query types.
 * We cast to SupabaseClient<Database, "public"> which resolves correctly.
 * Middleware only calls supabase.auth.getUser() so this is safe in all cases.
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database";

type MiddlewareClient = SupabaseClient<Database, "public">;

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
