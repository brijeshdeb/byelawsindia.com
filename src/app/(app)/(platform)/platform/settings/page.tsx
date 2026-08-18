/**
 * Platform Settings — audit log viewer and platform configuration overview.
 *
 * Security: createAdminClient() is called ONLY in this server component.
 * The service-role key never reaches the browser.
 * The parent layout.tsx confirms is_platform_admin from the DB.
 *
 * Audit log rows are shown newest-first. The 100-row default limit
 * is intentional: full export belongs in a dedicated reporting feature.
 */

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

// ── types ─────────────────────────────────────────────────────────────────────

interface AuditLog {
  id: string;
  created_at: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_user_id: string | null;
  society_id: string | null;
  ip_address: string | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}

// ── data fetching ─────────────────────────────────────────────────────────────

async function fetchAuditLogs(
  search: string,
  action: string,
  limit: number
): Promise<AuditLog[]> {
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("[platform/settings] createAdminClient failed:", err);
    return [];
  }

  try {
    let query = admin
      .from("audit_logs")
      .select(
        "id, created_at, action, entity_type, entity_id, actor_user_id, society_id, ip_address, new_values, metadata"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (action) query = query.eq("action", action.toUpperCase());
    if (search) {
      query = query.or(
        `action.ilike.%${search}%,entity_type.ilike.%${search}%,entity_id.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error("[platform/settings] audit query error:", error.message);
      return [];
    }
    return (data ?? []) as AuditLog[];
  } catch (err) {
    console.error("[platform/settings] unexpected error:", err);
    return [];
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function actionColor(action: string): string {
  if (action.includes("CREATED") || action.includes("REGISTERED"))
    return "#10B981";
  if (
    action.includes("DELETED") ||
    action.includes("SUSPENDED") ||
    action.includes("TERMINATED") ||
    action.includes("BLACKLISTED") ||
    action.includes("REVOKED") ||
    action.includes("DEACTIVATED") ||
    action.includes("REJECTED")
  )
    return "#EF4444";
  if (action.includes("UPDATED") || action.includes("CHANGED"))
    return "#F59E0B";
  if (action.includes("LOGIN") || action.includes("LOGOUT"))
    return "#60A5FA";
  return "#9CA3AF";
}

// ── page ──────────────────────────────────────────────────────────────────────

const PAGE_LIMITS = [50, 100, 250];

export default async function PlatformSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const search = (params.q ?? "").trim();
  const action = (params.action ?? "").trim();
  const limit = Math.min(
    250,
    Math.max(50, parseInt(params.limit ?? "100", 10) || 100)
  );

  const logs = await fetchAuditLogs(search, action, limit);

  return (
    <div className="p-8 max-w-screen-xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1
          className="font-semibold"
          style={{ fontSize: "28px", color: "#FFFFFF" }}
        >
          Platform Settings
        </h1>
        <p style={{ fontSize: "14px", color: "#9CA3AF", marginTop: "4px" }}>
          Audit log and platform configuration overview
        </p>
      </div>

      {/* Platform info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Platform",
            value: "ByelawsIndia",
            sub: "Co-operative Housing Society Management",
          },
          {
            label: "Region",
            value: "eu-west-1",
            sub: "Supabase project: aowyyuflapyvknndqxth",
          },
          {
            label: "Audit Retention",
            value: "Append-only",
            sub: "No update or delete policies on audit_logs",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl p-5"
            style={{
              backgroundColor: "#1E1E1E",
              border: "1px solid #333333",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: "#9CA3AF",
                marginBottom: "8px",
              }}
            >
              {card.label}
            </p>
            <p
              className="font-semibold"
              style={{ fontSize: "18px", color: "#FFFFFF" }}
            >
              {card.value}
            </p>
            <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px" }}>
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Audit log section */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h2
              className="font-semibold"
              style={{ fontSize: "18px", color: "#FFFFFF" }}
            >
              Audit Log
            </h2>
            <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "2px" }}>
              {logs.length} {logs.length === 1 ? "entry" : "entries"} shown
              {search || action ? " (filtered)" : ` — last ${limit}`}
            </p>
          </div>
        </div>

        {/* Audit filter bar */}
        <form method="GET" className="flex flex-wrap gap-3 items-center mb-4">
          <div
            className="flex items-center gap-2 rounded px-3 py-2"
            style={{
              backgroundColor: "#1E1E1E",
              border: "1px solid #333333",
              minWidth: "200px",
              flex: "1 1 200px",
              maxWidth: "300px",
            }}
          >
            <span
              className="material-symbols-outlined shrink-0"
              style={{ fontSize: "18px", color: "#9CA3AF" }}
              aria-hidden="true"
            >
              search
            </span>
            <input
              name="q"
              defaultValue={search}
              placeholder="Action, entity type, ID…"
              className="bg-transparent outline-none text-sm w-full"
              style={{ color: "#FFFFFF" }}
              autoComplete="off"
            />
          </div>

          <select
            name="action"
            defaultValue={action}
            className="rounded px-3 py-2 text-sm outline-none"
            style={{
              backgroundColor: "#1E1E1E",
              border: "1px solid #333333",
              color: "#FFFFFF",
            }}
          >
            <option value="">All Actions</option>
            <optgroup label="Authentication">
              <option value="LOGIN_SUCCESS">Login Success</option>
              <option value="LOGIN_FAILED">Login Failed</option>
              <option value="LOGOUT">Logout</option>
            </optgroup>
            <optgroup label="User Management">
              <option value="USER_CREATED">User Created</option>
              <option value="USER_INVITED">User Invited</option>
              <option value="USER_DEACTIVATED">User Deactivated</option>
              <option value="ACCESS_ASSIGNED">Access Assigned</option>
              <option value="ACCESS_REVOKED">Access Revoked</option>
            </optgroup>
            <optgroup label="Vendors">
              <option value="VENDOR_CREATED">Vendor Created</option>
              <option value="VENDOR_VERIFIED">Vendor Verified</option>
              <option value="VENDOR_SUSPENDED">Vendor Suspended</option>
              <option value="VENDOR_BLACKLISTED">Vendor Blacklisted</option>
            </optgroup>
            <optgroup label="Platform">
              <option value="SOCIETY_REGISTERED">Society Registered</option>
              <option value="PLATFORM_CONTEXT_SWITCHED">Context Switched</option>
            </optgroup>
          </select>

          <select
            name="limit"
            defaultValue={String(limit)}
            className="rounded px-3 py-2 text-sm outline-none"
            style={{
              backgroundColor: "#1E1E1E",
              border: "1px solid #333333",
              color: "#FFFFFF",
            }}
          >
            {PAGE_LIMITS.map((l) => (
              <option key={l} value={String(l)}>
                Last {l}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-4 py-2 rounded text-sm font-medium"
            style={{ backgroundColor: "#10B981", color: "#FFFFFF" }}
          >
            Apply
          </button>

          {(search || action) && (
            <Link
              href="/platform/settings"
              className="px-4 py-2 rounded text-sm"
              style={{
                backgroundColor: "#1E1E1E",
                border: "1px solid #333333",
                color: "#9CA3AF",
              }}
            >
              Clear
            </Link>
          )}
        </form>

        {/* Audit log table */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    backgroundColor: "#161616",
                    borderBottom: "1px solid #333333",
                  }}
                >
                  {[
                    "Timestamp",
                    "Action",
                    "Entity",
                    "Actor",
                    "IP",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3"
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase" as const,
                        color: "#9CA3AF",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-14 text-center"
                      style={{ color: "#9CA3AF", fontSize: "14px" }}
                    >
                      {search || action
                        ? "No audit entries match your filters."
                        : "No audit entries recorded yet."}
                    </td>
                  </tr>
                ) : (
                  logs.map((log, idx) => (
                    <tr
                      key={log.id}
                      className="transition-colors hover:bg-[#242424]"
                      style={{
                        borderBottom:
                          idx < logs.length - 1
                            ? "1px solid #333333"
                            : undefined,
                      }}
                    >
                      <td
                        className="px-4 py-3"
                        style={{
                          fontSize: "12px",
                          color: "#9CA3AF",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDateTime(log.created_at)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className="text-xs font-medium font-mono"
                          style={{ color: actionColor(log.action) }}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div style={{ fontSize: "12px" }}>
                          <span style={{ color: "#FFFFFF" }}>
                            {log.entity_type}
                          </span>
                          {log.entity_id && (
                            <div
                              style={{
                                color: "#9CA3AF",
                                fontSize: "11px",
                                fontFamily: "monospace",
                                marginTop: "2px",
                                wordBreak: "break-all",
                                maxWidth: "180px",
                              }}
                            >
                              {log.entity_id.slice(0, 16)}…
                            </div>
                          )}
                        </div>
                      </td>

                      <td
                        className="px-4 py-3"
                        style={{
                          fontSize: "11px",
                          color: "#9CA3AF",
                          fontFamily: "monospace",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {log.actor_user_id
                          ? log.actor_user_id.slice(0, 8) + "…"
                          : "system"}
                      </td>

                      <td
                        className="px-4 py-3"
                        style={{
                          fontSize: "12px",
                          color: "#9CA3AF",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {log.ip_address ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {logs.length === limit && (
          <p
            className="mt-3 text-center"
            style={{ fontSize: "12px", color: "#9CA3AF" }}
          >
            Showing the {limit} most recent entries. Use the limit selector
            above to see more, or increase to 250.
          </p>
        )}
      </div>
    </div>
  );
}
