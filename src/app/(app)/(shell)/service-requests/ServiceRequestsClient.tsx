"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createServiceRequestAction, generateDocumentAction, updateServiceRequestStatusAction } from "@/app/actions/release-foundations";

type RequestRow = { id: string; request_number: string; request_type: string; title: string; description: string | null; priority: string; status: string; resolution: string | null; created_at: string; members?: { full_name: string } | null; units?: { unit_number: string } | null; wings?: { name: string } | null };
type Option = { code: string; label: string };
type MemberOption = { id: string; full_name: string; unit_id: string | null };
type UnitOption = { id: string; unit_number: string; wing_id: string; wings?: { name: string } | null };
type TemplateOption={id:string;society_id:string|null;template_key:string;name:string};
type GeneratedDocument={id:string;document_number:string;title:string;entity_id:string|null;generated_at:string};
type StatusHistory={id:string;request_id:string;from_status:string|null;to_status:string;resolution:string|null;changed_at:string};

const badge: Record<string, string> = { SUBMITTED: "#818CF8", UNDER_REVIEW: "#F59E0B", APPROVED: "#10B981", IN_PROGRESS: "#38BDF8", COMPLETED: "#10B981", REJECTED: "#EF4444", CANCELLED: "#6B7280" };
const pretty = (value: string) => value.toLowerCase().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

export function ServiceRequestsClient({ requests, requestTypes, members, units,templates,generatedDocuments,statusHistory,societyName, canCreate, canProcess, canApprove }: { requests: RequestRow[]; requestTypes: Option[]; members: MemberOption[]; units: UnitOption[]; templates:TemplateOption[];generatedDocuments:GeneratedDocument[];statusHistory:StatusHistory[];societyName:string; canCreate: boolean; canProcess: boolean; canApprove: boolean }) {
  const router=useRouter();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const typeLabels = useMemo(() => Object.fromEntries(requestTypes.map((item) => [item.code, item.label])), [requestTypes]);

  function submit(formData: FormData) {
    setMessage("");
    startTransition(async () => {
      const result = await createServiceRequestAction({
        requestType: String(formData.get("requestType") ?? ""), title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""), memberId: String(formData.get("memberId") ?? "") || undefined,
        unitId: String(formData.get("unitId") ?? "") || undefined, priority: String(formData.get("priority") ?? "NORMAL") as "LOW" | "NORMAL" | "HIGH" | "URGENT",
      });
      if (!result.success) return setMessage(result.error);
      setMessage(`Request ${result.data.requestNumber} created.`); setShowForm(false);
    });
  }

  function changeStatus(id: string, status: "UNDER_REVIEW" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED") {
    setMessage(""); startTransition(async () => {
      const result = await updateServiceRequestStatusAction({ id, status });
      setMessage(result.success ? `Request moved to ${pretty(status)}.` : result.error);
    });
  }

  function generate(row:RequestRow){
    const templateKey=row.request_type==="DOMESTIC_HELP"?"DOMESTIC_HELP_ACK":row.request_type==="NOMINATION"?"NOMINATION_ACK":row.request_type==="ASSOCIATE_MEMBER"?"ASSOCIATE_MEMBER_ACK":row.request_type;
    const template=templates.find((item)=>item.template_key===templateKey&&item.society_id)||templates.find((item)=>item.template_key===templateKey);
    if(!template){setMessage(`No active ${pretty(templateKey)} template is configured.`);return;}
    startTransition(async()=>{
      const result=await generateDocumentAction({templateId:template.id,title:`${row.request_number} - ${row.title}`,entityType:"service_request",entityId:row.id,values:{request_number:row.request_number,member_name:row.members?.full_name??"Member",associate_name:row.members?.full_name??"Applicant",unit_number:row.units?.unit_number??"Unit",unit_address:row.units?.unit_number??"Unit",society_name:societyName,bank_name:"Bank",status:row.status,remarks:row.resolution??""}});
      setMessage(result.success?`Document ${result.data.documentNumber} generated.`:result.error);
      if(result.success)router.refresh();
    });
  }

  const inputClass = "w-full rounded px-3 py-2 text-sm text-text-primary bg-[#171717] border border-[#333]";
  return <div className="page-container">
    <div className="page-header"><div><h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">Service Requests</h1><p className="font-body-sm text-body-sm mt-1 text-[#9CA3AF]">Letters, NOCs, member services and approvals</p></div>{canCreate && <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded text-sm font-medium bg-[#10B981] text-white">{showForm ? "Close" : "New Request"}</button>}</div>
    {message && <p className="mb-4 rounded border border-[#333] bg-[#1c1b1b] px-4 py-3 text-sm text-[#D1D5DB]" role="status">{message}</p>}
    {showForm && <form action={submit} className="queue-section p-5 mb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
      <label className="text-sm text-[#9CA3AF]">Request type<select name="requestType" required className={`${inputClass} mt-1`}><option value="">Select type</option>{requestTypes.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
      <label className="text-sm text-[#9CA3AF]">Priority<select name="priority" className={`${inputClass} mt-1`}>{["LOW","NORMAL","HIGH","URGENT"].map((p) => <option key={p}>{p}</option>)}</select></label>
      <label className="text-sm text-[#9CA3AF]">Member<select name="memberId" className={`${inputClass} mt-1`}><option value="">Not linked</option>{members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}</select></label>
      <label className="text-sm text-[#9CA3AF]">Unit<select name="unitId" className={`${inputClass} mt-1`}><option value="">Not linked</option>{units.map((u) => <option key={u.id} value={u.id}>{u.wings?.name ? `${u.wings.name} · ` : ""}{u.unit_number}</option>)}</select></label>
      <label className="text-sm text-[#9CA3AF] md:col-span-2">Title<input name="title" required maxLength={200} className={`${inputClass} mt-1`} /></label>
      <label className="text-sm text-[#9CA3AF] md:col-span-2">Details<textarea name="description" rows={3} className={`${inputClass} mt-1`} /></label>
      <div className="md:col-span-2"><button disabled={pending} className="px-4 py-2 rounded text-sm font-medium bg-[#10B981] text-white disabled:opacity-50">{pending ? "Saving..." : "Submit Request"}</button></div>
    </form>}
    <div className="space-y-4">{requests.length === 0 ? <div className="queue-section py-16 text-center text-sm text-[#6B7280]">No service requests yet.</div> : requests.map((row) => <article key={row.id} className="queue-section p-5">
      <div className="flex flex-wrap justify-between gap-3"><div><p className="font-mono text-xs text-[#10B981]">{row.request_number}</p><h2 className="mt-1 text-base font-semibold text-text-primary">{row.title}</h2><p className="mt-1 text-sm text-[#9CA3AF]">{typeLabels[row.request_type] ?? pretty(row.request_type)} · {pretty(row.priority)}{row.members?.full_name ? ` · ${row.members.full_name}` : ""}</p></div><span className="h-fit rounded border px-2 py-1 text-xs" style={{ color: badge[row.status] ?? "#9CA3AF", borderColor: badge[row.status] ?? "#444" }}>{pretty(row.status)}</span></div>
      {row.description && <p className="mt-3 text-sm text-[#D1D5DB]">{row.description}</p>}
      {(canProcess || canApprove) && !["COMPLETED","REJECTED","CANCELLED"].includes(row.status) && <div className="mt-4 flex flex-wrap gap-2">{canProcess && <>{row.status === "SUBMITTED" && <button onClick={() => changeStatus(row.id,"UNDER_REVIEW")} disabled={pending} className="rounded border border-[#444] px-3 py-1.5 text-xs text-[#D1D5DB]">Start review</button>}{["APPROVED","UNDER_REVIEW"].includes(row.status) && <button onClick={() => changeStatus(row.id,"IN_PROGRESS")} disabled={pending} className="rounded border border-[#444] px-3 py-1.5 text-xs text-[#D1D5DB]">Start work</button>}{row.status === "IN_PROGRESS" && <button onClick={() => changeStatus(row.id,"COMPLETED")} disabled={pending} className="rounded border border-[#10B981] px-3 py-1.5 text-xs text-[#10B981]">Complete</button>}</>}{canApprove && row.status === "UNDER_REVIEW" && <><button onClick={() => changeStatus(row.id,"APPROVED")} disabled={pending} className="rounded bg-[#10B981] px-3 py-1.5 text-xs text-white">Approve</button><button onClick={() => changeStatus(row.id,"REJECTED")} disabled={pending} className="rounded border border-[#EF4444] px-3 py-1.5 text-xs text-[#EF4444]">Reject</button></>}</div>}
      {["APPROVED","IN_PROGRESS","COMPLETED"].includes(row.status)&&(canProcess||canApprove)&&<div className="mt-4 flex flex-wrap items-center gap-2"><button disabled={pending} onClick={()=>generate(row)} className="rounded border border-[#10B981] px-3 py-1.5 text-xs text-[#10B981]">Generate letter / form</button>{generatedDocuments.filter((document)=>document.entity_id===row.id).map((document)=><span key={document.id} className="flex items-center gap-2 text-xs"><a className="text-[#38BDF8] underline" href={`/api/generated-documents/${document.id}?format=pdf`}>{document.document_number} PDF</a><a className="text-[#38BDF8] underline" href={`/api/generated-documents/${document.id}?format=doc`}>Word</a><a className="text-[#38BDF8] underline" target="_blank" rel="noreferrer" href={`/api/generated-documents/${document.id}?format=html`}>Print</a></span>)}</div>}
      <div className="mt-4 border-t border-[#292929] pt-3"><p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">Approval history</p>{statusHistory.filter((item)=>item.request_id===row.id).slice(0,5).map((item)=><p key={item.id} className="mt-1 text-xs text-[#9CA3AF]">{item.from_status?`${pretty(item.from_status)} → `:""}{pretty(item.to_status)} · {new Date(item.changed_at).toLocaleString("en-IN")}{item.resolution?` · ${item.resolution}`:""}</p>)}</div>
    </article>)}</div>
  </div>;
}
