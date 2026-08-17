"use server";

/**
 * Server Action — login form submission.
 *
 * Uses Supabase email/password auth. Logs both successful and failed
 * attempts to the audit table.
 *
 * Returns an error string on failure (displayed in the form) rather than
 * throwing, because the form needs to show field-level feedback.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/auth";

export interface LoginState {
  error?: string;
  fieldErrors?: { email?: string; password?: string };
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const redirectTo = (formData.get("redirectTo") as string | null) ?? "/select-context";

  // Basic validation — Supabase will do real validation too
  const fieldErrors: LoginState["fieldErrors"] = {};
  if (!email) fieldErrors.email = "Email address is required.";
  if (!password) fieldErrors.password = "Password is required.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const supabase = await createClient();

  const reqHeaders = await headers();
  const userAgent = reqHeaders.get("user-agent") ?? undefined;
  const ipAddress = getClientIp({ headers: reqHeaders } as unknown as Request);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    // Log failed attempt — non-throwing (don't let audit failure break login)
    await writeAudit({
      action: "LOGIN_FAILED",
      entityType: "auth",
      metadata: { email, reason: error?.message ?? "Unknown" },
      ipAddress,
      userAgent,
    });

    // Never expose Supabase internals to the browser
    const message =
      error?.message?.toLowerCase().includes("invalid login credentials")
        ? "Email address or password is incorrect."
        : "Sign in failed. Please try again.";

    return { error: message };
  }

  await writeAudit({
    actorUserId: data.user.id,
    action: "LOGIN_SUCCESS",
    entityType: "auth",
    entityId: data.user.id,
    ipAddress,
    userAgent,
  });

  revalidatePath("/", "layout");

  // Route platform admins directly to the console so they never touch select-context.
  // This also prevents the redirect loop caused by a missing profile row.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", data.user.id)
    .single();

  if (profile?.is_platform_admin) {
    redirect("/platform/console");
  }

  // Safe redirect — validate the target stays within our domain
  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/select-context";
  redirect(safeRedirect);
}
