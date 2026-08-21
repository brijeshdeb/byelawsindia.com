import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";
import { PaymentsClient } from "./PaymentsClient";
import { resolveUserContext } from "@/server/services/AccessService";
import { PERMISSIONS } from "@/types";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const { supabase, societyId, wingId, userId } = await getServerContext();
  const context = await resolveUserContext(societyId, wingId);

  const [{ data: paymentsRaw }, { data: refundsRaw }, { data: adjustments }] = await Promise.all([
    supabase.from("finance_payments")
      .select("id, receipt_number, amount_paid, payment_method, payment_date, reference_number, status, reconciliation_status, reconciliation_notes, finance_dues(due_type, members(full_name))")
      .eq("society_id", societyId).order("payment_date", { ascending: false }),
    supabase.from("finance_refunds").select("id, payment_id, refund_number, amount, refund_method, reason, processed_at")
      .eq("society_id", societyId).eq("status", "COMPLETED").order("processed_at", { ascending: false }),
    supabase.from("finance_adjustment_requests")
      .select("id, adjustment_type, payment_id, due_id, amount, payment_method, reason, status, requested_by, requested_at, reviewed_by, reviewed_at, review_notes")
      .eq("society_id", societyId).order("requested_at", { ascending: false }),
  ]);

  const payments = (paymentsRaw ?? []).map((p: any) => ({
    id: p.id,
    amount_paid: p.amount_paid,
    payment_method: p.payment_method,
    payment_date: p.payment_date,
    reference_number: p.reference_number,
    receipt_number: p.receipt_number,
    status: p.status,
    reconciliation_status: p.reconciliation_status,
    reconciliation_notes: p.reconciliation_notes,
    due_type: p.finance_dues?.due_type ?? null,
    member_name: p.finance_dues?.members?.full_name ?? null,
  }));

  return <PaymentsClient payments={payments} refunds={refundsRaw ?? []} adjustments={adjustments ?? []}
    currentUserId={userId} canApprove={!context.isPlatformAdmin && context.permissions.has(PERMISSIONS.FINANCE_ADJUSTMENT_APPROVE)}
    canRequestRefund={!context.isPlatformAdmin && context.permissions.has(PERMISSIONS.FINANCE_PAYMENT_REFUND)} />;
}
