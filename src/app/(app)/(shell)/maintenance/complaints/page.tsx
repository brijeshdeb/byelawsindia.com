import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { ComplaintsClient } from "./ComplaintsClient";

export const metadata: Metadata = { title: "Complaints" };

export default async function ComplaintsPage() {
  const { supabase, societyId } = await getServerContext();

  const { data: complaints } = await supabase
    .from("maintenance_complaints")
    .select("id, title, urgency, status, location, created_at")
    .eq("society_id", societyId)
    .order("created_at", { ascending: false });

  return <ComplaintsClient complaints={complaints ?? []} />;
}
