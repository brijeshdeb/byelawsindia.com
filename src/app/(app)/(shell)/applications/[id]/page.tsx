import { notFound } from "next/navigation";

import { getServerContext } from "@/lib/context";
import { resolveUserContext } from "@/server/services/AccessService";
import { PERMISSIONS } from "@/types";
import { ApplicationDetailClient } from "./ApplicationDetailClient";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, societyId, wingId, userId } = await getServerContext();
  const context = await resolveUserContext(societyId, wingId);

  const [applicationResult, checklistResult, historyResult, approvalResult] = await Promise.all([
    supabase
      .from("member_applications")
      .select(
        "id,application_number,applicant_name,father_spouse_name,applicant_email,applicant_phone,date_of_birth,pan,identity_type,identity_number_masked,correspondence_address,permanent_address,ownership_type,ownership_document_number,ownership_date,share_certificate_number,shares_held,joint_member_details,application_type,status,submitted_at,notes,created_by,metadata,units(unit_number,wings(name))",
      )
      .eq("id", id)
      .eq("society_id", societyId)
      .single(),
    supabase
      .from("application_checklist_items")
      .select(
        "id,item_code,label,is_required,status,remarks,verified_at,document_id",
      )
      .eq("application_id", id)
      .eq("society_id", societyId)
      .order("sort_order"),
    supabase
      .from("application_status_history")
      .select("id,from_status,to_status,comments,changed_at,changed_by,metadata")
      .eq("application_id", id)
      .eq("society_id", societyId)
      .order("changed_at", { ascending: false }),
    supabase
      .from("approval_instances")
      .select(
        "id,status,current_step_order,approval_workflows(name),approval_decisions(id,decision,comments,decided_at,approval_workflow_steps(name,step_order))",
      )
      .eq("entity_type", "MEMBER_APPLICATION")
      .eq("entity_id", id)
      .maybeSingle(),
  ]);

  const application = applicationResult.data;
  if (!application) notFound();

  const checklistRows = checklistResult.data ?? [];
  const documentIds = checklistRows
    .map((item) => item.document_id)
    .filter((documentId): documentId is string => Boolean(documentId));
  const documentsResult = documentIds.length
    ? await supabase
        .from("society_documents")
        .select("id,file_name,status,version,rejection_reason")
        .eq("society_id", societyId)
        .in("id", documentIds)
    : { data: [] };
  const documentsById = new Map(
    (documentsResult.data ?? []).map((document) => [document.id, document]),
  );
  const checklist = checklistRows.map((item) => ({
    ...item,
    society_documents: item.document_id ? documentsById.get(item.document_id) ?? null : null,
  }));

  const approval = approvalResult.data;
  const canVerify =
    context.isPlatformAdmin || context.permissions.has(PERMISSIONS.APPLICATION_VERIFY);
  const canUpload =
    context.isPlatformAdmin || context.permissions.has(PERMISSIONS.DOCUMENT_UPLOAD);
  const step = Number(approval?.current_step_order ?? 0);
  const stepPermission =
    step === 1
      ? PERMISSIONS.APPLICATION_APPROVE_LEVEL1
      : step === 2
        ? PERMISSIONS.APPLICATION_APPROVE_LEVEL2
        : PERMISSIONS.APPLICATION_APPROVE_FINAL;
  const canDecide = !context.isPlatformAdmin && (
    step === 3
      ? context.roleName === "Society Admin" && !context.wingId && context.permissions.has(stepPermission)
      : context.permissions.has(stepPermission)
  );

  return (
    <ApplicationDetailClient
      societyId={societyId}
      application={application as never}
      checklist={checklist}
      history={historyResult.data ?? []}
      approval={approval as never}
      canUpload={canUpload}
      canVerify={canVerify}
      canDecide={canDecide}
      canResubmit={
        application.created_by === userId && application.status === "CORRECTION_REQUIRED"
      }
    />
  );
}
