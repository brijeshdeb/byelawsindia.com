"use client";
import { useState } from "react";
import { NewApplicationModal } from "@/components/modals/NewApplicationModal";

interface Application {
  id: string;
  application_number: string;
  applicant_name: string;
  applicant_email: string | null;
  application_type: string;
  status: string;
  submitted_at: string | null;
  unit_number?: string | null;
  wing_name?: string | null;
}

interface Unit {
  id: string;
  unit_number: string;
  wing_name: string;
}

const statusColor: Record<string, { bg: string; text: string; border: string }> = {
  SUBMITTED: { bg: "rgba(99,102,241,0.1)", text: "#818CF8", border: "rgba(99,102,241,0.2)" },
  UNDER_REVIEW: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
  APPROVED: { bg: "rgba(16,185,129,0.1)", text: "#10B981", border: "rgba(16,185,129,0.2)" },
  REJECTED: { bg: "rgba(239,68,68,0.1)", text: "#EF4444", border: "rgba(239,68,68,0.2)" },
  WITHDRAWN: { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" },
};
const FALLBACK = { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" };

const DEMO_APPLICATIONS: Application[] = [
  { id: "demo-a1", application_number: "APP-2024-001", applicant_name: "Ramesh Iyer",    applicant_email: "ramesh.iyer@email.com",   application_type: "MEMBERSHIP",      status: "APPROVED",     submitted_at: "2024-04-10T09:00:00Z", unit_number: "4B",  wing_name: "Wing A" },
  { id: "demo-a2", application_number: "APP-2024-002", applicant_name: "Priya Menon",    applicant_email: "priya.menon@email.com",   application_type: "NOC_SALE",        status: "UNDER_REVIEW", submitted_at: "2024-07-22T11:30:00Z", unit_number: "7C",  wing_name: "Wing B" },
  { id: "demo-a3", application_number: "APP-2024-003", applicant_name: "Suresh Nair",    applicant_email: "suresh.nair@email.com",   application_type: "NOC_RENOVATION",  status: "SUBMITTED",    submitted_at: "2024-08-01T14:15:00Z", unit_number: "2A",  wing_name: "Wing A" },
  { id: "demo-a4", application_number: "APP-2024-004", applicant_name: "Kavitha Sharma", applicant_email: "kavitha.s@email.com",     application_type: "PARKING",         status: "APPROVED",     submitted_at: "2024-06-18T10:00:00Z", unit_number: "9D",  wing_name: "Wing B" },
  { id: "demo-a5", application_number: "APP-2024-005", applicant_name: "Ajay Kulkarni",  applicant_email: "ajay.kulkarni@email.com", application_type: "MEMBERSHIP",      status: "REJECTED",     submitted_at: "2024-05-03T08:45:00Z", unit_number: null,  wing_name: null },
  { id: "demo-a6", application_number: "APP-2024-006", applicant_name: "Deepa Krishnan", applicant_email: "deepa.k@email.com",       application_type: "NOC_SALE",        status: "SUBMITTED",    submitted_at: "2024-08-10T16:00:00Z", unit_number: "8D",  wing_name: "Wing B" },
];

function label(s: string) { return s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " "); }

function typeLabel(t: string) {
  const map: Record<string, string> = {
    MEMBERSHIP: "Membership",
    NOC_SALE: "NOC - Sale",
    NOC_RENOVATION: "NOC - Renovation",
    PARKING: "Parking",
    OTHER: "Other",
  };
  return map[t] ?? label(t);
}

export function ApplicationsClient({ applications, units }: { applications: Application[]; units: Unit[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const isDemo = applications.length === 0;
  const displayApplications = isDemo ? DEMO_APPLICATIONS : applications;

  return (
    <>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
              Applications
            </h1>
            <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
              Membership and NOC applications from members
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
            style={{ backgroundColor: "#10B981", color: "#fff" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
            New Application
          </button>
        </div>

        <div className="queue-section">
          {displayApplications.length === 0 ? (
            <div className="flex flex-col items-center py-16" style={{ color: "#6B7280" }}>
              <span className="material-symbols-outlined mb-3" style={{ fontSize: "40px" }}>description</span>
              <p className="text-sm">No applications yet.</p>
            </div>
          ) : (
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
                  {["App no.", "Applicant", "Type", "Unit", "Status", "Submitted"].map((h) => (
                    <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayApplications.map((row, i) => {
                  const sc = statusColor[row.status] ?? FALLBACK;
                  return (
                    <tr key={row.id} style={{ borderBottom: i < displayApplications.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                      <td className="px-4 py-3 font-mono" style={{ fontSize: "13px", color: "#10B981" }}>{row.application_number}</td>
                      <td className="px-4 py-3">
                        <p className="font-body-sm text-body-sm text-text-primary">{row.applicant_name}</p>
                        {row.applicant_email && <p className="text-xs" style={{ color: "#6B7280" }}>{row.applicant_email}</p>}
                      </td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{typeLabel(row.application_type)}</td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>
                        {row.unit_number ? `${row.wing_name ?? ""} ${row.unit_number}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                          {label(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>
                        {row.submitted_at ? new Date(row.submitted_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
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
                ? "Illustrative data. Live applications appear here once submitted."
                : `Showing ${displayApplications.length} application${displayApplications.length !== 1 ? "s" : ""}.`}
            </p>
          </div>
        </div>
      </div>

      <NewApplicationModal open={modalOpen} onClose={() => setModalOpen(false)} units={units} />
    </>
  );
}
