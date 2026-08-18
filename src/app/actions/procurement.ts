"use server";
import { getServerContext, nextSequenceNumber, wrapAction, type ActionResult } from "@/lib/context";
import { resolveUserContext, requirePermission } from "@/server/services/AccessService";
import { PERMISSIONS } from "@/types";
import { revalidatePath } from "next/cache";

export type RfqCategory =
  | "CIVIL"
  | "ELECTRICAL"
  | "PLUMBING"
  | "SECURITY"
  | "HOUSEKEEPING"
  | "IT"
  | "LANDSCAPING"
  | "GENERAL"
  | "OTHER";

export interface CreateRfqInput {
  title: string;
  category: RfqCategory;
  description: string;
  estimatedBudget?: number;
  submissionDeadline?: string;
  notes?: string;
}

export async function createRfqAction(
  input: CreateRfqInput
): Promise<ActionResult<{ id: string; rfqNumber: string }>> {
  return wrapAction(async () => {
    const { supabase, userId, societyId, wingId } = await getServerContext();
    const userCtx = await resolveUserContext(societyId, wingId);
    requirePermission(userCtx, PERMISSIONS.RFQ_CREATE);

    const rfqNumber = await nextSequenceNumber(supabase, societyId, "RFQ", "RFQ");

    const { data, error } = await supabase
      .from("rfqs")
      .insert({
        society_id: societyId,
        rfq_number: rfqNumber,
        title: input.title.trim(),
        category: input.category,
        description: input.description.trim(),
        estimated_budget: input.estimatedBudget ?? null,
        submission_deadline: input.submissionDeadline || null,
        status: "DRAFT",
        notes: input.notes?.trim() || null,
        created_by: userId,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/procurement/rfqs");
    return { id: data.id, rfqNumber };
  });
}

export interface CreateProcurementWorkOrderInput {
  title: string;
  vendorId: string;
  rfqId?: string;
  contractId?: string;
  amount: number;
  description: string;
  startDate?: string;
  completionDate?: string;
}

export async function createProcurementWorkOrderAction(
  input: CreateProcurementWorkOrderInput
): Promise<ActionResult<{ id: string; workOrderNumber: string }>> {
  return wrapAction(async () => {
    const { supabase, userId, societyId, wingId } = await getServerContext();
    const userCtx = await resolveUserContext(societyId, wingId);
    requirePermission(userCtx, PERMISSIONS.WORK_ORDER_CREATE);

    const workOrderNumber = await nextSequenceNumber(supabase, societyId, "WORK_ORDER", "WO");

    if (input.amount <= 0) {
      throw new Error("Amount must be greater than zero.");
    }

    const { data, error } = await supabase
      .from("procurement_work_orders")
      .insert({
        society_id: societyId,
        work_order_number: workOrderNumber,
        title: input.title.trim(),
        vendor_id: input.vendorId,
        rfq_id: input.rfqId || null,
        contract_id: input.contractId || null,
        amount: input.amount,
        description: input.description.trim(),
        start_date: input.startDate || null,
        completion_date: input.completionDate || null,
        status: "DRAFT",
        created_by: userId,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/procurement/work-orders");
    return { id: data.id, workOrderNumber };
  });
}

export interface CreateContractInput {
  title: string;
  vendorId: string;
  rfqId?: string;
  value: number;
  startDate: string;
  endDate?: string;
  description?: string;
}

export async function createContractAction(
  input: CreateContractInput
): Promise<ActionResult<{ id: string; contractNumber: string }>> {
  return wrapAction(async () => {
    const { supabase, userId, societyId, wingId } = await getServerContext();
    const userCtx = await resolveUserContext(societyId, wingId);
    requirePermission(userCtx, PERMISSIONS.CONTRACT_CREATE);

    const contractNumber = await nextSequenceNumber(supabase, societyId, "CONTRACT", "CNT");

    if (input.value <= 0) {
      throw new Error("Contract value must be greater than zero.");
    }

    const { data, error } = await supabase
      .from("contracts")
      .insert({
        society_id: societyId,
        contract_number: contractNumber,
        title: input.title.trim(),
        vendor_id: input.vendorId,
        rfq_id: input.rfqId || null,
        value: input.value,
        start_date: input.startDate,
        end_date: input.endDate || null,
        description: input.description?.trim() || null,
        status: "DRAFT",
        created_by: userId,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/procurement/contracts");
    return { id: data.id, contractNumber };
  });
}
