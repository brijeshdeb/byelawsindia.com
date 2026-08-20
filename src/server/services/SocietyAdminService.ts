import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const RESERVED_EMAIL_DOMAINS = new Set([
  "example.com",
  "example.net",
  "example.org",
  "test",
  "demo",
]);

export function validateOperationalEmail(email: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Please enter a valid email address.";
  }

  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (RESERVED_EMAIL_DOMAINS.has(domain) || domain.endsWith(".example.com")) {
    return "Use a real, monitored email address. Placeholder domains cannot receive a login invite.";
  }

  return null;
}

export async function resolveOrInviteUser(params: {
  email: string;
  fullName: string;
}): Promise<{ userId: string; invited: boolean }> {
  const admin = createAdminClient();
  const email = params.email.trim().toLowerCase();
  const fullName = params.fullName.trim();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, is_active")
    .ilike("email", email)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (profile) {
    if (!profile.is_active) throw new Error("This user account is inactive.");
    return { userId: profile.id, invited: false };
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
  });

  if (error || !data.user) {
    throw new Error(error?.message || "The login invitation could not be created.");
  }

  return { userId: data.user.id, invited: true };
}

export async function assignSocietyAdmin(params: {
  userId: string;
  societyId: string;
  actorUserId: string;
}): Promise<string> {
  const admin = createAdminClient();
  const { data: role, error: roleError } = await admin
    .from("roles")
    .select("id")
    .eq("name", "Society Admin")
    .eq("is_system_role", true)
    .single();

  if (roleError) throw new Error("The Society Admin role is not configured.");

  const { data: existing, error: lookupError } = await admin
    .from("user_access_assignments")
    .select("id, is_active")
    .eq("user_id", params.userId)
    .eq("society_id", params.societyId)
    .is("wing_id", null)
    .eq("role_id", role.id)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);

  if (existing) {
    if (!existing.is_active) {
      const { error } = await admin
        .from("user_access_assignments")
        .update({
          is_active: true,
          valid_from: null,
          valid_until: null,
          updated_by: params.actorUserId,
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    }
    return existing.id;
  }

  const { data: assignment, error } = await admin
    .from("user_access_assignments")
    .insert({
      user_id: params.userId,
      society_id: params.societyId,
      wing_id: null,
      role_id: role.id,
      is_active: true,
      valid_from: null,
      valid_until: null,
      created_by: params.actorUserId,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return assignment.id;
}

export async function removeNewlyInvitedUser(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) console.error("[removeNewlyInvitedUser] cleanup failed:", error.message);
}
