import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { MasterDataClient } from "./MasterDataClient";

export const metadata: Metadata = { title: "Master Data" };

export default async function MasterDataPage() {
  const { supabase, societyId } = await getServerContext();
  const { data } = await supabase.from("master_data_items")
    .select("id, society_id, category, code, label, description, sort_order, is_active")
    .or(`society_id.is.null,society_id.eq.${societyId}`).order("category").order("sort_order");
  return <MasterDataClient items={data ?? []} />;
}
