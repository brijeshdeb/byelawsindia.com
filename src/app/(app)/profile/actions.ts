"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { writeAudit } from "@/lib/audit";
import { validateNewPassword } from "@/lib/password-policy";

export interface ChangePasswordState {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
}

export async function changePasswordAction(
  _previousState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const fieldErrors: NonNullable<ChangePasswordState["fieldErrors"]> = {};

  if (!currentPassword) fieldErrors.currentPassword = "Enter your current password.";
  const passwordError = validateNewPassword(newPassword);
  if (passwordError) {
    fieldErrors.newPassword = passwordError;
  } else if (newPassword === currentPassword) {
    fieldErrors.newPassword = "Choose a password different from the current password.";
  }
  if (newPassword !== confirmPassword) {
    fieldErrors.confirmPassword = "The new passwords do not match.";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user?.email) return { error: "Your session has expired. Please sign in again." };

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) return { fieldErrors: { currentPassword: "The current password is incorrect." } };

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) return { error: "The password could not be changed. Please try again." };

  // Keep this browser signed in while invalidating other sessions for the account.
  await supabase.auth.signOut({ scope: "others" });
  await writeAudit({
    actorUserId: user.id,
    action: "PASSWORD_CHANGED",
    entityType: "auth",
    entityId: user.id,
  });

  revalidatePath("/profile");
  return { success: true };
}
