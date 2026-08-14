import type { Metadata } from "next";

export const metadata: Metadata = { title: "RFQs" };

const SAMPLE = [
  { id: "RFQ-2024-009", title: "Annual Pest Control, Society-wide", deadline: "20 Aug 2024", quotations: 3, budget: "₹40,000", status: "Open", createdBy: "Secretary" },
  { id: "RFQ-2024-008", title: "CCTV Camera Upgrade, Parking Level", deadline: "18 Aug 2024", quotations: 4, budget: "₹1,20,000", status: "Evaluation", createdBy: "Chairman" },
  { id: "RFQ-2024-007", title: "Annual Landscaping Contract", deadline: "10 Aug 2024", quotations: 5, budget: "₹60,000", status: "Awarded", createdBy: "Secretary" },
  { id: "RFQ-2024-006", title: "Terrace Waterproofing, Wing C", deadline: "31 Jul 2024", quotations: 3, budget: "₹80,000", status: "Awarded", createdBy: "Chairman" },
  { id: "RFQ-2024-005", title: "Swimming Pool Maintenance AMC", deadline: "20 Jul 2024", quotations: 2, budget: "₹1,80,000", status: "Closed", createdBy: "Secretary" },
];

const statusStyle: Record<string, { bg: string; text: string; border: string }> = {
  Open: { bg: "rgba(16,185,129,0.1)", text: "#10B981", border: "rgba(16,185,129,0.2)" },
  Evaluation: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
  Awarded: { bg: "rgba(59,130,246,0.1)", text: "#3B82F6", border: "rgba(59,130,246,0.2)" },
  Closed: { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" },
};

const FALLBACK_STYLE = { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" };

export default function RFQsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            RFQs
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            Requests for quotation issued to registered vendors
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{ backgroundColor: "#10B981", color: "#fff" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
          Create RFQ
        </button>
      </div>

      {/* Note about vendor isolation */}
      <div className="flex items-start gap-3 mb-5 px-4 py-3 rounded" style={{ backgroundColor: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)" }}>
        <span className="material-symbols-outlined mt-0.5" style={{ fontSize: "16px", color: "#3B82F6" }}>info</span>
        <p className="font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>
          Each vendor can only see their own submission. Competitor quotations are never exposed. (Phase 2)
        </p>
      </div>

      <div className="queue-section">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
              {["RFQ ID", "Title", "Deadline", "Quotations Received", "Budget", "Status", "Created By", "Actions"].map((h) => (
                <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE.map((row, i) => {
              const ss = statusStyle[row.status] ?? FALLBACK_STYLE;
              return (
                <tr key={row.id} style={{ borderBottom: i < SAMPLE.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                  <td className="px-4 py-3 font-mono" style={{ fontSize: "12px", color: "#10B981" }}>{row.id}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary" style={{ maxWidth: "220px" }}>{row.title}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.deadline}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF", textAlign: "center" }}>{row.quotations}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary">{row.budget}</td>
                  <td className="px-4 py-3">
                    <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: ss.bg, color: ss.text, border: `1px solid ${ss.border}` }}>{row.status}</span>
                  </td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.createdBy}</td>
                  <td className="px-4 py-3">
                    <button className="material-symbols-outlined" style={{ fontSize: "18px", color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}>open_in_new</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-3" style={{ borderTop: "1px solid #333333", backgroundColor: "#1c1b1b" }}>
          <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
            Phase 0: illustrative data. Live RFQ workflows with sealed bidding arrive in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
}
