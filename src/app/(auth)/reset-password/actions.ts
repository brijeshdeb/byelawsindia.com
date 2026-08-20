"use server";

import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { validateNewPassword } from "@/lib/password-policy";

export interface ResetRequestState {
  success?: boolean;
  error?: string;
  fieldErrors?: { email?: string };
}

export interface ResetPasswordState {
  success?: boolean;
  error?: string;
  fieldErrors?: { newPassword?: string; confirmPassword?: string };
}

export async function requestPasswordResetAction(
  _previousState: ResetRequestState,
  formData: FormData
): Promise<ResetRequestState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { fieldErrors: { email: "Enter a valid email address." } };
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  if (!host) return { error: "Password recovery is temporarily unavailable." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${protocol}://${host}/api/auth/callback?next=/reset-password/update`,
  });

  await writeAudit({
    action: "PASSWORD_RESET_REQUESTED",
    entityType: "auth",
    metadata: { email, deliveryAccepted: !error },
  });

  // Do not reveal whether an account exists for this address.
  return { success: true };
}

export async function completePasswordResetAction(
  _previousState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const cookieStore = await cookies();
  if (cookieStore.get("bli_password_recovery")?.value !== "1") {
    return { error: "This recovery link is missing or expired. Request a new one." };
  }

  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const fieldErrors: NonNullable<ResetPasswordState["fieldErrors"]> = {};
  const passwordError = validateNewPassword(newPassword);
  if (passwordError) fieldErrors.newPassword = passwordError;
  if (newPassword !== confirmPassword) fieldErrors.confirmPassword = "The passwords do not match.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { error: "This recovery session has expired. Request a new link." };
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) return { error: "The password could not be reset. Request a new link and try again." };

  await supabase.auth.signOut({ scope: "others" });
  cookieStore.delete("bli_password_recovery");
  await writeAudit({
    actorUserId: userData.user.id,
    action: "PASSWORD_RESET_COMPLETED",
    entityType: "auth",
    entityId: userData.user.id,
  });

  return { success: true };
}
