/**
 * Server-side Supabase client (for Server Components and Route Handlers).
 *
 * Reads the session from cookies — does NOT take credentials from the browser.
 * Each request gets a fresh client instance; do not cache across requests.
 *
 * Usage: import in Server Components, Route Handlers, and Server Actions.
 * Never import this in client components.
 *
 * NOTE: The `as unknown as TypedClient` cast is intentional. @supabase/ssr's
 * type declarations import GenericSchema from a subpath of supabase-js that
 * doesn't exist in the installed package version, which causes the Schema type
 * parameter to collapse to `never` through the constraint chain. The cast
 * bypasses that constraint resolution while preserving full type safety at
 * usage sites. The runtime client is identical — only TypeScript inference is
 * affected.
 */
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Fully-typed Supabase client for server-side use.
 *
 * We use SupabaseClient<Database, "public"> (2-arg form) deliberately:
 * - 1st arg: Database (our schema types)
 * - 2nd arg: "public" (SchemaNameOrClientOptions — resolves SchemaName="public")
 * - SchemaName and Schema default correctly: SchemaName="public", Schema=Database["public"]
 *
 * The 3-arg form SupabaseClient<Database, "public", Database["public"]> is WRONG
 * because in supabase-js v2's updated signature, the 3rd parameter is SchemaName
 * (a string), not Schema (an object). Passing the schema object as SchemaName
 * makes SchemaName=never, collapsing all query types to never.
 */
export type TypedSupabaseClient = SupabaseClient<Database, "public">;

export async function createClient(): Promise<TypedSupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
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
  ) as unknown as TypedSupabaseClient;
}
