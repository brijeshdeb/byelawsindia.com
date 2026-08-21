"use client";
import { useState } from "react";
import { NewApplicationModal } from "@/components/modals/NewApplicationModal";
import Link from "next/link";

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

function label(s: string) { return s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " "); }

function typeLabel(t: string) {
  const map: Record<string, string> = {
    MEMBERSHIP: "Membership",
    NOC_SALE: "NOC - Sale",
    NOC_RENOVATION: "NOC - Renovation",
    PARKING: "Parking",
    NOMINATION: "Nomination",
    ASSOCIATE_MEMBERSHIP: "Associate membership",
    OTHER: "Other",
  };
  return map[t] ?? label(t);
}

export function ApplicationsClient({ applications, units }: { applications: Application[]; units: Unit[] }) {
  const [modalOpen, setModalOpen] = useState(false);

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
          {applications.length === 0 ? (
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
                {applications.map((row, i) => {
                  const sc = statusColor[row.status] ?? FALLBACK;
                  return (
                    <tr key={row.id} style={{ borderBottom: i < applications.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                      <td className="px-4 py-3 font-mono" style={{ fontSize: "13px", color: "#10B981" }}><Link href={`/applications/${row.id}`} className="underline-offset-2 hover:underline">{row.application_number}</Link></td>
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
            <p className="font-body-sm text-body-sm" style={{ color: "#6B7280" }}>
              {`Showing ${applications.length} application${applications.length !== 1 ? "s" : ""}.`}
            </p>
          </div>
        </div>
      </div>

      <NewApplicationModal open={modalOpen} onClose={() => setModalOpen(false)} units={units} />
    </>
  );
}
