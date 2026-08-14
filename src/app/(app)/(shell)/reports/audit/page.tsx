import type { Metadata } from "next";

export const metadata: Metadata = { title: "Audit Trail" };

const SAMPLE = [
  { id: "AUD-20240812-0081", actor: "sec@willow.in", action: "APPROVE_APPLICATION", target: "APP-2024-016", ip: "103.x.x.x", ts: "12 Aug 2024 14:22:08", result: "Success" },
  { id: "AUD-20240812-0080", actor: "admin@willow.in", action: "UPLOAD_DOCUMENT", target: "DOC-006", ip: "103.x.x.x", ts: "12 Aug 2024 11:05:33", result: "Success" },
  { id: "AUD-20240811-0079", actor: "treasurer@willow.in", action: "MARK_PAYMENT", target: "PAY-2024-117", ip: "49.x.x.x", ts: "11 Aug 2024 18:44:01", result: "Success" },
  { id: "AUD-20240811-0078", actor: "chairman@willow.in", action: "AWARD_RFQ", target: "RFQ-2024-008", ip: "103.x.x.x", ts: "11 Aug 2024 16:12:55", result: "Success" },
  { id: "AUD-20240810-0077", actor: "admin@willow.in", action: "REGISTER_MEMBER", target: "MBR-005", ip: "103.x.x.x", ts: "10 Aug 2024 10:30:18", result: "Success" },
  { id: "AUD-20240809-0076", actor: "unknown", action: "LOGIN_FAILED", target: "—", ip: "91.x.x.x", ts: "09 Aug 2024 02:11:44", result: "Failure" },
];

export default function AuditPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            Audit Trail
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            Immutable log of all privileged actions within this society
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{ backgroundColor: "#1c1b1b", color: "#9CA3AF", border: "1px solid #333333" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>download</span>
          Export CSV
        </button>
      </div>

      {/* Read-only notice */}
      <div className="flex items-start gap-3 mb-5 px-4 py-3 rounded" style={{ backgroundColor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
        <span className="material-symbols-outlined mt-0.5" style={{ fontSize: "16px", color: "#F59E0B" }}>lock</span>
        <p className="font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>
          Audit records are append-only. No entry can be edited or deleted, not even by platform administrators. (PostgreSQL audit trigger, Phase 2)
        </p>
      </div>

      <div className="queue-section">
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
              {["Event ID", "Actor", "Action", "Target", "IP Address", "Timestamp", "Result"].map((h) => (
                <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE.map((row, i) => (
              <tr key={row.id} style={{ borderBottom: i < SAMPLE.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                <td className="px-4 py-3 font-mono" style={{ fontSize: "11px", color: "#6B7280" }}>{row.id}</td>
                <td className="px-4 py-3 font-mono" style={{ fontSize: "12px", color: "#9CA3AF" }}>{row.actor}</td>
                <td className="px-4 py-3">
                  <span className="font-mono" style={{ fontSize: "12px", color: row.result === "Failure" ? "#EF4444" : "#10B981" }}>
                    {row.action}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono" style={{ fontSize: "12px", color: "#9CA3AF" }}>{row.target}</td>
                <td className="px-4 py-3 font-mono" style={{ fontSize: "12px", color: "#6B7280" }}>{row.ip}</td>
                <td className="px-4 py-3 font-mono" style={{ fontSize: "12px", color: "#9CA3AF" }}>{row.ts}</td>
                <td className="px-4 py-3">
                  <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{
                    backgroundColor: row.result === "Success" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                    color: row.result === "Success" ? "#10B981" : "#EF4444",
                    border: `1px solid ${row.result === "Success" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
                  }}>{row.result}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3" style={{ borderTop: "1px solid #333333", backgroundColor: "#1c1b1b" }}>
          <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
            Phase 0: illustrative data. Tamper-proof audit log with PostgreSQL triggers arrives in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
}
