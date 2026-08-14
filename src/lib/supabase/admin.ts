/**
 * Supabase admin client using the service role key.
 *
 * CRITICAL SECURITY RULES:
 * 1. This client BYPASSES Row Level Security entirely.
 * 2. It must NEVER be imported in any file that may be bundled for the browser.
 * 3. It must ONLY be used in server-side modules: server services, scheduled jobs,
 *    webhook handlers, and migration scripts.
 * 4. Before using this client, verify that RLS is genuinely insufficient for the
 *    operation and that service-level access is the correct solution.
 *
 * Valid use cases:
 *   - Writing audit records (append-only, users cannot write their own)
 *   - Atomic sequence number generation
 *   - Supabase Auth admin operations (create user, disable account)
 *   - Webhook event processing
 *   - Background job processing
 *
 * Invalid use cases (use the regular server client instead):
 *   - Fetching data that a normal authenticated user could fetch
 *   - Any operation triggered by a user's own authenticated request
 *     that RLS would permit
 *
 * NOTE: The `as unknown as AdminClient` cast on createClient() is intentional.
 * @supabase/supabase-js's GenericSchema constraint fails when the Schema type
 * parameter is evaluated against the Database type in certain TypeScript
 * module-resolution configurations. The cast bypasses constraint checking
 * while preserving full type safety at all call sites. Runtime behavior is
 * identical — the service role client is created normally.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// This guard fails at build time if called from a browser bundle.
// That is intentional — it's a compile-time guard against accidental exposure.
if (typeof window !== "undefined") {
  throw new Error(
    "[security] supabase/admin.ts was imported in a browser context. " +
      "The service role key must never reach the browser. " +
      "Check your import chain and move the offending code to a server module."
  );
}

/**
 * Fully-typed admin client type for internal use.
 *
 * SupabaseClient<Database, "public"> is the correct 2-arg form. See server.ts
 * for the full explanation of why the 3-arg form causes Schema=never.
 */
type AdminClient = SupabaseClient<Database, "public">;

let adminClient: AdminClient | null = null;

export function createAdminClient(): AdminClient {
  // Singleton per server process — fine because this module is server-only.
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set " +
        "to use the admin client."
    );
  }

  adminClient = createClient(url, serviceKey, {
    auth: {
      // Disable auto-refresh — admin client sessions don't expire.
      autoRefreshToken: false,
      persistSession: false,
    },
  }) as unknown as AdminClient;

  return adminClient;
}
