"use server";

import { revalidatePath } from "next/cache";
import { getServerContext, wrapAction, type ActionResult } from "@/lib/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUserContext } from "@/server/services/AccessService";
import {
  removeNewlyInvitedUser,
  resolveOrInviteUser,
  validateOperationalEmail,
} from "@/server/services/SocietyAdminService";

export async function provisionSocietyUserAction(input: {
  email: string;
  fullName: string;
  roleId: string;
  wingId?: string;
}): Promise<ActionResult<{ assignmentId: string; invited: boolean }>> {
  return wrapAction(async () => {
    const { supabase, societyId, wingId: contextWingId, userId } = await getServerContext();
    const context = await resolveUserContext(societyId, contextWingId);
    if (context.isPlatformAdmin || context.roleName !== "Society Admin" || context.wingId) {
      throw new Error("A society-wide Society Admin login is required.");
    }
    const email = input.email.trim().toLowerCase();
    const fullName = input.fullName.trim();
    if (!fullName || !input.roleId) throw new Error("Name and role are required.");
    const emailError = validateOperationalEmail(email);
    if (emailError) throw new Error(emailError);

    const admin = createAdminClient();
    const { data: existingProfile } = await admin.from("profiles").select("id").ilike("email", email).maybeSingle();
    if (!existingProfile && context.environmentType !== "CUSTOMER") {
      throw new Error("Demo and test societies can link existing test accounts but cannot send external login invitations.");
    }

    let account: { userId: string; invited: boolean } | null = null;
    try {
      account = await resolveOrInviteUser({ email, fullName });
      const { data, error } = await supabase.rpc("assign_society_user_access" as never, {
        p_society_id: societyId,
        p_target_user_id: account.userId,
        p_role_id: input.roleId,
        p_wing_id: input.wingId || null,
        p_actor_user_id: userId,
      } as never);
      if (error) throw new Error(error.message);
      revalidatePath("/admin/users");
      return { assignmentId: String(data), invited: account.invited };
    } catch (error) {
      if (account?.invited) await removeNewlyInvitedUser(account.userId);
      throw error;
    }
  });
}

export async function revokeSocietyUserAccessAction(input: {
  assignmentId: string;
}): Promise<ActionResult> {
  return wrapAction(async () => {
    const { supabase, societyId, wingId, userId } = await getServerContext();
    const context = await resolveUserContext(societyId, wingId);
    if (context.isPlatformAdmin || context.roleName !== "Society Admin" || context.wingId) {
      throw new Error("A society-wide Society Admin login is required.");
    }
    const { error } = await supabase.rpc("revoke_society_user_access" as never, {
      p_assignment_id: input.assignmentId,
      p_actor_user_id: userId,
    } as never);
    if (error) throw new Error(error.message);
    revalidatePath("/admin/users");
  });
}
