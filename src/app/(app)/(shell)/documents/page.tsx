import type { Metadata } from "next";

export const metadata: Metadata = { title: "Documents" };

const SAMPLE = [
  { id: "DOC-001", name: "Society Registration Certificate", category: "Legal", uploaded: "15 Jan 2019", uploadedBy: "Admin", size: "1.2 MB", type: "pdf" },
  { id: "DOC-002", name: "Society Byelaws (2023 Amendment)", category: "Byelaws", uploaded: "10 Mar 2023", uploadedBy: "Secretary", size: "3.8 MB", type: "pdf" },
  { id: "DOC-003", name: "AGM Minutes, March 2024", category: "Minutes", uploaded: "28 Mar 2024", uploadedBy: "Secretary", size: "456 KB", type: "pdf" },
  { id: "DOC-004", name: "Annual Audit Report 2023–24", category: "Finance", uploaded: "30 Apr 2024", uploadedBy: "Treasurer", size: "2.1 MB", type: "pdf" },
  { id: "DOC-005", name: "Maintenance Agency Contract 2024", category: "Contract", uploaded: "01 Jun 2024", uploadedBy: "Chairman", size: "890 KB", type: "pdf" },
  { id: "DOC-006", name: "Fire Safety NOC 2024", category: "Compliance", uploaded: "15 Jul 2024", uploadedBy: "Admin", size: "340 KB", type: "pdf" },
];

const categoryColor: Record<string, string> = {
  Legal: "#8B5CF6",
  Byelaws: "#10B981",
  Minutes: "#3B82F6",
  Finance: "#F59E0B",
  Contract: "#EC4899",
  Compliance: "#6B7280",
};

export default function DocumentsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            Documents
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            Society documents, byelaws, minutes, and compliance records
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{ backgroundColor: "#10B981", color: "#fff" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>upload</span>
          Upload Document
        </button>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["All", "Legal", "Byelaws", "Minutes", "Finance", "Contract", "Compliance"].map((c) => (
          <button
            key={c}
            className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: c === "All" ? "rgba(16,185,129,0.12)" : "#1E1E1E",
              color: c === "All" ? "#10B981" : "#9CA3AF",
              border: `1px solid ${c === "All" ? "rgba(16,185,129,0.3)" : "#333333"}`,
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="queue-section">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
              {["Document", "Category", "Uploaded", "Uploaded By", "Size", "Actions"].map((h) => (
                <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE.map((row, i) => {
              const catColor = categoryColor[row.category] ?? "#6B7280";
              return (
                <tr key={row.id} style={{ borderBottom: i < SAMPLE.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#EF4444" }}>picture_as_pdf</span>
                      <span className="font-body-sm text-body-sm text-text-primary">{row.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: `${catColor}18`, color: catColor, border: `1px solid ${catColor}30` }}>{row.category}</span>
                  </td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.uploaded}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.uploadedBy}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.size}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button title="Download" className="material-symbols-outlined" style={{ fontSize: "18px", color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}>download</button>
                      <button title="More" className="material-symbols-outlined" style={{ fontSize: "18px", color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}>more_horiz</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-3" style={{ borderTop: "1px solid #333333", backgroundColor: "#1c1b1b" }}>
          <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
            Phase 0: illustrative data. Secure document vault with signed URLs arrives in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
}
