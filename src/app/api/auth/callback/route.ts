/**
 * Supabase Auth callback handler.
 *
 * Exchanges the auth code for a session after:
 * - Email confirmation
 * - Password reset
 * - Magic link login (if enabled)
 *
 * On success: redirects to the context selector.
 * On failure: redirects to login with an error parameter.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/select-context";

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=auth_callback_missing_code`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] Code exchange failed:", error.message);
    return NextResponse.redirect(
      `${origin}/login?error=auth_callback_failed`
    );
  }

  // Safe redirect — must stay on the same origin
  const safeNext = next.startsWith("/") ? next : "/select-context";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
