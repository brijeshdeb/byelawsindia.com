import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dues & Demands" };

const SAMPLE = [
  { id: "DUE-2024-081", unit: "A-401", member: "Ramesh Iyer", description: "Maintenance: Aug 2024", amount: "₹4,200", due: "10 Aug 2024", status: "Paid", paidOn: "07 Aug 2024" },
  { id: "DUE-2024-080", unit: "B-204", member: "Priya Menon", description: "Maintenance: Aug 2024", amount: "₹4,200", due: "10 Aug 2024", status: "Overdue", paidOn: "—" },
  { id: "DUE-2024-079", unit: "A-102", member: "Suresh Nair", description: "Maintenance: Aug 2024", amount: "₹4,200", due: "10 Aug 2024", status: "Paid", paidOn: "09 Aug 2024" },
  { id: "DUE-2024-078", unit: "C-301", member: "Kavitha Sharma", description: "Maintenance: Aug 2024", amount: "₹4,200", due: "10 Aug 2024", status: "Pending", paidOn: "—" },
  { id: "DUE-2024-077", unit: "B-507", member: "Deepak Patel", description: "Maintenance: Aug 2024", amount: "₹4,200", due: "10 Aug 2024", status: "Pending", paidOn: "—" },
  { id: "DUE-2024-062", unit: "B-204", member: "Priya Menon", description: "Maintenance: Jul 2024", amount: "₹4,200", due: "10 Jul 2024", status: "Overdue", paidOn: "—" },
];

const statusStyle: Record<string, { bg: string; text: string; border: string }> = {
  Paid: { bg: "rgba(16,185,129,0.1)", text: "#10B981", border: "rgba(16,185,129,0.2)" },
  Pending: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
  Overdue: { bg: "rgba(239,68,68,0.1)", text: "#EF4444", border: "rgba(239,68,68,0.2)" },
};

const FALLBACK_STYLE = { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" };

export default function DuesPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            Dues &amp; Demands
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            Monthly maintenance dues raised against all active units
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{ backgroundColor: "#10B981", color: "#fff" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>receipt_long</span>
          Generate Demand
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Demanded", value: "—", color: "#9CA3AF" },
          { label: "Collected", value: "—", color: "#10B981" },
          { label: "Overdue", value: "—", color: "#EF4444" },
          { label: "Collection %", value: "—", color: "#F59E0B" },
        ].map((s) => (
          <div key={s.label} className="queue-section px-4 py-3">
            <p className="font-headline-md text-headline-md" style={{ color: s.color }}>{s.value}</p>
            <p className="font-label-md text-label-md" style={{ color: "#6B7280" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="queue-section">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
              {["Due ID", "Unit", "Member", "Description", "Amount", "Due Date", "Status", "Paid On", "Actions"].map((h) => (
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
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.unit}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary">{row.member}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.description}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary">{row.amount}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.due}</td>
                  <td className="px-4 py-3">
                    <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: ss.bg, color: ss.text, border: `1px solid ${ss.border}` }}>{row.status}</span>
                  </td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.paidOn}</td>
                  <td className="px-4 py-3">
                    <button className="material-symbols-outlined" style={{ fontSize: "18px", color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}>more_horiz</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-3" style={{ borderTop: "1px solid #333333", backgroundColor: "#1c1b1b" }}>
          <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
            Phase 0: illustrative data. Live dues engine with payment gateway arrives in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
}
