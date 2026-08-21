import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reports" };

const REPORT_GROUPS = [
  {
    group: "Finance",
    icon: "payments",
    reports: [
      {
        key: "monthly-collections",
        name: "Collection Statement",
        description: "Receipts and collections with member, payment method, and status details.",
      },
      {
        key: "outstanding-dues",
        name: "Outstanding Dues",
        description: "Current net balance after payments, refunds, and approved waivers.",
      },
    ],
  },
  {
    group: "Maintenance & Procurement",
    icon: "build",
    reports: [
      {
        key: "complaint-ageing",
        name: "Complaint Ageing",
        description: "Complaints with urgency, ownership, status, and current age.",
      },
      {
        key: "work-orders",
        name: "Work Order Summary",
        description: "Procurement work orders with vendor, value, dates, and status.",
      },
      {
        key: "vendor-spend",
        name: "Vendor Spend Analysis",
        description: "Non-cancelled work-order count and total value by vendor.",
      },
      {
        key: "contracts",
        name: "Contract Register",
        description: "Contracts, validity dates, value, renewal setting, and status.",
      },
    ],
  },
  {
    group: "Members & Governance",
    icon: "people",
    reports: [
      {
        key: "member-directory",
        name: "Member Directory",
        description: "Members with unit, wing, contact, membership type, and status.",
      },
      {
        key: "applications",
        name: "Application Register",
        description: "Membership and NOC applications with submission and update dates.",
      },
      {
        key: "audit-trail",
        name: "Audit Trail",
        description: "The latest 5,000 society activity records for compliance review.",
      },
    ],
  },
] as const;

const FORMATS = [
  { key: "pdf", label: "PDF", icon: "picture_as_pdf" },
  { key: "xlsx", label: "Excel", icon: "table_view" },
  { key: "csv", label: "CSV", icon: "csv" },
  { key: "html", label: "Print", icon: "print" },
] as const;

export default function ReportsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-text-primary md:font-headline-lg md:text-headline-lg">
            Reports
          </h1>
          <p className="mt-1 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>
            Generate society-scoped reports in PDF, Excel, CSV, or print format.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {REPORT_GROUPS.map((group) => (
          <section key={group.group} className="queue-section">
            <div className="queue-section-header">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "18px", color: "#10B981" }}
                aria-hidden="true"
              >
                {group.icon}
              </span>
              <h2 className="font-headline-sm text-headline-sm text-text-primary">
                {group.group}
              </h2>
            </div>

            <div className="divide-y" style={{ borderColor: "#2a2a2a" }}>
              {group.reports.map((report) => (
                <div
                  key={report.key}
                  className="queue-item flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-body-sm text-body-sm font-medium text-text-primary">
                      {report.name}
                    </p>
                    <p
                      className="mt-0.5 font-body-sm text-body-sm"
                      style={{ color: "#6B7280", fontSize: "12px" }}
                    >
                      {report.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:ml-4 sm:shrink-0">
                    {FORMATS.map((format) => (
                      <a
                        key={format.key}
                        href={`/api/reports/${report.key}?format=${format.key}`}
                        target={format.key === "html" ? "_blank" : undefined}
                        rel={format.key === "html" ? "noreferrer" : undefined}
                        className="flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors hover:border-emerald-600 hover:text-emerald-400"
                        style={{
                          backgroundColor: "#1c1b1b",
                          color: "#D1D5DB",
                          border: "1px solid #333333",
                        }}
                        aria-label={`${report.name}: ${format.label}`}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "14px" }}
                          aria-hidden="true"
                        >
                          {format.icon}
                        </span>
                        {format.label}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div
        className="mt-4 rounded px-4 py-3"
        style={{ backgroundColor: "#1c1b1b", border: "1px solid #333333" }}
      >
        <p className="font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>
          Every generated report is restricted to the active society and recorded in the audit trail.
        </p>
      </div>
    </div>
  );
}
