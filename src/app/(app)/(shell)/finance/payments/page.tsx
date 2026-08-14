import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payments" };

const SAMPLE = [
  { id: "PAY-2024-118", unit: "A-401", member: "Ramesh Iyer", description: "Maintenance: Aug 2024", amount: "₹4,200", date: "07 Aug 2024", mode: "Online", ref: "UPI/xxxxx1234" },
  { id: "PAY-2024-117", unit: "A-102", member: "Suresh Nair", description: "Maintenance: Aug 2024", amount: "₹4,200", date: "09 Aug 2024", mode: "Online", ref: "UPI/xxxxx5678" },
  { id: "PAY-2024-116", unit: "C-601", member: "Vijay Anand", description: "Maintenance: Aug 2024 + Jul Arrear", amount: "₹8,400", date: "08 Aug 2024", mode: "NEFT", ref: "NEFT/xxxx3456" },
  { id: "PAY-2024-115", unit: "B-301", member: "Meena Rao", description: "Maintenance: Jul 2024", amount: "₹4,200", date: "02 Aug 2024", mode: "Cheque", ref: "CHQ/xxxxx789" },
  { id: "PAY-2024-114", unit: "A-204", member: "Girish Kumar", description: "Maintenance: Aug 2024", amount: "₹4,200", date: "06 Aug 2024", mode: "Online", ref: "UPI/xxxxx9012" },
];

const modeStyle: Record<string, { bg: string; text: string }> = {
  Online: { bg: "rgba(16,185,129,0.1)", text: "#10B981" },
  NEFT: { bg: "rgba(59,130,246,0.1)", text: "#3B82F6" },
  Cheque: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B" },
  Cash: { bg: "rgba(107,114,128,0.1)", text: "#9CA3AF" },
};

const FALLBACK_STYLE = { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" };

export default function PaymentsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            Payments
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            All collected payments and receipts
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{ backgroundColor: "#10B981", color: "#fff" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span>
          Export
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Collected This Month", value: "—", icon: "payments" },
          { label: "Transactions", value: "—", icon: "receipt" },
          { label: "Avg. per Unit", value: "—", icon: "calculate" },
        ].map((s) => (
          <div key={s.label} className="queue-section px-5 py-4 flex items-center gap-4">
            <span className="material-symbols-outlined" style={{ fontSize: "28px", color: "#10B981" }}>{s.icon}</span>
            <div>
              <p className="font-headline-md text-headline-md text-text-primary">{s.value}</p>
              <p className="font-label-md text-label-md" style={{ color: "#6B7280" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="queue-section">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
              {["Payment ID", "Unit", "Member", "Description", "Amount", "Date", "Mode", "Reference", "Receipt"].map((h) => (
                <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE.map((row, i) => {
              const ms = modeStyle[row.mode] ?? FALLBACK_STYLE;
              return (
                <tr key={row.id} style={{ borderBottom: i < SAMPLE.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                  <td className="px-4 py-3 font-mono" style={{ fontSize: "12px", color: "#10B981" }}>{row.id}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.unit}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary">{row.member}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF", maxWidth: "180px" }}>{row.description}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary font-medium">{row.amount}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.date}</td>
                  <td className="px-4 py-3">
                    <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: ms.bg, color: ms.text }}>{row.mode}</span>
                  </td>
                  <td className="px-4 py-3 font-mono" style={{ fontSize: "11px", color: "#6B7280" }}>{row.ref}</td>
                  <td className="px-4 py-3">
                    <button title="Download receipt" className="material-symbols-outlined" style={{ fontSize: "18px", color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}>download</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-4 py-3" style={{ borderTop: "1px solid #333333", backgroundColor: "#1c1b1b" }}>
          <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
            Phase 0: illustrative data. Live payment ledger with signed receipt URLs arrives in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
}
