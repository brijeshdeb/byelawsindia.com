"use server";
/**
 * Auth Server Actions.
 *
 * Server Actions run on the server and have reliable access to cookies()
 * from next/headers — unlike Route Handlers, they can call cookieStore.set()
 * and have those changes reflected on the response Next.js sends back.
 *
 * Using a Server Action for sign-out (rather than a Route Handler) avoids
 * two problems:
 *   1. The DOM-removal race: onClick closing a dropdown removes the form
 *      from the DOM before the submit event fires, cancelling the submission.
 *      Server Action form submissions bypass this because they are processed
 *      differently by React (treated as a navigation / mutation, not a
 *      traditional form submit).
 *   2. The NextResponse cookie split: a Route Handler that returns a custom
 *      NextResponse.redirect() does not inherit cookies set via cookies()
 *      from next/headers — the two response objects are separate. Server
 *      Actions don't have this problem because Next.js owns the response.
 */
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { CONTEXT_COOKIE } from "@/server/services/AccessService";
import { writeAudit } from "@/lib/audit";

export async function signOutAction() {
  const supabase = await createClient();

  // Capture actor before clearing the session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signs out server-side — calls setAll on the cookies() store, which
  // Next.js correctly propagates to the response for Server Actions.
  await supabase.auth.signOut();

  // Also explicitly delete the context cookie
  const cookieStore = await cookies();
  cookieStore.delete(CONTEXT_COOKIE);

  if (user) {
    // Non-throwing — audit failures never block sign-out
    await writeAudit({
      actorUserId: user.id,
      action: "LOGOUT",
      entityType: "auth",
      entityId: user.id,
    });
  }

  redirect("/login");
}
