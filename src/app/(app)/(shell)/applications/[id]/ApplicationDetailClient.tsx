"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  attachApplicationDocumentAction,
  decideMemberApplicationAction,
  resubmitMemberApplicationAction,
  reviewApplicationChecklistAction,
} from "@/app/actions/applications";
import { createClient } from "@/lib/supabase/client";

const pretty = (value: string) =>
  value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^./, (character) => character.toUpperCase());

type Application = {
  id: string;
  application_number: string;
  applicant_name: string;
  father_spouse_name: string | null;
  applicant_email: string | null;
  applicant_phone: string | null;
  date_of_birth: string | null;
  pan: string | null;
  identity_type: string | null;
  identity_number_masked: string | null;
  correspondence_address: string | null;
  permanent_address: string | null;
  ownership_type: string | null;
  ownership_document_number: string | null;
  ownership_date: string | null;
  share_certificate_number: string | null;
  shares_held: number | null;
  joint_member_details: Array<{fullName?:string;relationship?:string;ownershipShare?:number}>;
  application_type: string;
  status: string;
  submitted_at: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  units?: { unit_number: string; wings?: { name: string } | null } | null;
};

type ChecklistDocument = {
  id: string;
  file_name: string | null;
  status: string;
  version: number;
  rejection_reason: string | null;
};

type ChecklistItem = {
  id: string;
  item_code: string;
  label: string;
  is_required: boolean;
  status: string;
  remarks: string | null;
  verified_at: string | null;
  document_id: string | null;
  society_documents: ChecklistDocument | null;
};

type HistoryItem = {
  id: string;
  from_status: string | null;
  to_status: string;
  comments: string | null;
  changed_at: string;
  changed_by: string | null;
};

type Approval = {
  current_step_order: number;
  status: string;
} | null;

type Props = {
  societyId: string;
  application: Application;
  checklist: ChecklistItem[];
  history: HistoryItem[];
  approval: Approval;
  canUpload: boolean;
  canVerify: boolean;
  canDecide: boolean;
  canResubmit: boolean;
};

const CLOSED_STATUSES = new Set(["APPROVED", "REJECTED", "WITHDRAWN"]);

export function ApplicationDetailClient({
  societyId,
  application,
  checklist,
  history,
  approval,
  canUpload,
  canVerify,
  canDecide,
  canResubmit,
}: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [comments, setComments] = useState("");
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [uploadingItem, setUploadingItem] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function review(itemId: string, status: "VERIFIED" | "REJECTED") {
    const remarks = status === "REJECTED" ? window.prompt("Replacement reason")?.trim() : "";
    if (status === "REJECTED" && !remarks) return;
    startTransition(async () => {
      const result = await reviewApplicationChecklistAction({ itemId, status, remarks });
      setMessage(result.success ? `Checklist item ${pretty(status)}.` : result.error);
    });
  }

  function decide(decision: "APPROVED" | "REJECTED" | "RETURNED") {
    startTransition(async () => {
      const result = await decideMemberApplicationAction({
        applicationId: application.id,
        decision,
        comments,
      });
      setMessage(
        result.success ? `Application is now ${pretty(result.data.status)}.` : result.error,
      );
    });
  }

  function resubmit() {
    startTransition(async () => {
      const result = await resubmitMemberApplicationAction({
        applicationId: application.id,
        comments,
      });
      setMessage(result.success ? "Application resubmitted." : result.error);
    });
  }

  async function upload(item: ChecklistItem) {
    const file = files[item.id];
    if (!file) {
      setMessage("Choose a file before uploading.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setMessage("The file must be 20 MB or smaller.");
      return;
    }

    setUploadingItem(item.id);
    setMessage("");
    const supabase = createClient();
    const extension = (file.name.split(".").pop() ?? "bin").replace(/[^a-z0-9]/gi, "");
    const storagePath = `${societyId}/applications/${application.id}/${item.id}/${crypto.randomUUID()}.${extension}`;

    try {
      const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      const checksumSha256 = Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      const { error: uploadError } = await supabase.storage
        .from("society-documents")
        .upload(storagePath, file, { upsert: false });
      if (uploadError) throw new Error(uploadError.message);

      const result = await attachApplicationDocumentAction({
        applicationId: application.id,
        checklistItemId: item.id,
        storagePath,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        checksumSha256,
      });
      if (!result.success) {
        await supabase.storage.from("society-documents").remove([storagePath]);
        throw new Error(result.error);
      }

      setFiles((current) => ({ ...current, [item.id]: null }));
      setMessage(item.document_id ? "Replacement uploaded for verification." : "Document uploaded for verification.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Document upload failed.");
    } finally {
      setUploadingItem(null);
    }
  }

  const uploadOpen = canUpload && !CLOSED_STATUSES.has(application.status);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="font-mono text-sm text-[#10B981]">{application.application_number}</p>
          <h1 className="mt-1 text-3xl font-bold text-text-primary">{application.applicant_name}</h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            {pretty(application.application_type)} · {application.units?.wings?.name ?? ""}{" "}
            {application.units?.unit_number ?? ""}
          </p>
        </div>
        <span className="h-fit rounded border border-[#444] px-3 py-1.5 text-sm text-[#D1D5DB]">
          {pretty(application.status)}
        </span>
      </div>

      {message ? (
        <p
          role="status"
          className="mb-4 rounded border border-[#333] bg-[#1c1b1b] px-4 py-3 text-sm text-[#D1D5DB]"
        >
          {message}
        </p>
      ) : null}

      {application.application_type === "MEMBERSHIP" ? (
        <section className="queue-section mb-5 p-5">
          <h2 className="font-semibold text-text-primary">Membership record</h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Detail label="Father / spouse" value={application.father_spouse_name} />
            <Detail label="Date of birth" value={application.date_of_birth ? new Date(application.date_of_birth).toLocaleDateString("en-IN") : null} />
            <Detail label="PAN" value={application.pan} />
            <Detail label="Identity" value={[application.identity_type ? pretty(application.identity_type) : null, application.identity_number_masked].filter(Boolean).join(" · ")} />
            <Detail label="Ownership" value={application.ownership_type ? pretty(application.ownership_type) : null} />
            <Detail label="Ownership document" value={application.ownership_document_number} />
            <Detail label="Share certificate" value={application.share_certificate_number} />
            <Detail label="Shares held" value={application.shares_held?.toString()} />
          </dl>
          <div className="mt-4 grid gap-4 text-sm md:grid-cols-2"><Detail label="Correspondence address" value={application.correspondence_address} /><Detail label="Permanent address" value={application.permanent_address} /></div>
          {application.joint_member_details?.length ? <div className="mt-4 border-t border-[#333] pt-4"><p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Joint members</p>{application.joint_member_details.map((joint,index)=><p key={`${joint.fullName}-${index}`} className="mt-2 text-sm text-[#D1D5DB]">{joint.fullName ?? `Joint member ${index+1}`}{joint.relationship ? ` · ${joint.relationship}` : ""}{joint.ownershipShare !== undefined ? ` · ${joint.ownershipShare}%` : ""}</p>)}</div> : null}
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="queue-section lg:col-span-2">
          <div className="border-b border-[#333] px-5 py-4">
            <h2 className="font-semibold text-text-primary">Document checklist</h2>
            <p className="mt-1 text-xs text-[#6B7280]">
              Download a blank framework, upload the signed/supporting document, then verify it.
            </p>
          </div>
          {checklist.map((item) => {
            const document = item.society_documents;
            return (
              <div key={item.id} className="border-b border-[#292929] px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-text-primary">
                      {item.label}
                      {item.is_required ? <span className="ml-1 text-[#EF4444]">*</span> : null}
                    </p>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      {item.remarks ?? pretty(item.status)}
                    </p>
                    {document?.rejection_reason ? (
                      <p className="mt-1 text-xs text-[#EF4444]">{document.rejection_reason}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded border border-[#444] px-2 py-1 text-xs text-[#9CA3AF]">
                      {pretty(item.status)}
                    </span>
                    <a
                      href={`/api/applications/${application.id}/checklist/${item.id}/blank-form`}
                      className="rounded border border-[#444] px-2 py-1 text-xs text-[#D1D5DB]"
                    >
                      Blank PDF
                    </a>
                    {document ? (
                      <a
                        href={`/api/documents/${document.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded border border-[#444] px-2 py-1 text-xs text-[#D1D5DB]"
                      >
                        View v{document.version}
                      </a>
                    ) : null}
                    {canVerify && document ? (
                      <>
                        <button
                          disabled={pending}
                          onClick={() => review(item.id, "VERIFIED")}
                          className="rounded border border-[#10B981] px-2 py-1 text-xs text-[#10B981]"
                        >
                          Verify
                        </button>
                        <button
                          disabled={pending}
                          onClick={() => review(item.id, "REJECTED")}
                          className="rounded border border-[#EF4444] px-2 py-1 text-xs text-[#EF4444]"
                        >
                          Request replacement
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                {uploadOpen ? (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={(event) =>
                        setFiles((current) => ({
                          ...current,
                          [item.id]: event.target.files?.[0] ?? null,
                        }))
                      }
                      className="min-w-0 flex-1 rounded border border-[#333] bg-[#171717] px-3 py-2 text-xs text-[#9CA3AF]"
                    />
                    <button
                      type="button"
                      disabled={!files[item.id] || uploadingItem === item.id}
                      onClick={() => upload(item)}
                      className="rounded bg-[#10B981] px-3 py-2 text-xs text-white disabled:opacity-50"
                    >
                      {uploadingItem === item.id
                        ? "Uploading..."
                        : document
                          ? "Upload replacement"
                          : "Upload signed/supporting file"}
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </section>

        <aside className="queue-section p-5">
          <h2 className="font-semibold text-text-primary">Approval</h2>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            {approval
              ? `Stage ${approval.current_step_order} of 3 · ${pretty(approval.status)}`
              : "Workflow not started"}
          </p>
          {canDecide || canResubmit ? (
            <>
              <textarea
                value={comments}
                onChange={(event) => setComments(event.target.value)}
                rows={3}
                placeholder="Decision remarks"
                className="mt-4 w-full rounded border border-[#333] bg-[#171717] px-3 py-2 text-sm text-text-primary"
              />
              {canDecide ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    disabled={pending}
                    onClick={() => decide("APPROVED")}
                    className="rounded bg-[#10B981] px-3 py-2 text-xs text-white"
                  >
                    Approve stage
                  </button>
                  <button
                    disabled={pending}
                    onClick={() => decide("RETURNED")}
                    className="rounded border border-[#F59E0B] px-3 py-2 text-xs text-[#F59E0B]"
                  >
                    Request correction
                  </button>
                  <button
                    disabled={pending}
                    onClick={() => decide("REJECTED")}
                    className="rounded border border-[#EF4444] px-3 py-2 text-xs text-[#EF4444]"
                  >
                    Reject
                  </button>
                </div>
              ) : null}
              {canResubmit ? (
                <button
                  disabled={pending}
                  onClick={resubmit}
                  className="mt-3 rounded bg-[#10B981] px-3 py-2 text-xs text-white"
                >
                  Resubmit corrected application
                </button>
              ) : null}
            </>
          ) : null}
        </aside>
      </div>

      <section className="queue-section mt-5">
        <div className="border-b border-[#333] px-5 py-4">
          <h2 className="font-semibold text-text-primary">Application timeline</h2>
        </div>
        {history.map((item) => (
          <div key={item.id} className="border-b border-[#292929] px-5 py-3">
            <div className="flex justify-between gap-3">
              <p className="text-sm text-text-primary">{pretty(item.to_status)}</p>
              <time className="text-xs text-[#6B7280]">
                {new Date(item.changed_at).toLocaleString("en-IN")}
              </time>
            </div>
            {item.comments ? (
              <p className="mt-1 text-sm text-[#9CA3AF]">{item.comments}</p>
            ) : null}
          </div>
        ))}
      </section>
    </div>
  );
}

function Detail({label,value}:{label:string;value:string|null|undefined}) {
  return <div><dt className="text-xs text-[#6B7280]">{label}</dt><dd className="mt-1 text-[#D1D5DB]">{value || "—"}</dd></div>;
}
