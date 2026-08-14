import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { PaymentsClient } from "./PaymentsClient";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const { supabase, societyId } = await getServerContext();

  const { data: paymentsRaw } = await supabase
    .from("finance_payments")
    .select("id, amount_paid, payment_method, payment_date, reference_number, finance_dues(due_type, members(full_name))")
    .eq("society_id", societyId)
    .order("payment_date", { ascending: false });

  const payments = (paymentsRaw ?? []).map((p: any) => ({
    id: p.id,
    amount_paid: p.amount_paid,
    payment_method: p.payment_method,
    payment_date: p.payment_date,
    reference_number: p.reference_number,
    due_type: p.finance_dues?.due_type ?? null,
    member_name: p.finance_dues?.members?.full_name ?? null,
  }));

  return <PaymentsClient payments={payments} />;
}
