"use client";
import { useState } from "react";
import { UploadDocumentModal } from "@/components/modals/UploadDocumentModal";

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

export function DocumentsClient({ docs, societyId }: { docs: Doc[]; societyId: string }) {
  const [modalOpen, setModalOpen] = useState(false);

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
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
            style={{ backgroundColor: "#10B981", color: "#fff" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>upload_file</span>
            Upload Document
          </button>
        </div>

        <div className="queue-section">
          {docs.length === 0 ? (
            <div className="flex flex-col items-center py-16" style={{ color: "#6B7280" }}>
              <span className="material-symbols-outlined mb-3" style={{ fontSize: "40px" }}>folder_open</span>
              <p className="text-sm">No documents uploaded yet.</p>
            </div>
          ) : (
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
                  {["Doc no.", "Title", "Category", "Size", "Verified", "Date"].map((h) => (
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
                        {getDocNumber(doc)}
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
                        <span className="material-symbols-outlined" style={{ fontSize: "16px", color: doc.is_verified ? "#10B981" : "#6B7280" }}>
                          {doc.is_verified ? "verified" : "pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>
                        {new Date(doc.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <UploadDocumentModal open={modalOpen} onClose={() => setModalOpen(false)} societyId={societyId} />
    </>
  );
}
