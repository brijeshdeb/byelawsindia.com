/**
 * Server-side Supabase client (for Server Components and Route Handlers).
 *
 * Reads the session from cookies — does NOT take credentials from the browser.
 * Each request gets a fresh client instance; do not cache across requests.
 *
 * Usage: import in Server Components, Route Handlers, and Server Actions.
 * Never import this in client components.
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore.
            // The middleware refreshes the session for subsequent requests.
          }
        },
      },
    }
  );
}
