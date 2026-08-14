/**
 * Context selection handler.
 *
 * Called when the user clicks a context card on /select-context.
 * Validates the requested (societyId, wingId) against live DB assignments,
 * writes the selection to an httpOnly cookie, then redirects to /dashboard.
 *
 * Security:
 * - societyId and wingId come from the query string (user-controlled).
 *   resolveUserContext() validates them against the DB before trusting them.
 * - The cookie is httpOnly + sameSite:lax so it cannot be read by JS.
 */
import { NextRequest, NextResponse } from "next/server";
import { resolveUserContext, CONTEXT_COOKIE } from "@/server/services/AccessService";
import { AppError } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const societyId = searchParams.get("societyId");
  const wingId = searchParams.get("wingId") ?? null;

  if (!societyId) {
    return NextResponse.redirect(`${origin}/select-context?error=missing_society`);
  }

  try {
    // This validates the triple against the database — never trusts query params alone
    const context = await resolveUserContext(societyId, wingId);

    const response = NextResponse.redirect(`${origin}/dashboard`);
    response.cookies.set(CONTEXT_COOKIE, JSON.stringify({
      societyId: context.societyId,
      wingId: context.wingId,
    }), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.redirect(
        `${origin}/select-context?error=${encodeURIComponent(err.code)}`
      );
    }
    console.error("[select-context] Unexpected error:", err);
    return NextResponse.redirect(`${origin}/select-context?error=unexpected`);
  }
}
