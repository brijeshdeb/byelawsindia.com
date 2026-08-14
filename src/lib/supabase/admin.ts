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
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// This import will fail at build time if called from a browser bundle.
// That is intentional — it's a compile-time guard against accidental exposure.
if (typeof window !== "undefined") {
  throw new Error(
    "[security] supabase/admin.ts was imported in a browser context. " +
      "The service role key must never reach the browser. " +
      "Check your import chain and move the offending code to a server module."
  );
}

let adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function createAdminClient() {
  // Singleton per server process — fine because this module is server-only
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set " +
        "to use the admin client."
    );
  }

  adminClient = createClient<Database>(url, serviceKey, {
    auth: {
      // Disable auto-refresh — admin client sessions don't expire
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
