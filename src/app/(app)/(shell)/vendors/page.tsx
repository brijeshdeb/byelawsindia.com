import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { VendorsClient } from "./VendorsClient";
import { resolveUserContext } from "@/server/services/AccessService";
import { PERMISSIONS } from "@/types";

export const metadata: Metadata = { title: "Vendors" };

export default async function VendorsPage() {
  const { supabase, societyId, wingId } = await getServerContext();
  const context=await resolveUserContext(societyId,wingId);

  const [{data:vendors},{data:links}]=await Promise.all([
    supabase.from("vendors").select("id, vendor_code, name, vendor_type, contact_name, email, phone, status, is_verified").eq("society_id", societyId).order("vendor_code", { ascending: true }),
    supabase.from("vendor_users").select("vendor_id,user_id,is_primary,is_active").eq("society_id",societyId).eq("is_active",true),
  ]);
  const linksByVendor=new Map<string,Array<{user_id:string;is_primary:boolean}>>();
  for(const link of links??[]) linksByVendor.set(link.vendor_id,[...(linksByVendor.get(link.vendor_id)??[]),{user_id:link.user_id,is_primary:link.is_primary}]);
  const rows=(vendors??[]).map(v=>({...v,portal_users:linksByVendor.get(v.id)??[]}));

  return <VendorsClient vendors={rows} canManage={context.isPlatformAdmin||context.permissions.has(PERMISSIONS.VENDOR_MANAGE)} />;
}
