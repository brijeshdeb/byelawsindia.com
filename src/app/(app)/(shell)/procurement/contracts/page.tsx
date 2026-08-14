import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { ContractsClient } from "./ContractsClient";

export const metadata: Metadata = { title: "Contracts" };

export default async function ContractsPage() {
  const { supabase, societyId } = await getServerContext();

  const [{ data: contractsRaw }, { data: vendors }, { data: rfqs }] = await Promise.all([
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

  return <ContractsClient contracts={contracts} vendors={vendors ?? []} rfqs={rfqs ?? []} />;
}
