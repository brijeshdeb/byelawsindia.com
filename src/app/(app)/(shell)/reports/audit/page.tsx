import type { Metadata } from "next";
import { getServerContext } from "@/lib/context";

export const metadata: Metadata = { title: "Audit Trail" };

interface AuditRow {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  ip_address: string | null;
  created_at: string;
  actor_user_id: string | null;
}

interface ProfileRow {
  id: string;
  email: string;
  full_name: string;
}

function isFailureAction(action: string): boolean {
  return (
    action.includes("FAIL") ||
    action.includes("DENIED") ||
    action.includes("REJECTED")
  );
}

export default async function AuditPage() {
  const { supabase, societyId } = await getServerContext();

  // Fetch the 100 most recent audit records for this society.
  const { data: logData } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, ip_address, created_at, actor_user_id")
    .eq("society_id", societyId)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows: AuditRow[] = (logData ?? []) as AuditRow[];

  // Two-step: resolve actor UUIDs to human-readable names via profiles.
  const actorIds = [
    ...new Set(rows.map((r) => r.actor_user_id).filter((id): id is string => id != null)),
  ];

  let profileMap: Record<string, string> = {};
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", actorIds);

    profileMap = Object.fromEntries(
      ((profiles ?? []) as ProfileRow[]).map((p) => [
        p.id,
        (p.full_name ?? "").trim() !== "" ? p.full_name : p.email,
      ])
    );
  }

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
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded font-label-md text-label-md"
          style={{ backgroundColor: "#1c1b1b", color: "#6B7280", border: "1px solid #333333" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>info</span>
          Last {rows.length} records
        </div>
      </div>

      {/* Read-only notice */}
      <div
        className="flex items-start gap-3 mb-5 px-4 py-3 rounded"
        style={{ backgroundColor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}
      >
        <span className="material-symbols-outlined mt-0.5" style={{ fontSize: "16px", color: "#F59E0B" }}>lock</span>
        <p className="font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>
          Audit records are append-only. No entry can be edited or deleted, including by platform administrators.
          All writes go through the service role client; RLS blocks any update or delete via the authenticated key.
        </p>
      </div>

      <div className="queue-section">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center py-16" style={{ color: "#6B7280" }}>
            <span className="material-symbols-outlined mb-3" style={{ fontSize: "40px" }}>history</span>
            <p className="text-sm">No audit records found for this society.</p>
            <p className="text-xs mt-1" style={{ color: "#4B5563" }}>
              Records appear here once actions are taken. You may also need the audit.read permission.
            </p>
          </div>
        ) : (
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#1c1b1b", borderBottom: "1px solid #333333" }}>
                {["Event ID", "Actor", "Action", "Target", "IP Address", "Timestamp", "Result"].map((h) => (
                  <th key={h} className="font-label-md text-label-md text-left px-4 py-3" style={{ color: "#6B7280" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const actor =
                  row.actor_user_id && profileMap[row.actor_user_id]
                    ? profileMap[row.actor_user_id]
                    : row.actor_user_id
                      ? `...${row.actor_user_id.slice(-8)}`
                      : "system";

                const failure = isFailureAction(row.action);
                const target = row.entity_id
                  ? `${row.entity_type}:${row.entity_id.slice(-12)}`
                  : row.entity_type || "—";

                const ts = new Date(row.created_at).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                });

                return (
                  <tr
                    key={row.id}
                    style={{ borderBottom: i < rows.length - 1 ? "1px solid #2a2a2a" : "none" }}
                  >
                    <td className="px-4 py-3 font-mono" style={{ fontSize: "11px", color: "#6B7280" }}>
                      {row.id.slice(-12).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-mono" style={{ fontSize: "12px", color: "#9CA3AF" }}>
                      {actor}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="font-mono"
                        style={{ fontSize: "12px", color: failure ? "#EF4444" : "#10B981" }}
                      >
                        {row.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono" style={{ fontSize: "12px", color: "#9CA3AF" }}>
                      {target}
                    </td>
                    <td className="px-4 py-3 font-mono" style={{ fontSize: "12px", color: "#6B7280" }}>
                      {row.ip_address ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono" style={{ fontSize: "12px", color: "#9CA3AF" }}>
                      {ts}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="font-label-md text-label-md px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: failure ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                          color: failure ? "#EF4444" : "#10B981",
                          border: `1px solid ${failure ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`,
                        }}
                      >
                        {failure ? "Failure" : "Success"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
