import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reports" };

const REPORT_GROUPS = [
  {
    group: "Finance",
    icon: "payments",
    reports: [
      { name: "Monthly Collection Statement", desc: "All dues raised and collected for a selected month", format: "PDF / XLSX" },
      { name: "Outstanding Dues Report", desc: "Units with pending or overdue dues as of today", format: "PDF / XLSX" },
      { name: "Income & Expenditure Statement", desc: "Society P&L for the financial year", format: "PDF" },
      { name: "Bank Reconciliation Statement", desc: "Society bank account vs ledger reconciliation", format: "PDF / XLSX" },
    ],
  },
  {
    group: "Maintenance",
    icon: "build",
    reports: [
      { name: "Complaint Ageing Report", desc: "Open complaints by age bracket (0–7, 8–15, 15+ days)", format: "PDF / XLSX" },
      { name: "Work Order Summary", desc: "All work orders for selected date range with cost summary", format: "PDF / XLSX" },
      { name: "Vendor Spend Analysis", desc: "Spend by vendor category for the year", format: "XLSX" },
    ],
  },
  {
    group: "Members & Units",
    icon: "people",
    reports: [
      { name: "Member Directory", desc: "All active members with unit and contact details", format: "PDF / XLSX" },
      { name: "Vacancy & Occupancy Report", desc: "Occupied, tenanted, and vacant units by wing", format: "PDF" },
      { name: "Tenant Register", desc: "All registered tenants with NOC references", format: "PDF / XLSX" },
    ],
  },
  {
    group: "Compliance",
    icon: "verified",
    reports: [
      { name: "AGM Attendance Register", desc: "Member attendance for the latest AGM", format: "PDF" },
      { name: "Statutory Returns Tracker", desc: "Status of annual statutory filings", format: "PDF" },
      { name: "Fire & Safety Compliance Log", desc: "NOC renewals and safety audit records", format: "PDF" },
    ],
  },
];

export default function ReportsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            Reports
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            Generate, schedule, and export society reports
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {REPORT_GROUPS.map((group) => (
          <div key={group.group} className="queue-section">
            <div className="queue-section-header">
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#10B981" }}>{group.icon}</span>
              <h2 className="font-headline-sm text-headline-sm text-text-primary">{group.group}</h2>
            </div>

            <div className="divide-y" style={{ borderColor: "#2a2a2a" }}>
              {group.reports.map((r) => (
                <div key={r.name} className="queue-item flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-body-sm text-body-sm text-text-primary font-medium">{r.name}</p>
                    <p className="font-body-sm text-body-sm mt-0.5" style={{ color: "#6B7280", fontSize: "12px" }}>{r.desc}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: "rgba(107,114,128,0.1)", color: "#6B7280", border: "1px solid rgba(107,114,128,0.2)", fontSize: "11px" }}>
                      {r.format}
                    </span>
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium"
                      style={{ backgroundColor: "#1c1b1b", color: "#9CA3AF", border: "1px solid #333333" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>download</span>
                      Generate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 px-4 py-3 rounded" style={{ backgroundColor: "#1c1b1b", border: "1px solid #333333" }}>
        <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
          Phase 0: report UI is illustrative. Live report generation with filtered date ranges arrives in Phase 2.
        </p>
      </div>
    </div>
  );
}
