"use client";

const DEMO_PAYMENTS = [
  { id: "demo-p1", amount_paid: 4500, payment_method: "BANK_TRANSFER", payment_date: "2024-07-05", reference_number: "NEFT/2024070500123", due_type: "MAINTENANCE",   member_name: "Priya Menon"    },
  { id: "demo-p2", amount_paid: 4500, payment_method: "UPI",           payment_date: "2024-07-08", reference_number: "UPI/20240708/ABX12",  due_type: "MAINTENANCE",   member_name: "Sneha Desai"    },
  { id: "demo-p3", amount_paid: 2000, payment_method: "CHEQUE",        payment_date: "2024-07-12", reference_number: "CHQ/000412",           due_type: "SINKING_FUND",  member_name: "Ramesh Iyer"    },
  { id: "demo-p4", amount_paid: 1200, payment_method: "CASH",          payment_date: "2024-07-20", reference_number: null,                   due_type: "PARKING",       member_name: "Kavitha Sharma" },
  { id: "demo-p5", amount_paid: 800,  payment_method: "UPI",           payment_date: "2024-07-25", reference_number: "UPI/20240725/CDE99",  due_type: "WATER_CHARGES", member_name: "Ajay Kulkarni"  },
];

interface Payment {
  id: string;
  amount_paid: number;
  payment_method: string;
  payment_date: string;
  reference_number: string | null;
  due_type?: string;
  member_name?: string;
}

function label(s: string) { return s.charAt(0) + s.slice(1).toLowerCase().replace("_", " "); }

export function PaymentsClient({ payments }: { payments: Payment[] }) {
  const isDemo = payments.length === 0;
  const displayPayments = isDemo ? DEMO_PAYMENTS : payments;
  const totalCollected = displayPayments.reduce((sum, p) => sum + p.amount_paid, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            Payments
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            Payment transactions recorded for the society
          </p>
        </div>
        {totalCollected > 0 && (
          <div className="px-4 py-2 rounded" style={{ backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <p className="text-sm font-medium" style={{ color: "#10B981" }}>
              Total collected: INR {totalCollected.toLocaleString("en-IN")}
            </p>
          </div>
        )}
      </div>

      <div className="queue-section">
        {displayPayments.length === 0 ? (
          <div className="flex flex-col items-center py-16" style={{ color: "#6B7280" }}>
            <span className="material-symbols-outlined mb-3" style={{ fontSize: "40px" }}>payments</span>
            <p className="text-sm">No payments recorded. Use Finance - Dues to record a payment.</p>
          </div>
        ) : (
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
                {["Member", "Due type", "Amount paid", "Method", "Reference", "Date"].map((h) => (
                  <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayPayments.map((row, i) => (
                <tr key={row.id} style={{ borderBottom: i < displayPayments.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                  <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary">{row.member_name ?? "—"}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.due_type ? label(row.due_type) : "—"}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary font-medium">
                    INR {row.amount_paid.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{label(row.payment_method)}</td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "#9CA3AF" }}>{row.reference_number ?? "—"}</td>
                  <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>
                    {new Date(row.payment_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-4 py-3" style={{ borderTop: "1px solid #333333", backgroundColor: "#1c1b1b" }}>
          <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
            {isDemo
              ? "Illustrative data. Live payments appear here once recorded."
              : `Showing ${displayPayments.length} payment${displayPayments.length !== 1 ? "s" : ""}.`}
          </p>
        </div>
      </div>
    </div>
  );
}
