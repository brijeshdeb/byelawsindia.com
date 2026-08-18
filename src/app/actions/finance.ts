"use server";
import { getServerContext, wrapAction, type ActionResult } from "@/lib/context";
import { writeAudit } from "@/lib/audit";
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

    await writeAudit({
      societyId,
      actorUserId: userId,
      action: "DUE_CREATED",
      entityType: "finance_due",
      entityId: data.id,
      newValues: {
        amount: input.amount,
        due_type: input.dueType,
        due_date: input.dueDate,
        member_id: input.memberId,
      },
    });

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

/**
 * Record a payment against a due.
 *
 * Uses the record_payment PostgreSQL function (migration 011) which:
 *   - Locks the due row to prevent concurrent payment races
 *   - Sums all prior payments for cumulative partial-payment logic
 *   - Rejects overpayments (prior paid + new amount > due amount)
 *   - Inserts the payment record and updates due status atomically
 *     in a single implicit transaction
 *
 * The audit record is written separately after the RPC succeeds,
 * using the admin client so it is never blocked by RLS.
 */
export async function recordPaymentAction(
  input: RecordPaymentInput
): Promise<ActionResult<{ id: string }>> {
  return wrapAction(async () => {
    const { supabase, userId, societyId } = await getServerContext();

    if (input.amountPaid <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }

    const { data: paymentId, error } = await supabase.rpc("record_payment", {
      p_society_id:     societyId,
      p_due_id:         input.dueId,
      p_amount_paid:    input.amountPaid,
      p_payment_method: input.paymentMethod,
      p_payment_date:   input.paymentDate,
      p_reference_no:   input.referenceNumber?.trim() ?? null,
      p_notes:          input.notes?.trim() ?? null,
      p_recorded_by:    userId,
    });

    if (error) {
      // Map PostgreSQL exception messages to user-facing strings.
      const msg = error.message ?? "";
      if (msg.includes("due_not_found")) {
        throw new Error("Due not found or access denied.");
      }
      if (msg.includes("due_already_paid")) {
        throw new Error("This due is already paid.");
      }
      if (msg.includes("due_already_waived")) {
        throw new Error("This due is already waived.");
      }
      if (msg.includes("overpayment")) {
        throw new Error(
          "Payment amount exceeds the outstanding balance. Please check the amount and try again."
        );
      }
      throw new Error(error.message);
    }

    // Audit write via admin client — never blocked by RLS.
    await writeAudit({
      societyId,
      actorUserId: userId,
      action: "PAYMENT_RECORDED",
      entityType: "finance_payment",
      entityId: String(paymentId),
      newValues: {
        due_id:          input.dueId,
        amount_paid:     input.amountPaid,
        payment_method:  input.paymentMethod,
        payment_date:    input.paymentDate,
        reference_number: input.referenceNumber ?? null,
      },
    });

    revalidatePath("/finance/dues");
    revalidatePath("/finance/payments");
    return { id: String(paymentId) };
  });
}
