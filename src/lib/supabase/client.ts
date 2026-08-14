/**
 * Browser-side Supabase client.
 *
 * Uses the PUBLIC anon key — safe for the browser.
 * RLS policies on the database are the actual security boundary.
 * This client respects the authenticated user's session cookie.
 *
 * Usage: import in Client Components ("use client") only.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
