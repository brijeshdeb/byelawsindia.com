/**
 * Sign out route handler — kept as a fallback endpoint.
 *
 * The primary sign-out path is the Server Action in src/app/actions/auth.ts,
 * which is used by the Topbar. That approach is more reliable in Next.js 15
 * because Server Actions have proper cookie access and avoid the DOM-removal
 * race that can cancel form submissions from inside conditionally rendered
 * dropdown menus.
 *
 * This route handler remains available for any non-React contexts that need
 * to POST to /api/auth/signout directly (e.g. test scripts, mobile clients).
 * Cookie handling: the redirect response is built first so that signOut()'s
 * setAll writes directly to it rather than to a separate cookies() store.
 */
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { CONTEXT_COOKIE } from "@/server/services/AccessService";
import { writeAudit } from "@/lib/audit";
import type { Database } from "@/types/database";

export async function POST(request: NextRequest) {
  const { origin } = new URL(request.url);

  // Build the response first so the Supabase client can write cookie
  // deletions onto it directly.
  const response = NextResponse.redirect(`${origin}/login`);
  response.cookies.delete(CONTEXT_COOKIE);

  // Wire a client that reads from the request and writes to the response.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          );
        },
      },
    }
  );

  // Identify the actor for audit before wiping the session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // signOut() calls setAll to expire the auth cookies — they land on
  // `response` because of the wiring above.
  await supabase.auth.signOut();

  if (user) {
    await writeAudit({
      actorUserId: user.id,
      action: "LOGOUT",
      entityType: "auth",
      entityId: user.id,
    });
  }

  return response;
}
