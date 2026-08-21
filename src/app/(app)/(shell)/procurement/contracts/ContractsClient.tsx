"use client";
import { useState, useTransition } from "react";
import { NewContractModal } from "@/components/modals/NewContractModal";
import { decideContractRenewalAction, initiateContractRenewalAction } from "@/app/actions/procurement-workflows";

interface Contract {
  id: string;
  contract_number: string;
  title: string;
  value: number;
  status: string;
  start_date: string;
  end_date: string | null;
  vendor_name?: string;
}

interface Vendor {
  id: string;
  name: string;
}

interface Rfq {
  id: string;
  rfq_number: string;
  title: string;
}
interface Renewal{id:string;contract_id:string;renewal_number:string;status:string;current_end_date:string;proposed_start_date:string|null;proposed_end_date:string|null;proposed_value:number|null;vendor_comments:string|null;society_comments:string|null;response_due_at:string|null;created_at:string;contracts?:{title:string}|null;vendors?:{name:string}|null}

const statusColor: Record<string, { bg: string; text: string; border: string }> = {
  DRAFT: { bg: "rgba(107,114,128,0.1)", text: "#9CA3AF", border: "rgba(107,114,128,0.2)" },
  ACTIVE: { bg: "rgba(16,185,129,0.1)", text: "#10B981", border: "rgba(16,185,129,0.2)" },
  EXPIRED: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
  TERMINATED: { bg: "rgba(239,68,68,0.1)", text: "#EF4444", border: "rgba(239,68,68,0.2)" },
  RENEWED: { bg: "rgba(99,102,241,0.1)", text: "#818CF8", border: "rgba(99,102,241,0.2)" },
};
const FALLBACK = { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" };

function label(s: string) { return s.charAt(0) + s.slice(1).toLowerCase(); }

export function ContractsClient({ contracts, vendors, rfqs, renewals, canInitiateRenewals, canDecideRenewals }: { contracts: Contract[]; vendors: Vendor[]; rfqs: Rfq[]; renewals:Renewal[]; canInitiateRenewals:boolean; canDecideRenewals:boolean }) {
  const [modalOpen, setModalOpen] = useState(false);
  const[renewFor,setRenewFor]=useState<Contract|null>(null);const[message,setMessage]=useState("");const[pending,startTransition]=useTransition();
  function initiate(formData:FormData){if(!renewFor)return;startTransition(async()=>{const r=await initiateContractRenewalAction({contractId:renewFor.id,responseDueAt:String(formData.get("responseDueAt")),comments:String(formData.get("comments")??"")});setMessage(r.success?`Renewal ${r.data.renewalNumber} sent to the vendor.`:r.error);if(r.success)setRenewFor(null);});}
  function decide(id:string,decision:"APPROVED"|"REJECTED"){const comments=window.prompt(decision==="APPROVED"?"Approval notes (optional)":"Reason for rejection")??"";if(decision==="REJECTED"&&!comments.trim())return;startTransition(async()=>{const r=await decideContractRenewalAction({renewalId:id,decision,comments});setMessage(r.success?`Renewal ${label(decision)}.`:r.error);});}

  const totalActiveValue = contracts
    .filter((c) => c.status === "ACTIVE")
    .reduce((sum, c) => sum + c.value, 0);

  return (
    <>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
              Contracts
            </h1>
            <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
              Vendor contracts and service agreements
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
            style={{ backgroundColor: "#10B981", color: "#fff" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
            New Contract
          </button>
        </div>

        {totalActiveValue > 0 && (
          <div className="mb-5 px-5 py-3 rounded flex items-center gap-3" style={{ backgroundColor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#10B981" }}>contract</span>
            <p className="text-sm" style={{ color: "#9CA3AF" }}>
              Active contract value: <span className="font-semibold" style={{ color: "#10B981" }}>INR {totalActiveValue.toLocaleString("en-IN")}</span>
            </p>
          </div>
        )}
        {message&&<p role="status" className="mb-4 rounded border border-[#333] bg-[#1c1b1b] px-4 py-3 text-sm text-[#D1D5DB]">{message}</p>}
        {renewFor&&<form action={initiate} className="queue-section mb-5 grid grid-cols-1 gap-4 p-5 md:grid-cols-2"><div className="md:col-span-2"><h2 className="font-semibold text-text-primary">Start contract renewal</h2><p className="text-sm text-[#9CA3AF]">{renewFor.contract_number} · {renewFor.title}</p></div><label className="text-sm text-[#9CA3AF]">Vendor response due<input name="responseDueAt" type="datetime-local" required className="mt-1 w-full rounded border border-[#333] bg-[#171717] px-3 py-2 text-sm text-text-primary" /></label><label className="text-sm text-[#9CA3AF]">Instructions<input name="comments" className="mt-1 w-full rounded border border-[#333] bg-[#171717] px-3 py-2 text-sm text-text-primary" /></label><div className="md:col-span-2 flex justify-end gap-2"><button type="button" onClick={()=>setRenewFor(null)} className="rounded border border-[#444] px-4 py-2 text-sm text-[#D1D5DB]">Cancel</button><button disabled={pending} className="rounded bg-[#10B981] px-4 py-2 text-sm text-white disabled:opacity-50">Send renewal request</button></div></form>}

        <div className="queue-section">
          {contracts.length === 0 ? (
            <div className="flex flex-col items-center py-16" style={{ color: "#6B7280" }}>
              <span className="material-symbols-outlined mb-3" style={{ fontSize: "40px" }}>gavel</span>
              <p className="text-sm">No contracts yet.</p>
            </div>
          ) : (
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
                  {["Contract no.", "Title", "Vendor", "Value", "Status", "Validity", "Renewal"].map((h) => (
                    <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contracts.map((row, i) => {
                  const sc = statusColor[row.status] ?? FALLBACK;
                  return (
                    <tr key={row.id} style={{ borderBottom: i < contracts.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                      <td className="px-4 py-3 font-mono" style={{ fontSize: "13px", color: "#10B981" }}>{row.contract_number}</td>
                      <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary">{row.title}</td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.vendor_name ?? "—"}</td>
                      <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary font-medium">
                        INR {row.value.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                          {label(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>
                        {new Date(row.start_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                        {row.end_date ? ` - ${new Date(row.end_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}` : " onwards"}
                      </td>
                      <td className="px-4 py-3">{canInitiateRenewals&&row.end_date&&["ACTIVE","EXPIRED"].includes(row.status)?<button disabled={pending} onClick={()=>setRenewFor(row)} className="rounded border border-[#10B981] px-2 py-1 text-xs text-[#10B981]">Start renewal</button>:<span className="text-xs text-[#6B7280]">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div className="px-4 py-3" style={{ borderTop: "1px solid #333333", backgroundColor: "#1c1b1b" }}>
            <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
              {`Showing ${contracts.length} contract${contracts.length !== 1 ? "s" : ""}.`}
            </p>
          </div>
        </div>
        {renewals.length>0&&<section className="queue-section mt-5"><div className="border-b border-[#333] px-5 py-4"><h2 className="font-semibold text-text-primary">Renewal register</h2></div>{renewals.map(r=><article key={r.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-[#292929] px-5 py-4"><div><p className="font-mono text-xs text-[#10B981]">{r.renewal_number}</p><p className="text-sm text-text-primary">{r.contracts?.title??"Contract"} · {r.vendors?.name??"Vendor"}</p><p className="text-xs text-[#9CA3AF]">{label(r.status)}{r.proposed_value?` · INR ${r.proposed_value.toLocaleString("en-IN")}`:""}</p>{r.vendor_comments&&<p className="mt-1 text-xs text-[#D1D5DB]">Vendor: {r.vendor_comments}</p>}</div>{canDecideRenewals&&r.status==="VENDOR_QUOTED"&&<div className="flex gap-2"><button disabled={pending} onClick={()=>decide(r.id,"APPROVED")} className="rounded bg-[#10B981] px-3 py-1.5 text-xs text-white">Approve renewal</button><button disabled={pending} onClick={()=>decide(r.id,"REJECTED")} className="rounded border border-[#EF4444] px-3 py-1.5 text-xs text-[#EF4444]">Reject</button></div>}</article>)}</section>}
      </div>

      <NewContractModal open={modalOpen} onClose={() => setModalOpen(false)} vendors={vendors} rfqs={rfqs} />
    </>
  );
}
