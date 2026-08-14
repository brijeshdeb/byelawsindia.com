"use server";
import { getServerContext, wrapAction, type ActionResult } from "@/lib/context";
import { revalidatePath } from "next/cache";

export type DueType = "MAINTENANCE" | "SPECIAL_LEVY" | "PARKING" | "WATER" | "SINKING_FUND" | "OTHER";

export interface CreateDueInput {
  memberId: string;
  unitId?: string;
  dueType: DueType;
  amount: number;
  dueDate: string; // ISO date
  description?: string;
  periodFrom?: string;
  periodTo?: string;
}

export async function createDueAction(
  input: CreateDueInput
): Promise<ActionResult<{ id: string }>> {
  return wrapAction(async () => {
    const { supabase, userId, societyId } = await getServerContext();

    if (input.amount <= 0) {
      throw new Error("Amount must be greater than zero.");
    }

    const { data, error } = await supabase
      .from("finance_dues")
      .insert({
        society_id: societyId,
        member_id: input.memberId,
        unit_id: input.unitId || null,
        due_type: input.dueType,
        amount: input.amount,
        due_date: input.dueDate,
        description: input.description?.trim() || null,
        period_from: input.periodFrom || null,
        period_to: input.periodTo || null,
        status: "UNPAID",
        created_by: userId,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/finance/dues");
    return { id: data.id };
  });
}

export type PaymentMethod = "CASH" | "CHEQUE" | "BANK_TRANSFER" | "UPI" | "NEFT" | "RTGS" | "OTHER";

export interface RecordPaymentInput {
  dueId: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  paymentDate: string; // ISO date
  referenceNumber?: string;
  notes?: string;
}

export async function recordPaymentAction(
  input: RecordPaymentInput
): Promise<ActionResult<{ id: string }>> {
  return wrapAction(async () => {
    const { supabase, userId, societyId } = await getServerContext();

    if (input.amountPaid <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }

    // Fetch the due to validate it belongs to this society and get current state
    const { data: due, error: dueError } = await supabase
      .from("finance_dues")
      .select("id, amount, status, society_id")
      .eq("id", input.dueId)
      .eq("society_id", societyId)
      .single();

    if (dueError || !due) {
      throw new Error("Due not found or access denied.");
    }

    if (due.status === "PAID" || due.status === "WAIVED") {
      throw new Error(`This due is already ${due.status.toLowerCase()}.`);
    }

    // Insert payment record
    const { data: payment, error: payError } = await supabase
      .from("finance_payments")
      .insert({
        society_id: societyId,
        due_id: input.dueId,
        amount_paid: input.amountPaid,
        payment_method: input.paymentMethod,
        payment_date: input.paymentDate,
        reference_number: input.referenceNumber?.trim() || null,
        notes: input.notes?.trim() || null,
        recorded_by: userId,
      })
      .select("id")
      .single();

    if (payError) throw new Error(payError.message);

    // Update due status
    const newStatus = input.amountPaid >= due.amount ? "PAID" : "PARTIALLY_PAID";
    await supabase
      .from("finance_dues")
      .update({ status: newStatus })
      .eq("id", input.dueId)
      .eq("society_id", societyId);

    revalidatePath("/finance/dues");
    revalidatePath("/finance/payments");
    return { id: payment.id };
  });
}
