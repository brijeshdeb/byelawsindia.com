"use client";
import { useState } from "react";
import { AddDueModal } from "@/components/modals/AddDueModal";
import { RecordPaymentModal } from "@/components/modals/RecordPaymentModal";

interface Due {
  id: string;
  due_type: string;
  amount: number;
  due_date: string;
  status: string;
  description: string | null;
  member_name: string;
  member_number: string;
}

interface Member {
  id: string;
  full_name: string;
  member_number: string;
}

const statusColor: Record<string, { bg: string; text: string; border: string }> = {
  UNPAID: { bg: "rgba(239,68,68,0.1)", text: "#EF4444", border: "rgba(239,68,68,0.2)" },
  PARTIALLY_PAID: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
  PAID: { bg: "rgba(16,185,129,0.1)", text: "#10B981", border: "rgba(16,185,129,0.2)" },
  WAIVED: { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" },
};
const FALLBACK = { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" };

const DEMO_DUES: Due[] = [
  { id: "demo-due1", due_type: "MAINTENANCE",   amount: 4500,  due_date: "2024-07-31", status: "UNPAID",          description: "Q2 2024 maintenance charges", member_name: "Ramesh Iyer",    member_number: "MBR-2024-001" },
  { id: "demo-due2", due_type: "MAINTENANCE",   amount: 4500,  due_date: "2024-07-31", status: "PAID",            description: "Q2 2024 maintenance charges", member_name: "Priya Menon",    member_number: "MBR-2024-002" },
  { id: "demo-due3", due_type: "WATER_CHARGES", amount: 800,   due_date: "2024-08-15", status: "UNPAID",          description: "August water usage charges",  member_name: "Suresh Nair",    member_number: "MBR-2024-003" },
  { id: "demo-due4", due_type: "MAINTENANCE",   amount: 4500,  due_date: "2024-07-31", status: "PARTIALLY_PAID",  description: "Q2 2024 maintenance charges", member_name: "Kavitha Sharma", member_number: "MBR-2024-004" },
  { id: "demo-due5", due_type: "PARKING",       amount: 1200,  due_date: "2024-08-31", status: "UNPAID",          description: "Monthly parking slot fee",    member_name: "Ajay Kulkarni",  member_number: "MBR-2024-005" },
  { id: "demo-due6", due_type: "MAINTENANCE",   amount: 4500,  due_date: "2024-07-31", status: "PAID",            description: "Q2 2024 maintenance charges", member_name: "Sneha Desai",    member_number: "MBR-2024-006" },
  { id: "demo-due7", due_type: "SINKING_FUND",  amount: 2000,  due_date: "2024-09-30", status: "UNPAID",          description: "Annual sinking fund contribution", member_name: "Deepa Krishnan", member_number: "MBR-2024-008" },
];

function label(s: string) { return s.charAt(0) + s.slice(1).toLowerCase().replace("_", " "); }

export function DuesClient({ dues, members }: { dues: Due[]; members: Member[] }) {
  const [addDueOpen, setAddDueOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedDueId, setSelectedDueId] = useState<string | undefined>();
  const isDemo = dues.length === 0;
  const displayDues = isDemo ? DEMO_DUES : dues;

  function openPayment(dueId?: string) {
    setSelectedDueId(dueId);
    setPaymentOpen(true);
  }

  const totalOutstanding = displayDues
    .filter((d) => d.status === "UNPAID" || d.status === "PARTIALLY_PAID")
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
              Dues
            </h1>
            <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
              Outstanding and settled dues across all members
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => openPayment()}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
              style={{ backgroundColor: "#1E1E1E", color: "#9CA3AF", border: "1px solid #333333" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>payments</span>
              Record Payment
            </button>
            <button
              onClick={() => setAddDueOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
              style={{ backgroundColor: "#10B981", color: "#fff" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
              Add Due
            </button>
          </div>
        </div>

        {totalOutstanding > 0 && (
          <div className="mb-5 px-5 py-3 rounded flex items-center gap-3" style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "20px", color: "#EF4444" }}>warning</span>
            <p className="text-sm" style={{ color: "#FCA5A5" }}>
              Total outstanding: <span className="font-semibold" style={{ color: "#EF4444" }}>INR {totalOutstanding.toLocaleString("en-IN")}</span>
            </p>
          </div>
        )}

        <div className="queue-section">
          {displayDues.length === 0 ? (
            <div className="flex flex-col items-center py-16" style={{ color: "#6B7280" }}>
              <span className="material-symbols-outlined mb-3" style={{ fontSize: "40px" }}>receipt_long</span>
              <p className="text-sm">No dues recorded yet.</p>
            </div>
          ) : (
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
                  {["Member", "Type", "Amount", "Due date", "Status", ""].map((h) => (
                    <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayDues.map((row, i) => {
                  const sc = statusColor[row.status] ?? FALLBACK;
                  const canPay = row.status === "UNPAID" || row.status === "PARTIALLY_PAID";
                  return (
                    <tr key={row.id} style={{ borderBottom: i < displayDues.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                      <td className="px-4 py-3">
                        <p className="font-body-sm text-body-sm text-text-primary">{row.member_name}</p>
                        <p className="font-mono text-xs" style={{ color: "#10B981" }}>{row.member_number}</p>
                      </td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{label(row.due_type)}</td>
                      <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary font-medium">
                        INR {row.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>
                        {new Date(row.due_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                          {label(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {canPay && (
                          <button
                            onClick={() => openPayment(row.id)}
                            className="text-xs px-3 py-1 rounded font-medium"
                            style={{ backgroundColor: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }}
                          >
                            Record payment
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div className="px-4 py-3" style={{ borderTop: "1px solid #333333", backgroundColor: "#1c1b1b" }}>
            <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
              {isDemo
                ? "Illustrative data. Live dues appear here once added."
                : `Showing ${displayDues.length} due record${displayDues.length !== 1 ? "s" : ""}.`}
            </p>
          </div>
        </div>
      </div>

      <AddDueModal open={addDueOpen} onClose={() => setAddDueOpen(false)} members={members} />
      <RecordPaymentModal
        open={paymentOpen}
        onClose={() => { setPaymentOpen(false); setSelectedDueId(undefined); }}
        dues={displayDues}
        preselectedDueId={selectedDueId}
      />
    </>
  );
}
