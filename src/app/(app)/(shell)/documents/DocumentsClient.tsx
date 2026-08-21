"use client";
import { useState, useTransition } from "react";
import { UploadDocumentModal } from "@/components/modals/UploadDocumentModal";
import { reviewDocumentAction } from "@/app/actions/documents";

interface Doc {
  id: string;
  title: string;
  category: string;
  description: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  // document_number is stored inside metadata (no dedicated column in society_documents)
  // typed as `unknown` because Supabase's Json union includes null, string, number, etc.
  metadata: unknown;
  is_verified: boolean;
  created_at: string;
  document_number: string;
  status: string;
  version: number;
  expires_on: string | null;
  classification: string;
  rejection_reason: string | null;
}

const catColor: Record<string, { bg: string; text: string; border: string }> = {
  MINUTES: { bg: "rgba(16,185,129,0.1)", text: "#10B981", border: "rgba(16,185,129,0.2)" },
  NOTICE: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
  CIRCULAR: { bg: "rgba(99,102,241,0.1)", text: "#818CF8", border: "rgba(99,102,241,0.2)" },
  COMPLIANCE: { bg: "rgba(239,68,68,0.1)", text: "#EF4444", border: "rgba(239,68,68,0.2)" },
  FINANCIAL: { bg: "rgba(16,185,129,0.08)", text: "#34D399", border: "rgba(16,185,129,0.2)" },
  LEGAL: { bg: "rgba(245,158,11,0.08)", text: "#FCD34D", border: "rgba(245,158,11,0.2)" },
};
const FALLBACK = { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" };

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function label(s: string) { return s.charAt(0) + s.slice(1).toLowerCase(); }

function getDocNumber(doc: Doc): string {
  const meta = doc.metadata;
  if (meta != null && typeof meta === "object" && !Array.isArray(meta)) {
    const num = (meta as Record<string, unknown>).document_number;
    if (typeof num === "string" && num.length > 0) return num;
  }
  return doc.id.slice(-8).toUpperCase();
}

export function DocumentsClient({ docs, societyId, canUpload, canReview }: { docs: Doc[]; societyId: string; canUpload:boolean; canReview:boolean }) {
  const [modalOpen, setModalOpen] = useState(false);
  const[replacement,setReplacement]=useState<Doc|null>(null);const[message,setMessage]=useState("");const[pending,startTransition]=useTransition();
  function review(id:string,decision:"VERIFIED"|"REJECTED"|"ARCHIVED"){const reason=decision==="REJECTED"?window.prompt("Reason for rejection")??"":"";if(decision==="REJECTED"&&!reason.trim())return;startTransition(async()=>{const result=await reviewDocumentAction({documentId:id,decision,reason});setMessage(result.success?`Document ${label(decision)}.`:result.error);});}

  return (
    <>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
              Documents
            </h1>
            <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
              Society document library: minutes, notices, circulars, and compliance records
            </p>
          </div>
          {canUpload&&<button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
            style={{ backgroundColor: "#10B981", color: "#fff" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>upload_file</span>
            Upload Document
          </button>}
        </div>

        {message&&<p role="status" className="mb-4 rounded border border-[#333] bg-[#1c1b1b] px-4 py-3 text-sm text-[#D1D5DB]">{message}</p>}

        <div className="queue-section">
          {docs.length === 0 ? (
            <div className="flex flex-col items-center py-16" style={{ color: "#6B7280" }}>
              <span className="material-symbols-outlined mb-3" style={{ fontSize: "48px" }}>folder_open</span>
              <p className="text-sm font-medium mb-1" style={{ color: "#9CA3AF" }}>No documents yet</p>
              <p className="text-xs mb-4" style={{ color: "#6B7280" }}>Upload minutes, notices, circulars, and compliance records here.</p>
              {canUpload&&<button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
                style={{ backgroundColor: "#10B981", color: "#fff" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>upload_file</span>
                Upload First Document
              </button>}
            </div>
          ) : (
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
                  {["Doc no.", "Title", "Category", "Size", "Status", "Expiry", "Actions"].map((h) => (
                    <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map((doc, i) => {
                  const cc = catColor[doc.category] ?? FALLBACK;
                  return (
                    <tr key={doc.id} style={{ borderBottom: i < docs.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                      <td className="px-4 py-3 font-mono" style={{ fontSize: "13px", color: "#10B981" }}>
                        {doc.document_number||getDocNumber(doc)} <span className="text-[#6B7280]">v{doc.version}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-body-sm text-body-sm text-text-primary">{doc.title}</p>
                        {doc.description && <p className="text-xs truncate max-w-xs" style={{ color: "#6B7280" }}>{doc.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: cc.bg, color: cc.text, border: `1px solid ${cc.border}` }}>
                          {label(doc.category)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>
                        {doc.file_size_bytes != null ? formatBytes(doc.file_size_bytes) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{color:doc.status==="VERIFIED"?"#10B981":doc.status==="REJECTED"?"#EF4444":"#F59E0B"}}>{label(doc.status)}</span><p className="text-[11px] text-[#6B7280]">{label(doc.classification)}</p>
                      </td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>
                        {doc.expires_on?new Date(doc.expires_on).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }):"No expiry"}
                      </td>
                      <td className="px-4 py-3"><div className="flex flex-wrap gap-2"><a href={`/api/documents/${doc.id}`} target="_blank" className="text-xs text-[#10B981] underline">Preview</a><a href={`/api/documents/${doc.id}?download=1`} className="text-xs text-[#10B981] underline">Download</a>{canUpload&&!["REPLACED","ARCHIVED"].includes(doc.status)&&<button disabled={pending} onClick={()=>{setReplacement(doc);setModalOpen(true);}} className="text-xs text-[#38BDF8] underline">Replace</button>}{canReview&&doc.status==="UPLOADED"&&<><button disabled={pending} onClick={()=>review(doc.id,"VERIFIED")} className="text-xs text-[#10B981] underline">Verify</button><button disabled={pending} onClick={()=>review(doc.id,"REJECTED")} className="text-xs text-[#EF4444] underline">Reject</button></>}{canReview&&!["ARCHIVED","REPLACED"].includes(doc.status)&&<button disabled={pending} onClick={()=>review(doc.id,"ARCHIVED")} className="text-xs text-[#9CA3AF] underline">Archive</button>}</div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {docs.length > 0 && (
            <div className="px-4 py-3" style={{ borderTop: "1px solid #333333", backgroundColor: "#1c1b1b" }}>
              <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
                {`Showing ${docs.length} document${docs.length !== 1 ? "s" : ""}.`}
              </p>
            </div>
          )}
        </div>
      </div>

      <UploadDocumentModal open={modalOpen} onClose={() => {setModalOpen(false);setReplacement(null);}} societyId={societyId} replacement={replacement?{id:replacement.id,title:replacement.title}:null} />
    </>
  );
}
