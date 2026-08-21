"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAudit, writeAuditCritical } from "@/lib/audit";
import { getServerContext, nextSequenceNumber, wrapAction, type ActionResult } from "@/lib/context";
import { renderTemplate, templateVariables } from "@/lib/templates/render";
import { resolveUserContext, requirePermission, requireAnyPermission } from "@/server/services/AccessService";
import { PERMISSIONS } from "@/types";
import type { Json } from "@/types/database";

const SERVICE_STATUSES = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "IN_PROGRESS", "COMPLETED", "REJECTED", "CANCELLED"] as const;
type ServiceStatus = (typeof SERVICE_STATUSES)[number];

function required(value: string, label: string, max = 200): string {
  const clean = value.trim();
  if (!clean) throw new Error(`${label} is required.`);
  if (clean.length > max) throw new Error(`${label} must be ${max} characters or fewer.`);
  return clean;
}

export async function createServiceRequestAction(input: {
  requestType: string;
  title: string;
  description?: string;
  memberId?: string;
  unitId?: string;
  wingId?: string;
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  formData?: Record<string, unknown>;
}): Promise<ActionResult<{ id: string; requestNumber: string }>> {
  return wrapAction(async () => {
    const { supabase, societyId, wingId, userId } = await getServerContext();
    const userContext = await resolveUserContext(societyId, wingId);
    requirePermission(userContext, PERMISSIONS.SERVICE_REQUEST_CREATE);

    const requestType = required(input.requestType, "Request type", 80).toUpperCase();
    const { data: allowedType } = await supabase.from("master_data_items")
      .select("id").eq("category", "SERVICE_REQUEST_TYPE").eq("code", requestType)
      .eq("is_active", true).or(`society_id.is.null,society_id.eq.${societyId}`).limit(1).maybeSingle();
    if (!allowedType) throw new Error("Select an active service request type.");

    const requestNumber = await nextSequenceNumber(supabase, societyId, "SERVICE_REQUEST", "SR");
    const { data, error } = await supabase.from("service_requests").insert({
      society_id: societyId,
      request_number: requestNumber,
      request_type: requestType,
      title: required(input.title, "Title"),
      description: input.description?.trim() || null,
      member_id: input.memberId || null,
      unit_id: input.unitId || null,
      wing_id: input.wingId || wingId,
      priority: input.priority ?? "NORMAL",
      status: "SUBMITTED",
      form_data: (input.formData ?? {}) as Json,
      created_by: userId,
      updated_by: userId,
    }).select("id").single();
    if (error) throw new Error(error.message);

    await writeAudit({ societyId, wingId, actorUserId: userId, action: "SERVICE_REQUEST_CREATED", entityType: "service_request", entityId: data.id, newValues: { requestNumber, requestType, status: "SUBMITTED" } });
    revalidatePath("/service-requests");
    return { id: data.id, requestNumber };
  });
}

export async function updateServiceRequestStatusAction(input: {
  id: string;
  status: ServiceStatus;
  resolution?: string;
}): Promise<ActionResult> {
  return wrapAction(async () => {
    const { supabase, societyId, wingId, userId } = await getServerContext();
    const userContext = await resolveUserContext(societyId, wingId);
    const isFinalDecision = input.status === "APPROVED" || input.status === "REJECTED";
    if (userContext.isPlatformAdmin) throw new Error("Platform administrators cannot decide society service requests.");
    if (isFinalDecision) {
      if (userContext.roleName !== "Society Admin" || userContext.wingId) {
        throw new Error("A society-wide Society Admin must approve or reject this request.");
      }
      requirePermission(userContext, PERMISSIONS.SERVICE_REQUEST_APPROVE);
    } else {
      requirePermission(userContext, PERMISSIONS.SERVICE_REQUEST_PROCESS);
    }
    if (!SERVICE_STATUSES.includes(input.status)) throw new Error("Invalid request status.");

    const { data: previous, error: readError } = await supabase.from("service_requests")
      .select("id, status, request_number, created_by").eq("id", input.id).eq("society_id", societyId).single();
    if (readError) throw new Error("Service request was not found.");

    const { error } = await supabase.from("service_requests").update({
      status: input.status,
      resolution: input.resolution?.trim() || null,
      completed_at: input.status === "COMPLETED" ? new Date().toISOString() : null,
      updated_by: userId,
    }).eq("id", input.id).eq("society_id", societyId);
    if (error) throw new Error(error.message);

    if (previous.created_by) {
      await createAdminClient().from("notifications").insert({
        society_id: societyId,
        user_id: previous.created_by,
        notification_type: "SERVICE_REQUEST_STATUS",
        title: `Request ${previous.request_number} updated`,
        message: `Status changed from ${previous.status} to ${input.status}.`,
        entity_type: "service_request",
        entity_id: input.id,
        action_url: "/service-requests",
      });
    }

    await writeAuditCritical({ societyId, wingId, actorUserId: userId, action: "SERVICE_REQUEST_STATUS_CHANGED", entityType: "service_request", entityId: input.id, oldValues: { status: previous.status }, newValues: { status: input.status, resolution: input.resolution ?? null } });
    revalidatePath("/service-requests");
  });
}

export async function saveMasterDataItemAction(input: {
  id?: string; category: string; code: string; label: string; description?: string; sortOrder?: number; isActive?: boolean;
}): Promise<ActionResult<{ id: string }>> {
  return wrapAction(async () => {
    const { supabase, societyId, wingId, userId } = await getServerContext();
    requirePermission(await resolveUserContext(societyId, wingId), PERMISSIONS.ADMIN_MASTER_DATA);
    const values = {
      society_id: societyId,
      category: required(input.category, "Category", 64).toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
      code: required(input.code, "Code", 64).toUpperCase().replace(/[^A-Z0-9_-]/g, "_"),
      label: required(input.label, "Label"),
      description: input.description?.trim() || null,
      sort_order: input.sortOrder ?? 0,
      is_active: input.isActive ?? true,
      updated_by: userId,
    };
    const query = input.id
      ? supabase.from("master_data_items").update(values).eq("id", input.id).eq("society_id", societyId)
      : supabase.from("master_data_items").insert({ ...values, created_by: userId });
    const { data, error } = await query.select("id").single();
    if (error) throw new Error(error.message);
    await writeAudit({ societyId, wingId, actorUserId: userId, action: "MASTER_DATA_UPDATED", entityType: "master_data_item", entityId: data.id, newValues: values });
    revalidatePath("/admin/master-data");
    return { id: data.id };
  });
}

export async function createTemplateVersionAction(input: {
  templateKey: string; name: string; category: string; subject?: string; body: string; outputFormat?: "HTML" | "TEXT" | "PDF" | "DOCX" | "EMAIL"; activate?: boolean;
}): Promise<ActionResult<{ id: string; version: number }>> {
  return wrapAction(async () => {
    const { supabase, societyId, wingId, userId } = await getServerContext();
    requirePermission(await resolveUserContext(societyId, wingId), PERMISSIONS.ADMIN_TEMPLATES);
    const templateKey = required(input.templateKey, "Template key", 80).toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    const [{ data: latest }, variables] = await Promise.all([
      supabase.from("content_templates").select("version").eq("society_id", societyId).eq("template_key", templateKey).order("version", { ascending: false }).limit(1).maybeSingle(),
      Promise.resolve(Array.from(new Set([...templateVariables(input.subject ?? ""), ...templateVariables(input.body)]))),
    ]);
    const version = (latest?.version ?? 0) + 1;
    if (input.activate) {
      await supabase.from("content_templates").update({ status: "ARCHIVED", is_default: false, updated_by: userId })
        .eq("society_id", societyId).eq("template_key", templateKey).eq("status", "ACTIVE");
    }
    const { data, error } = await supabase.from("content_templates").insert({
      society_id: societyId, template_key: templateKey, name: required(input.name, "Name"),
      category: required(input.category, "Category", 40).toUpperCase(), version,
      status: input.activate ? "ACTIVE" : "DRAFT", subject_template: input.subject?.trim() || null,
      body_template: required(input.body, "Body", 20000), variables: variables as Json,
      output_format: input.outputFormat ?? "DOCX", is_default: input.activate ?? false,
      metadata: { draft: !input.activate }, created_by: userId, updated_by: userId,
    }).select("id").single();
    if (error) throw new Error(error.message);
    await writeAudit({ societyId, wingId, actorUserId: userId, action: "TEMPLATE_UPDATED", entityType: "content_template", entityId: data.id, newValues: { templateKey, version, status: input.activate ? "ACTIVE" : "DRAFT" } });
    revalidatePath("/admin/templates");
    return { id: data.id, version };
  });
}

export async function generateDocumentAction(input: {
  templateId: string; title: string; entityType?: string; entityId?: string; values: Record<string, unknown>;
}): Promise<ActionResult<{ id: string; documentNumber: string }>> {
  return wrapAction(async () => {
    const { supabase, societyId, wingId, userId } = await getServerContext();
    const userContext = await resolveUserContext(societyId, wingId);
    requireAnyPermission(userContext, [PERMISSIONS.SERVICE_REQUEST_PROCESS, PERMISSIONS.SERVICE_REQUEST_APPROVE, PERMISSIONS.ADMIN_TEMPLATES]);
    const { data: template, error: templateError } = await supabase.from("content_templates")
      .select("id, name, subject_template, body_template, output_format, status")
      .eq("id", input.templateId).or(`society_id.is.null,society_id.eq.${societyId}`).single();
    if (templateError || !template || template.status !== "ACTIVE") throw new Error("Select an active template.");
    const body = renderTemplate(template.body_template, input.values).output;
    const subject = template.subject_template ? renderTemplate(template.subject_template, input.values).output : null;
    const documentNumber = await nextSequenceNumber(supabase, societyId, "GENERATED_DOCUMENT", "DOC");
    const { data, error } = await supabase.from("generated_documents").insert({
      society_id: societyId, template_id: template.id, document_number: documentNumber,
      title: required(input.title, "Title"), entity_type: input.entityType || null, entity_id: input.entityId || null,
      subject_rendered: subject, body_rendered: body, input_data: input.values as Json,
      output_format: template.output_format, generated_by: userId,
    }).select("id").single();
    if (error) throw new Error(error.message);
    await writeAuditCritical({ societyId, wingId, actorUserId: userId, action: "DOCUMENT_GENERATED", entityType: "generated_document", entityId: data.id, newValues: { documentNumber, templateId: template.id } });
    revalidatePath("/documents");
    return { id: data.id, documentNumber };
  });
}
