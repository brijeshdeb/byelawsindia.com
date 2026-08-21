"use client";

import { useState, useTransition } from "react";
import {
  decideVendorSelectionAction,
  evaluateQuotationAction,
  publishRfqAction,
  recommendVendorAction,
} from "@/app/actions/procurement-workflows";

type Rfq = {
  id: string;
  rfq_number: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  submission_deadline: string | null;
  estimated_budget: number | null;
  awarded_vendor: string | null;
};
type Vendor = { id: string; name: string; vendor_type: string; address:string|null;service_areas:string[];branch_availability:string|null;is_verified: boolean;is_preferred:boolean; status: string;vendor_performance_reviews:Array<{overall_score:number}>;contracts:Array<{id:string;status:string}> };
type Invitation = { id: string; vendor_id: string; status: string; vendors?: { name: string } | null };
type Quote = {
  id: string;
  vendor_id: string;
  quotation_number: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  validity_days: number | null;
  delivery_days: number | null;
  submitted_at: string | null;
  vendors?: { name: string } | null;
  quotation_items: unknown[];
  quotation_evaluations: Array<{ total_score: number }>;
};
type ApprovalStep = { id: string; step_order: number; name: string; permission_code: string };
type ApprovalDecision = {
  id: string;
  decision: string;
  comments: string | null;
  decided_at: string;
  approval_workflow_steps?: { name: string; step_order: number } | null;
};
type Approval = {
  id: string;
  status: string;
  current_step_order: number;
  approval_workflows?: { name: string; approval_workflow_steps: ApprovalStep[] } | null;
  approval_decisions: ApprovalDecision[];
};
type Selection = {
  id: string;
  status: string;
  justification: string;
  quotation_id: string;
  vendor_id: string;
  vendors?: { name: string } | null;
  approval?: Approval | null;
} | null;

const pretty = (value: string) =>
  value.toLowerCase().replace(/_/g, " ").replace(/^./, (character) => character.toUpperCase());

export function RfqDetailClient({
  rfq,
  vendors,
  invitations,
  quotations,
  selection,
  canPublish,
  canEvaluate,
  canRecommend,
  canApprove,
}: {
  rfq: Rfq;
  vendors: Vendor[];
  invitations: Invitation[];
  quotations: Quote[];
  selection: Selection;
  canPublish: boolean;
  canEvaluate: boolean;
  canRecommend: boolean;
  canApprove: boolean;
}) {
  const [selected, setSelected] = useState<string[]>(invitations.map((invitation) => invitation.vendor_id));
  const[vendorSearch,setVendorSearch]=useState("");const[vendorType,setVendorType]=useState("ALL");const[vendorStatus,setVendorStatus]=useState("ACTIVE");const[minRating,setMinRating]=useState(0);const[contractOnly,setContractOnly]=useState(false);const[preferredOnly,setPreferredOnly]=useState(false);
  const [scores, setScores] = useState<Record<string, { technical: number; commercial: number; experience: number }>>({});
  const [decisionComments, setDecisionComments] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function publish() {
    startTransition(async () => {
      const result = await publishRfqAction({ rfqId: rfq.id, vendorIds: selected });
      setMessage(result.success ? `${result.data.invited} vendor invitations created.` : result.error);
    });
  }

  function evaluate(id: string) {
    const score = scores[id] ?? { technical: 0, commercial: 0, experience: 0 };
    startTransition(async () => {
      const result = await evaluateQuotationAction({
        quotationId: id,
        technicalScore: score.technical,
        commercialScore: score.commercial,
        experienceScore: score.experience,
      });
      setMessage(result.success ? `Weighted score ${result.data.totalScore}.` : result.error);
    });
  }

  function recommend(quote: Quote) {
    startTransition(async () => {
      const result = await recommendVendorAction({
        rfqId: rfq.id,
        quotationId: quote.id,
        vendorId: quote.vendor_id,
        justification: `Best evaluated offer for ${rfq.rfq_number}; three-stage society approval required.`,
      });
      setMessage(result.success ? "Vendor recommendation sent to Procurement Authority 1." : result.error);
    });
  }

  function decide(decision: "APPROVED" | "REJECTED") {
    if (!selection) return;
    if (decision === "REJECTED" && !decisionComments.trim()) {
      setMessage("A rejection reason is required.");
      return;
    }
    startTransition(async () => {
      const result = await decideVendorSelectionAction({
        selectionId: selection.id,
        decision,
        comments: decisionComments,
      });
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      setDecisionComments("");
      if (result.data.status === "APPROVED") {
        setMessage(`Final approval completed. Work order ${result.data.workOrderNumber} issued.`);
      } else if (result.data.status === "REJECTED") {
        setMessage("Vendor selection rejected.");
      } else {
        setMessage(`Stage ${result.data.completedStep} approved. Sent to stage ${result.data.currentStep}.`);
      }
    });
  }

  const steps = selection?.approval?.approval_workflows?.approval_workflow_steps ?? [];
  const decisions = selection?.approval?.approval_decisions ?? [];
  const currentStep = selection?.approval?.current_step_order;
  const vendorTypes=Array.from(new Set(vendors.map(v=>v.vendor_type))).sort();
  const filteredVendors=vendors.filter(v=>{const latest=v.vendor_performance_reviews?.[0]?.overall_score??0;const location=[v.address,v.branch_availability,...(v.service_areas??[])].filter(Boolean).join(" ").toLowerCase();const term=vendorSearch.trim().toLowerCase();return(!term||v.name.toLowerCase().includes(term)||location.includes(term))&&(vendorType==="ALL"||v.vendor_type===vendorType)&&(vendorStatus==="ALL"||v.status===vendorStatus)&&latest>=minRating&&(!contractOnly||v.contracts?.some(c=>["ACTIVE","RENEWED"].includes(c.status)))&&(!preferredOnly||v.is_preferred);});

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="font-mono text-sm text-[#10B981]">{rfq.rfq_number}</p>
          <h1 className="mt-1 text-3xl font-bold text-text-primary">{rfq.title}</h1>
          <p className="mt-1 text-sm text-[#9CA3AF]">
            {pretty(rfq.category)} · {pretty(rfq.status)} · Deadline {rfq.submission_deadline ? new Date(rfq.submission_deadline).toLocaleString("en-IN") : "not set"}
          </p>
        </div>
      </div>

      {message ? <p className="mb-4 rounded border border-[#333] bg-[#1c1b1b] px-4 py-3 text-sm text-[#D1D5DB]">{message}</p> : null}

      {canPublish && rfq.status === "DRAFT" ? (
        <section className="queue-section mb-5 p-5">
          <h2 className="font-semibold text-text-primary">Select vendors to invite</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-3 lg:grid-cols-6">
            <input value={vendorSearch} onChange={e=>setVendorSearch(e.target.value)} placeholder="Name, wing, location" className="rounded border border-[#333] bg-[#171717] px-3 py-2 text-xs text-text-primary lg:col-span-2" />
            <select value={vendorType} onChange={e=>setVendorType(e.target.value)} className="rounded border border-[#333] bg-[#171717] px-3 py-2 text-xs text-text-primary"><option value="ALL">All categories</option>{vendorTypes.map(type=><option key={type}>{type}</option>)}</select>
            <select value={vendorStatus} onChange={e=>setVendorStatus(e.target.value)} className="rounded border border-[#333] bg-[#171717] px-3 py-2 text-xs text-text-primary"><option value="ALL">All statuses</option><option>ACTIVE</option><option>INACTIVE</option><option>BLACKLISTED</option></select>
            <select value={minRating} onChange={e=>setMinRating(Number(e.target.value))} className="rounded border border-[#333] bg-[#171717] px-3 py-2 text-xs text-text-primary"><option value="0">Any experience</option><option value="3">Rated 3+</option><option value="4">Rated 4+</option></select>
            <div className="flex flex-col justify-center gap-1 text-xs text-[#D1D5DB]"><label><input type="checkbox" checked={contractOnly} onChange={e=>setContractOnly(e.target.checked)} /> Existing contract</label><label><input type="checkbox" checked={preferredOnly} onChange={e=>setPreferredOnly(e.target.checked)} /> Preferred only</label></div>
          </div>
          <p className="mt-2 text-xs text-[#6B7280]">{filteredVendors.length} matching vendor(s)</p>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {filteredVendors.map((vendor) => (
              <label key={vendor.id} className="flex items-center gap-2 rounded border border-[#333] p-3 text-sm text-[#D1D5DB]">
                <input
                  type="checkbox"
                  disabled={vendor.status!=="ACTIVE"}
                  checked={selected.includes(vendor.id)}
                  onChange={(event) => setSelected((value) => event.target.checked ? [...value, vendor.id] : value.filter((id) => id !== vendor.id))}
                />
                {vendor.name}
                <span className="text-xs text-[#6B7280]">{vendor.is_preferred?"Preferred · ":""}{vendor.is_verified ? "Verified" : "Unverified"} · {vendor.vendor_performance_reviews?.[0]?.overall_score??"Unrated"}</span>
              </label>
            ))}
          </div>
          <button disabled={pending} onClick={publish} className="mt-4 rounded bg-[#10B981] px-4 py-2 text-sm text-white disabled:opacity-60">
            Publish & invite
          </button>
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="queue-section lg:col-span-2">
          <div className="border-b border-[#333] px-5 py-4"><h2 className="font-semibold text-text-primary">Quotation comparison</h2></div>
          {quotations.length === 0 ? <p className="p-8 text-center text-sm text-[#6B7280]">No submitted quotations.</p> : quotations.map((quote, index) => {
            const current = scores[quote.id] ?? { technical: 0, commercial: 0, experience: 0 };
            const latest = quote.quotation_evaluations?.[0];
            return (
              <article key={quote.id} className="border-b border-[#292929] p-5">
                <div className="flex justify-between">
                  <div><p className="font-mono text-xs text-[#10B981]">{quote.quotation_number}</p><h3 className="font-semibold text-text-primary">{quote.vendors?.name ?? "Vendor"}</h3></div>
                  <div className="text-right"><p className="font-semibold text-text-primary">INR {quote.total_amount.toLocaleString("en-IN")}</p><p className="text-xs text-[#9CA3AF]">Rank by price: {index + 1}</p></div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-[#9CA3AF]"><span>Delivery {quote.delivery_days ?? "—"} days</span><span>Validity {quote.validity_days ?? "—"} days</span><span>Score {latest?.total_score ?? "Not evaluated"}</span></div>
                {canEvaluate ? (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {(["technical", "commercial", "experience"] as const).map((key) => (
                      <label key={key} className="text-xs text-[#9CA3AF]">{pretty(key)}
                        <input type="number" min="0" max="100" value={current[key]} onChange={(event) => setScores((value) => ({ ...value, [quote.id]: { ...current, [key]: Number(event.target.value) } }))} className="mt-1 w-full rounded border border-[#333] bg-[#171717] px-2 py-1.5 text-text-primary" />
                      </label>
                    ))}
                    <button disabled={pending} onClick={() => evaluate(quote.id)} className="rounded border border-[#10B981] px-3 py-1.5 text-xs text-[#10B981] disabled:opacity-60">Save score</button>
                    {canRecommend && !selection && latest ? <button disabled={pending} onClick={() => recommend(quote)} className="rounded bg-[#10B981] px-3 py-1.5 text-xs text-white disabled:opacity-60">Recommend</button> : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>

        <aside className="space-y-5">
          <section className="queue-section p-5">
            <h2 className="font-semibold text-text-primary">Invitations</h2>
            {invitations.map((invitation) => <div key={invitation.id} className="mt-3 flex justify-between text-sm"><span className="text-[#D1D5DB]">{invitation.vendors?.name}</span><span className="text-[#9CA3AF]">{pretty(invitation.status)}</span></div>)}
          </section>

          <section className="queue-section p-5">
            <h2 className="font-semibold text-text-primary">Society approval</h2>
            {selection ? (
              <>
                <p className="mt-2 text-sm text-[#D1D5DB]">{selection.vendors?.name}</p>
                <p className="mt-1 text-sm text-[#9CA3AF]">{selection.justification}</p>
                <ol className="mt-4 space-y-2">
                  {steps.sort((a, b) => a.step_order - b.step_order).map((step) => {
                    const decision = decisions.find((item) => item.approval_workflow_steps?.step_order === step.step_order);
                    const active = selection.approval?.status === "PENDING" && currentStep === step.step_order;
                    return <li key={step.id} className={`rounded border p-3 text-xs ${active ? "border-[#10B981] bg-[#0f241d]" : "border-[#333]"}`}><div className="flex justify-between gap-2"><span className="text-[#D1D5DB]">{step.step_order}. {step.name}</span><span className={decision?.decision === "APPROVED" ? "text-[#10B981]" : "text-[#9CA3AF]"}>{decision ? pretty(decision.decision) : active ? "Awaiting action" : "Pending"}</span></div>{decision?.comments ? <p className="mt-1 text-[#9CA3AF]">{decision.comments}</p> : null}</li>;
                  })}
                </ol>
                {canApprove && selection.approval?.status === "PENDING" ? (
                  <div className="mt-4">
                    <label className="text-xs text-[#9CA3AF]">Decision comments
                      <textarea value={decisionComments} onChange={(event) => setDecisionComments(event.target.value)} rows={3} className="mt-1 w-full rounded border border-[#333] bg-[#171717] px-2 py-1.5 text-text-primary" placeholder="Required when rejecting" />
                    </label>
                    <div className="mt-2 flex gap-2">
                      <button disabled={pending} onClick={() => decide("APPROVED")} className="rounded bg-[#10B981] px-3 py-1.5 text-xs text-white disabled:opacity-60">Approve stage</button>
                      <button disabled={pending} onClick={() => decide("REJECTED")} className="rounded border border-[#EF4444] px-3 py-1.5 text-xs text-[#EF4444] disabled:opacity-60">Reject</button>
                    </div>
                  </div>
                ) : selection.approval?.status === "PENDING" ? <p className="mt-4 text-xs text-[#9CA3AF]">Waiting for the authorized society approver at stage {currentStep}.</p> : null}
              </>
            ) : <p className="mt-2 text-sm text-[#6B7280]">No recommendation yet.</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}
