import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { resolveUserContext } from "@/server/services/AccessService";
import { PERMISSIONS } from "@/types";
import { ServiceRequestsClient } from "./ServiceRequestsClient";

export const metadata: Metadata = { title: "Service Requests" };

export default async function ServiceRequestsPage() {
  const { supabase, societyId, wingId } = await getServerContext();
  const context = await resolveUserContext(societyId, wingId);
  const [{ data: requests }, { data: types }, { data: members }, { data: units },{data:templates},{data:generatedDocuments},{data:statusHistory}] = await Promise.all([
    supabase.from("service_requests").select("id, request_number, request_type, title, description, priority, status, resolution, created_at, members(full_name), units(unit_number), wings(name)").eq("society_id", societyId).order("created_at", { ascending: false }),
    supabase.from("master_data_items").select("code, label").eq("category", "SERVICE_REQUEST_TYPE").eq("is_active", true).or(`society_id.is.null,society_id.eq.${societyId}`).order("sort_order"),
    supabase.from("members").select("id, full_name, unit_id").eq("society_id", societyId).eq("status", "ACTIVE").order("full_name"),
    supabase.from("units").select("id, unit_number, wing_id, wings(name)").eq("society_id", societyId).order("unit_number"),
    supabase.from("content_templates").select("id,society_id,template_key,name").eq("status","ACTIVE").or(`society_id.is.null,society_id.eq.${societyId}`).order("version",{ascending:false}),
    supabase.from("generated_documents").select("id,document_number,title,entity_id,generated_at").eq("society_id",societyId).eq("entity_type","service_request").order("generated_at",{ascending:false}),
    supabase.from("service_request_status_history").select("id,request_id,from_status,to_status,resolution,changed_at").eq("society_id",societyId).order("changed_at",{ascending:false}),
  ]);

  return <ServiceRequestsClient
    requests={(requests ?? []) as any}
    requestTypes={types ?? []}
    members={members ?? []}
    units={(units ?? []) as any}
    templates={templates??[]}
    generatedDocuments={generatedDocuments??[]}
    statusHistory={statusHistory??[]}
    societyName={context.societyName}
    canCreate={!context.isPlatformAdmin && context.permissions.has(PERMISSIONS.SERVICE_REQUEST_CREATE)}
    canProcess={!context.isPlatformAdmin && context.permissions.has(PERMISSIONS.SERVICE_REQUEST_PROCESS)}
    canApprove={!context.isPlatformAdmin && context.roleName === "Society Admin" && !context.wingId && context.permissions.has(PERMISSIONS.SERVICE_REQUEST_APPROVE)}
  />;
}
