import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { DuesClient } from "./DuesClient";
import { resolveUserContext } from "@/server/services/AccessService";
import { PERMISSIONS } from "@/types";

export const metadata: Metadata = { title: "Dues" };

export default async function DuesPage() {
  const { supabase, societyId, wingId } = await getServerContext();
  const context = await resolveUserContext(societyId, wingId);

  const [{ data: duesRaw }, { data: members }, { data: payments }, { data: refunds }] = await Promise.all([
    supabase
      .from("finance_dues")
      .select("id, due_type, amount, waived_amount, waiver_reason, due_date, status, description, members(full_name, member_number)")
      .eq("society_id", societyId)
      .order("due_date", { ascending: false }),
    supabase
      .from("members")
      .select("id, full_name, member_number")
      .eq("society_id", societyId)
      .eq("status", "ACTIVE")
      .order("full_name"),
    supabase.from("finance_payments").select("id, due_id, amount_paid").eq("society_id", societyId),
    supabase.from("finance_refunds").select("payment_id, amount").eq("society_id", societyId).eq("status", "COMPLETED"),
  ]);

  const refundedByPayment = new Map<string,number>();
  for (const refund of refunds ?? []) refundedByPayment.set(refund.payment_id,(refundedByPayment.get(refund.payment_id)??0)+refund.amount);
  const paidByDue = new Map<string,number>();
  for (const payment of payments ?? []) if(payment.due_id) paidByDue.set(payment.due_id,(paidByDue.get(payment.due_id)??0)+payment.amount_paid-(refundedByPayment.get(payment.id)??0));

  const dues = (duesRaw ?? []).map((d: any) => ({
    id: d.id,
    due_type: d.due_type,
    amount: d.amount,
    waived_amount: d.waived_amount ?? 0,
    outstanding_amount: Math.max(0,d.amount-(d.waived_amount??0)-(paidByDue.get(d.id)??0)),
    waiver_reason: d.waiver_reason,
    due_date: d.due_date,
    status: d.status,
    description: d.description,
    member_name: d.members?.full_name ?? "Unknown",
    member_number: d.members?.member_number ?? "",
  }));

  return <DuesClient dues={dues} members={members ?? []} canWaive={!context.isPlatformAdmin && context.permissions.has(PERMISSIONS.FINANCE_DUE_WAIVE)} />;
}
