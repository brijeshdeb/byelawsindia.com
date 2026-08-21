import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { ContractsClient } from "./ContractsClient";
import { resolveUserContext } from "@/server/services/AccessService";
import { PERMISSIONS } from "@/types";

export const metadata: Metadata = { title: "Contracts" };

export default async function ContractsPage() {
  const { supabase, societyId, wingId } = await getServerContext();
  const context=await resolveUserContext(societyId,wingId);

  const [{ data: contractsRaw }, { data: vendors }, { data: rfqs }, {data:renewals}] = await Promise.all([
    supabase
      .from("contracts")
      .select("id, contract_number, title, value, status, start_date, end_date, vendors(name)")
      .eq("society_id", societyId)
      .order("created_at", { ascending: false }),
    supabase
      .from("vendors")
      .select("id, name")
      .eq("society_id", societyId)
      .eq("status", "ACTIVE")
      .order("name"),
    supabase
      .from("rfqs")
      .select("id, rfq_number, title")
      .eq("society_id", societyId)
      .in("status", ["AWARDED", "EVALUATION"])
      .order("rfq_number"),
    supabase.from("contract_renewals").select("id,contract_id,renewal_number,status,current_end_date,proposed_start_date,proposed_end_date,proposed_value,vendor_comments,society_comments,response_due_at,created_at,contracts(title),vendors(name)").eq("society_id",societyId).order("created_at",{ascending:false}),
  ]);

  const contracts = (contractsRaw ?? []).map((c: any) => ({
    id: c.id,
    contract_number: c.contract_number,
    title: c.title,
    value: c.value,
    status: c.status,
    start_date: c.start_date,
    end_date: c.end_date,
    vendor_name: c.vendors?.name ?? null,
  }));

  return <ContractsClient contracts={contracts} vendors={vendors ?? []} rfqs={rfqs ?? []} renewals={(renewals??[]) as any}
    canInitiateRenewals={!context.isPlatformAdmin&&context.permissions.has(PERMISSIONS.CONTRACT_RENEWAL_MANAGE)}
    canDecideRenewals={!context.isPlatformAdmin&&context.roleName==="Society Admin"&&!context.wingId&&context.permissions.has(PERMISSIONS.CONTRACT_RENEWAL_MANAGE)} />;
}
