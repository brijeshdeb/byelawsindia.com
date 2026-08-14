import type { Metadata } from "next";

export const metadata: Metadata = { title: "Complaints" };

const SAMPLE = [
  { id: "CMP-2024-041", subject: "Water leakage in bathroom ceiling", unit: "A-401", raised: "12 Aug 2024", category: "Plumbing", priority: "High", status: "Open", assignedTo: "Rajesh (Plumber)" },
  { id: "CMP-2024-040", subject: "Lift not working, Wing B", unit: "B-204", raised: "11 Aug 2024", category: "Elevator", priority: "Critical", status: "In Progress", assignedTo: "AMC Vendor" },
  { id: "CMP-2024-039", subject: "Street light not working near gate", unit: "Common", raised: "09 Aug 2024", category: "Electrical", priority: "Medium", status: "In Progress", assignedTo: "Suresh (Electrician)" },
  { id: "CMP-2024-038", subject: "Garden area not maintained", unit: "Common", raised: "05 Aug 2024", category: "Landscaping", priority: "Low", status: "Resolved", assignedTo: "Green Leaf Co." },
  { id: "CMP-2024-037", subject: "Parking slot encroachment", unit: "C-301", raised: "01 Aug 2024", category: "Parking", priority: "Medium", status: "Closed", assignedTo: "Security" },
];

const priorityStyle: Record<string, { bg: string; text: string; border: string }> = {
  Critical: { bg: "rgba(239,68,68,0.15)", text: "#EF4444", border: "rgba(239,68,68,0.25)" },
  High: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
  Medium: { bg: "rgba(59,130,246,0.1)", text: "#3B82F6", border: "rgba(59,130,246,0.2)" },
  Low: { bg: "rgba(107,114,128,0.1)", text: "#9CA3AF", border: "rgba(107,114,128,0.2)" },
};

const statusStyle: Record<string, { bg: string; text: string; border: string }> = {
  Open: { bg: "rgba(239,68,68,0.1)", text: "#EF4444", border: "rgba(239,68,68,0.2)" },
  "In Progress": { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
  Resolved: { bg: "rgba(16,185,129,0.1)", text: "#10B981", border: "rgba(16,185,129,0.2)" },
  Closed: { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" },
};

const FALLBACK_STYLE = { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" };

export default function ComplaintsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            Complaints
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            Member-raised issues tracked to resolution
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{ backgroundColor: "#10B981", color: "#fff" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
          Raise Complaint
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Open", count: "—", color: "#EF4444" },
          { label: "In Progress", count: "—", color: "#F59E0B" },
          { label: "Resolved", count: "—", color: "#10B981" },
          { label: "Avg. Resolution (days)", count: "—", color: "#9CA3AF" },
        ].map((s) => (
          <div key={s.label} className="queue-section px-4 py-3">
            <p className="font-headline-md text-headline-md" style={{ color: s.color }}>{s.count}</p>
            <p className="font-label-md text-label-md" style={{ color: "#6B7280" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="queue-section">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
              {["ID", "Subject", "Unit", "Category", "Priority", "Status", "Assigned To", "Raised"].map((h) => (
                <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE.map((row, i) => {
              const ps = priorityStyle[row.priority] ?? FALLBACK_STYLE;
              const ss = statusStyle[row.status] ?? FALLBACK_STYLE;
              return (
                <tr key={row.id} style={{ borderBottom: i < SAMPLE.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                  <td className="px-4 py-3 font-mono" style={{ fontSize: "12px", color: "#10B981" }}>{row.id}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary" style={{ maxWidth: "220px" }}>{row.subject}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.unit}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.category}</td>
                  <td className="px-4 py-3">
                    <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: ps.bg, color: ps.text, border: `1px solid ${ps.border}` }}>{row.priority}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: ss.bg, color: ss.text, border: `1px solid ${ss.border}` }}>{row.status}</span>
                  </td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.assignedTo}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.raised}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-3" style={{ borderTop: "1px solid #333333", backgroundColor: "#1c1b1b" }}>
          <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
            Phase 0: illustrative data. Live complaint tracking arrives in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
}
