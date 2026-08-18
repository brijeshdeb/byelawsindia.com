"use server";
import { getServerContext, nextSequenceNumber, wrapAction, type ActionResult } from "@/lib/context";
import { resolveUserContext, requirePermission } from "@/server/services/AccessService";
import { PERMISSIONS } from "@/types";
import { revalidatePath } from "next/cache";

export type ComplaintUrgency = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export interface CreateComplaintInput {
  title: string;
  description: string;
  urgency: ComplaintUrgency;
  location?: string;
  unitId?: string;
  reportedByMemberId?: string;
}

export async function createComplaintAction(
  input: CreateComplaintInput
): Promise<ActionResult<{ id: string; complaintNumber: string }>> {
  return wrapAction(async () => {
    const { supabase, userId, societyId, wingId } = await getServerContext();
    const userCtx = await resolveUserContext(societyId, wingId);
    requirePermission(userCtx, PERMISSIONS.MAINTENANCE_MANAGE);

    // Generate the complaint number before insert (required column: complaint_number text not null)
    const complaintNumber = await nextSequenceNumber(supabase, societyId, "COMPLAINT", "COMP");

    const { data, error } = await supabase
      .from("maintenance_complaints")
      .insert({
        society_id: societyId,
        complaint_number: complaintNumber,
        title: input.title.trim(),
        description: input.description.trim(),
        urgency: input.urgency,
        location: input.location?.trim() || null,
        unit_id: input.unitId || null,
        reported_by_member_id: input.reportedByMemberId || null,
        status: "OPEN",
        created_by: userId,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/maintenance/complaints");
    return { id: data.id, complaintNumber };
  });
}

export type WorkOrderPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface CreateMaintenanceWorkOrderInput {
  title: string;
  description: string;
  priority: WorkOrderPriority;
  complaintId?: string;
  vendorId?: string;
  estimatedCost?: number;
  scheduledDate?: string;
}

export async function createMaintenanceWorkOrderAction(
  input: CreateMaintenanceWorkOrderInput
): Promise<ActionResult<{ id: string; workOrderNumber: string }>> {
  return wrapAction(async () => {
    const { supabase, userId, societyId, wingId } = await getServerContext();
    const userCtx = await resolveUserContext(societyId, wingId);
    requirePermission(userCtx, PERMISSIONS.MAINTENANCE_MANAGE);

    // Generate the work order number before insert (required column: work_order_number text not null)
    const workOrderNumber = await nextSequenceNumber(supabase, societyId, "MAINTENANCE_WO", "MWO");

    const { data, error } = await supabase
      .from("maintenance_work_orders")
      .insert({
        society_id: societyId,
        work_order_number: workOrderNumber,
        title: input.title.trim(),
        description: input.description.trim(),
        priority: input.priority,
        complaint_id: input.complaintId || null,
        vendor_id: input.vendorId || null,
        estimated_cost: input.estimatedCost ?? null,
        scheduled_date: input.scheduledDate || null,
        status: "PENDING",
        created_by: userId,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/maintenance/work-orders");
    return { id: data.id, workOrderNumber };
  });
}
