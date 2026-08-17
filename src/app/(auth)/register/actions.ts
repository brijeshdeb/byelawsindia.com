"use server";

/**
 * Server Action — new admin registration.
 *
 * Creates a Supabase auth user via the admin API (service role).
 * The handle_new_user trigger automatically creates a matching profiles row.
 * The new user has NO access assignments — a platform admin must assign them
 * to a society before they can log in beyond the select-context screen.
 *
 * Security:
 *   - Uses admin client server-side only (service role key never hits browser)
 *   - Password strength enforced by Supabase Auth (min 6 chars by default)
 *   - Full-name pulled from user_metadata via handle_new_user trigger
 *   - Rate limiting is handled by Supabase Auth
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/audit";

export interface RegisterState {
  success?: boolean;
  email?: string;
  error?: string;
  fieldErrors?: {
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  };
}

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const fullName       = (formData.get("fullName")       as string | null)?.trim() ?? "";
  const email          = (formData.get("email")          as string | null)?.trim().toLowerCase() ?? "";
  const phone          = (formData.get("phone")          as string | null)?.trim() ?? "";
  const societyName    = (formData.get("societyName")    as string | null)?.trim() ?? "";
  const password       = (formData.get("password")       as string | null) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string | null) ?? "";

  // ── Field validation ───────────────────────────────────────────────────────
  const fieldErrors: RegisterState["fieldErrors"] = {};

  if (!fullName)                          fieldErrors.fullName       = "Full name is required.";
  if (fullName.length > 0 && fullName.length < 2) fieldErrors.fullName = "Name must be at least 2 characters.";
  if (!email)                             fieldErrors.email          = "Email address is required.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                                          fieldErrors.email          = "Enter a valid email address.";
  if (!password)                          fieldErrors.password       = "Password is required.";
  if (password && password.length < 8)   fieldErrors.password       = "Password must be at least 8 characters.";
  if (password !== confirmPassword)      fieldErrors.confirmPassword = "Passwords do not match.";

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  // ── Create user via admin API ─────────────────────────────────────────────
  try {
    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation — admin-created accounts are pre-verified
      user_metadata: {
        full_name:    fullName,
        phone:        phone || undefined,
        society_name: societyName || undefined,
      },
    });

    if (error) {
      // Supabase returns a generic message for duplicate emails — keep it safe
      if (error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("already been registered") ||
          error.message.toLowerCase().includes("unique")) {
        return { fieldErrors: { email: "An account with this email already exists." } };
      }
      return { error: "Registration failed. Please try again or contact support." };
    }

    if (!data.user) {
      return { error: "Registration failed. Please try again." };
    }

    // Audit — no society_id because the user has no assignment yet
    await writeAudit({
      actorUserId: data.user.id,
      action:      "USER_CREATED",
      entityType:  "profile",
      entityId:    data.user.id,
      metadata:    { email, fullName, societyName: societyName || null, selfRegistered: true },
    });

    return { success: true, email };

  } catch (err) {
    console.error("[register] Unexpected error:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
