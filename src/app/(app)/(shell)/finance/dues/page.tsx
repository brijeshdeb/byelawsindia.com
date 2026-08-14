import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { DuesClient } from "./DuesClient";

export const metadata: Metadata = { title: "Dues" };

export default async function DuesPage() {
  const { supabase, societyId } = await getServerContext();

  const [{ data: duesRaw }, { data: members }] = await Promise.all([
    supabase
      .from("finance_dues")
      .select("id, due_type, amount, due_date, status, description, members(full_name, member_number)")
      .eq("society_id", societyId)
      .order("due_date", { ascending: false }),
    supabase
      .from("members")
      .select("id, full_name, member_number")
      .eq("society_id", societyId)
      .eq("status", "ACTIVE")
      .order("full_name"),
  ]);

  const dues = (duesRaw ?? []).map((d: any) => ({
    id: d.id,
    due_type: d.due_type,
    amount: d.amount,
    due_date: d.due_date,
    status: d.status,
    description: d.description,
    member_name: d.members?.full_name ?? "Unknown",
    member_number: d.members?.member_number ?? "",
  }));

  return <DuesClient dues={dues} members={members ?? []} />;
}
