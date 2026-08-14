"use client";
import { useState } from "react";
import { NewComplaintModal } from "@/components/modals/NewComplaintModal";

interface Complaint {
  id: string;
  title: string;
  urgency: string;
  status: string;
  location: string | null;
  created_at: string;
}

const urgencyColor: Record<string, { bg: string; text: string; border: string }> = {
  LOW: { bg: "rgba(107,114,128,0.1)", text: "#9CA3AF", border: "rgba(107,114,128,0.2)" },
  NORMAL: { bg: "rgba(99,102,241,0.1)", text: "#818CF8", border: "rgba(99,102,241,0.2)" },
  HIGH: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
  CRITICAL: { bg: "rgba(239,68,68,0.1)", text: "#EF4444", border: "rgba(239,68,68,0.2)" },
};
const statusColor: Record<string, { bg: string; text: string; border: string }> = {
  OPEN: { bg: "rgba(245,158,11,0.1)", text: "#F59E0B", border: "rgba(245,158,11,0.2)" },
  IN_PROGRESS: { bg: "rgba(99,102,241,0.1)", text: "#818CF8", border: "rgba(99,102,241,0.2)" },
  RESOLVED: { bg: "rgba(16,185,129,0.1)", text: "#10B981", border: "rgba(16,185,129,0.2)" },
  CLOSED: { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" },
};
const FALLBACK = { bg: "rgba(107,114,128,0.1)", text: "#6B7280", border: "rgba(107,114,128,0.2)" };

const DEMO_COMPLAINTS: Complaint[] = [
  { id: "demo-c1", title: "Lift in Wing A not working",          urgency: "HIGH",     status: "IN_PROGRESS", location: "Wing A – Lift lobby",  created_at: "2024-08-01T09:30:00Z" },
  { id: "demo-c2", title: "Water leakage on 3rd floor corridor", urgency: "CRITICAL", status: "OPEN",        location: "Wing B – 3rd floor",   created_at: "2024-08-05T14:00:00Z" },
  { id: "demo-c3", title: "Terrace drain blocked",               urgency: "NORMAL",   status: "OPEN",        location: "Terrace – Block C",    created_at: "2024-08-07T11:00:00Z" },
  { id: "demo-c4", title: "Parking gate motor malfunction",      urgency: "HIGH",     status: "IN_PROGRESS", location: "Basement parking – P1", created_at: "2024-08-08T08:45:00Z" },
  { id: "demo-c5", title: "Common area light replacement",       urgency: "LOW",      status: "RESOLVED",    location: "Ground floor corridor", created_at: "2024-07-28T16:00:00Z" },
  { id: "demo-c6", title: "Garden tap dripping",                 urgency: "LOW",      status: "CLOSED",      location: "Garden – east end",    created_at: "2024-07-20T10:00:00Z" },
];

function label(s: string) { return s.charAt(0) + s.slice(1).toLowerCase().replace("_", " "); }

export function ComplaintsClient({ complaints }: { complaints: Complaint[] }) {
  const isDemo = complaints.length === 0;
  const displayComplaints = isDemo ? DEMO_COMPLAINTS : complaints;
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
              Complaints
            </h1>
            <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
              Maintenance issues and complaints raised by members
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
            style={{ backgroundColor: "#10B981", color: "#fff" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
            Log Complaint
          </button>
        </div>

        <div className="queue-section">
          {displayComplaints.length === 0 ? (
            <div className="flex flex-col items-center py-16" style={{ color: "#6B7280" }}>
              <span className="material-symbols-outlined mb-3" style={{ fontSize: "40px" }}>build</span>
              <p className="text-sm">No complaints logged. All clear!</p>
            </div>
          ) : (
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
                  {["Title", "Urgency", "Location", "Status", "Raised on"].map((h) => (
                    <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayComplaints.map((row, i) => {
                  const uc = urgencyColor[row.urgency] ?? FALLBACK;
                  const sc = statusColor[row.status] ?? FALLBACK;
                  return (
                    <tr key={row.id} style={{ borderBottom: i < displayComplaints.length - 1 ? "1px solid #2a2a2a" : "none" }}>
                      <td className="px-4 py-3 font-body-sm text-body-sm text-text-primary">{row.title}</td>
                      <td className="px-4 py-3">
                        <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: uc.bg, color: uc.text, border: `1px solid ${uc.border}` }}>
                          {label(row.urgency)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>{row.location ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="font-label-md text-label-md px-2 py-0.5 rounded" style={{ backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}>
                          {label(row.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>
                        {new Date(row.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
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
                ? "Illustrative data. Live complaints appear here once logged."
                : `Showing ${displayComplaints.length} complaint${displayComplaints.length !== 1 ? "s" : ""}.`}
            </p>
          </div>
        </div>
      </div>

      <NewComplaintModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
