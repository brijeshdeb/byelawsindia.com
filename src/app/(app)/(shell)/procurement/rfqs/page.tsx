import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { RfqsClient } from "./RfqsClient";

export const metadata: Metadata = { title: "RFQs" };

export default async function RfqsPage() {
  const { supabase, societyId } = await getServerContext();

  const { data: rfqs } = await supabase
    .from("rfqs")
    .select("id, rfq_number, title, category, status, estimated_budget, submission_deadline, created_at")
    .eq("society_id", societyId)
    .order("created_at", { ascending: false });

  return <RfqsClient rfqs={rfqs ?? []} />;
}
