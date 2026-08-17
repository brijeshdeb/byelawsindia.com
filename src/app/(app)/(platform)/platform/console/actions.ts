"use server";

/**
 * Platform console server actions.
 *
 * switchToSociety: Sets the society context cookie and redirects to the
 * tenant dashboard. Platform admins use this to "enter" a society directly
 * from the system overview table.
 *
 * Security:
 *   - requireCurrentUser() verifies an active session from the DB.
 *   - is_platform_admin is read from the DB row, never from a cookie.
 *   - The service-role key is not used here — caller's own auth is enough
 *     since we are only writing a cookie, not querying cross-tenant data.
 *   - writeAudit logs every context switch for the platform audit trail.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

const CONTEXT_COOKIE = "chs_selected_context";

/**
 * Called from a plain <form action={switchToSociety}> in the console table.
 *
 * 1. Verifies the caller is a platform admin (from DB).
 * 2. Writes { societyId, wingId: null } to the context cookie (httpOnly).
 * 3. Audits the switch.
 * 4. Redirects to /dashboard.
 *
 * FormData keys:
 *   societyId — the id of the society to switch into
 */
export async function switchToSociety(formData: FormData): Promise<void> {
  let caller: Awaited<ReturnType<typeof requireCurrentUser>>;
  try {
    caller = await requireCurrentUser();
  } catch {
    redirect("/login");
  }

  if (!caller.is_platform_admin) {
    // Not a platform admin — send them back, do not switch context.
    redirect("/platform/console");
  }

  const societyId = (formData.get("societyId") as string | null)?.trim();
  if (!societyId) {
    redirect("/platform/console");
  }

  // Write the context cookie. httpOnly prevents client JS from reading it.
  const cookieStore = await cookies();
  cookieStore.set(CONTEXT_COOKIE, JSON.stringify({ societyId, wingId: null }), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  // Non-blocking audit. A failed audit write does not prevent the switch.
  await writeAudit({
    actorUserId: caller.id,
    action: "PLATFORM_CONTEXT_SWITCHED",
    entityType: "society",
    entityId: societyId,
    societyId,
    metadata: { switchedBy: caller.email },
  });

  redirect("/dashboard");
}
