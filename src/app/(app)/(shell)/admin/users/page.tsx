import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { resolveUserContext } from "@/server/services/AccessService";
import { SocietyUsersClient } from "./SocietyUsersClient";

export const metadata: Metadata = { title: "User Management" };

export default async function UsersPage() {
  const { supabase, societyId, wingId, userId } = await getServerContext();
  const context = await resolveUserContext(societyId, wingId);
  const canManage = !context.isPlatformAdmin && context.roleName === "Society Admin" && !context.wingId;
  const [accessResult, rolesResult, wingsResult] = await Promise.all([
    canManage ? supabase.rpc("list_society_user_access" as never, { p_society_id: societyId } as never) : Promise.resolve({ data: [], error: null }),
    supabase.from("roles").select("id,name,description").eq("is_system_role", true).neq("name", "Vendor").order("name"),
    supabase.from("wings").select("id,name,code").eq("society_id", societyId).eq("is_active", true).order("name"),
  ]);
  return <SocietyUsersClient currentUserId={userId} canManage={canManage} assignments={(accessResult.data ?? []) as never[]} roles={rolesResult.data ?? []} wings={wingsResult.data ?? []} />;
}
