/**
 * Platform Contracts — cross-tenant contracts directory.
 *
 * Security: createAdminClient() is called ONLY in this server component.
 * The service-role key never reaches the browser.
 * The parent layout.tsx confirms is_platform_admin from the DB.
 *
 * Expiry colour coding:
 *   Red    = expired or ending in <= 7 days
 *   Amber  = ending in 8–30 days
 *   Green  = > 30 days remaining or no end date
 */

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

// ── types ─────────────────────────────────────────────────────────────────────

interface Contract {
  id: string;
  contract_number: string;
  title: string;
  value: number | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  auto_renew: boolean;
  created_at: string;
  societies: { name: string } | null;
  vendors: { name: string } | null;
}

// ── constants ─────────────────────────────────────────────────────────────────

type StatusStyle = { bg: string; color: string; label: string };

function getContractStatusStyle(status: string): StatusStyle {
  switch (status) {
    case "DRAFT":
      return { bg: "rgba(156,163,175,0.12)", color: "#9CA3AF", label: "Draft" };
    case "ACTIVE":
      return { bg: "rgba(16,185,129,0.12)", color: "#10B981", label: "Active" };
    case "EXPIRED":
      return { bg: "rgba(239,68,68,0.12)", color: "#EF4444", label: "Expired" };
    case "TERMINATED":
      return { bg: "rgba(239,68,68,0.12)", color: "#EF4444", label: "Terminated" };
    case "RENEWED":
      return { bg: "rgba(96,165,250,0.12)", color: "#60A5FA", label: "Renewed" };
    default:
      return { bg: "rgba(156,163,175,0.12)", color: "#9CA3AF", label: status };
  }
}

// ── data fetching ─────────────────────────────────────────────────────────────

async function fetchContracts(
  search: string,
  status: string
): Promise<Contract[]> {
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("[platform/contracts] createAdminClient failed:", err);
    return [];
  }

  try {
    let query = admin
      .from("contracts")
      .select(
        "id, contract_number, title, value, status, start_date, end_date, auto_renew, created_at, societies(name), vendors(name)"
      )
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `title.ilike.%${search}%,contract_number.ilike.%${search}%`
      );
    }

    if (status) query = query.eq("status", status.toUpperCase());

    const { data, error } = await query;
    if (error) {
      console.error("[platform/contracts] query error:", error.message);
      return [];
    }
    return (data ?? []) as unknown as Contract[];
  } catch (err) {
    console.error("[platform/contracts] unexpected error:", err);
    return [];
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Returns expiry badge style based on days remaining. */
function expiryStyle(endDate: string | null, status: string): {
  color: string;
  label: string;
} {
  if (!endDate || status === "EXPIRED" || status === "TERMINATED") {
    return { color: "#9CA3AF", label: endDate ? formatDate(endDate) : "—" };
  }
  const daysLeft = Math.ceil(
    (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (daysLeft <= 7)
    return { color: "#EF4444", label: formatDate(endDate) };
  if (daysLeft <= 30)
    return { color: "#F59E0B", label: formatDate(endDate) };
  return { color: "#9CA3AF", label: formatDate(endDate) };
}

// ── page ──────────────────────────────────────────────────────────────────────

export default async function PlatformContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = (params.q ?? "").trim();
  const status = (params.status ?? "").trim();

  const contracts = await fetchContracts(search, status);
  const activeCount = contracts.filter((c) => c.status === "ACTIVE").length;
  const expiringCount = contracts.filter((c) => {
    if (!c.end_date || c.status !== "ACTIVE") return false;
    const days = Math.ceil(
      (new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days <= 30;
  }).length;

  return (
    <div className="p-8 max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1
            className="font-semibold"
            style={{ fontSize: "28px", color: "#FFFFFF" }}
          >
            Contracts
          </h1>
          <p style={{ fontSize: "14px", color: "#9CA3AF", marginTop: "4px" }}>
            {contracts.length} {contracts.length === 1 ? "contract" : "contracts"}
            {search || status ? " match your filters" : " total"}
            {!search && !status && activeCount > 0
              ? ` — ${activeCount} active`
              : ""}
            {!search && !status && expiringCount > 0 ? (
              <span style={{ color: "#F59E0B", marginLeft: "6px" }}>
                ({expiringCount} expiring within 30 days)
              </span>
            ) : null}
          </p>
        </div>
      </div>

      {/* Expiry legend */}
      {!search && !status && (
        <div className="flex flex-wrap gap-4 text-xs" style={{ color: "#9CA3AF" }}>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: "#EF4444" }}
            />
            Expiring within 7 days or expired
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: "#F59E0B" }}
            />
            Expiring within 30 days
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: "#9CA3AF" }}
            />
            Active / No expiry
          </span>
        </div>
      )}

      {/* Filter bar */}
      <form method="GET" className="flex flex-wrap gap-3 items-center">
        <div
          className="flex items-center gap-2 rounded px-3 py-2"
          style={{
            backgroundColor: "#1E1E1E",
            border: "1px solid #333333",
            minWidth: "220px",
            flex: "1 1 220px",
            maxWidth: "340px",
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
            placeholder="Title or contract number…"
            className="bg-transparent outline-none text-sm w-full"
            style={{ color: "#FFFFFF" }}
            autoComplete="off"
          />
        </div>

        <select
          name="status"
          defaultValue={status}
          className="rounded px-3 py-2 text-sm outline-none"
          style={{
            backgroundColor: "#1E1E1E",
            border: "1px solid #333333",
            color: "#FFFFFF",
          }}
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="terminated">Terminated</option>
          <option value="renewed">Renewed</option>
        </select>

        <button
          type="submit"
          className="px-4 py-2 rounded text-sm font-medium"
          style={{ backgroundColor: "#10B981", color: "#FFFFFF" }}
        >
          Apply
        </button>

        {(search || status) && (
          <Link
            href="/platform/contracts"
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

      {/* Table */}
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
                  "Contract",
                  "Society",
                  "Vendor",
                  "Value",
                  "Status",
                  "Start Date",
                  "End Date",
                  "Auto-Renew",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3"
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
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
              {contracts.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-14 text-center"
                    style={{ color: "#9CA3AF", fontSize: "14px" }}
                  >
                    {search || status
                      ? "No contracts match your filters."
                      : "No contracts created yet."}
                  </td>
                </tr>
              ) : (
                contracts.map((c, idx) => {
                  const statusStyle = getContractStatusStyle(c.status);
                  const expiry = expiryStyle(c.end_date, c.status);
                  return (
                    <tr
                      key={c.id}
                      className="transition-colors hover:bg-[#242424]"
                      style={{
                        borderBottom:
                          idx < contracts.length - 1
                            ? "1px solid #333333"
                            : undefined,
                      }}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <span
                            className="font-medium"
                            style={{ fontSize: "14px", color: "#FFFFFF" }}
                          >
                            {c.title}
                          </span>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#9CA3AF",
                              fontFamily: "monospace",
                              marginTop: "2px",
                            }}
                          >
                            {c.contract_number}
                          </div>
                        </div>
                      </td>

                      <td
                        className="px-4 py-3"
                        style={{
                          fontSize: "13px",
                          color: "#9CA3AF",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.societies?.name ?? (
                          <span style={{ color: "#EF4444", fontSize: "12px" }}>
                            Unknown
                          </span>
                        )}
                      </td>

                      <td
                        className="px-4 py-3"
                        style={{ fontSize: "13px", color: "#9CA3AF" }}
                      >
                        {c.vendors?.name ?? (
                          <span style={{ color: "#4B5563", fontSize: "12px" }}>
                            —
                          </span>
                        )}
                      </td>

                      <td
                        className="px-4 py-3"
                        style={{
                          fontSize: "13px",
                          color: "#FFFFFF",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatCurrency(c.value)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.color,
                          }}
                        >
                          {statusStyle.label}
                        </span>
                      </td>

                      <td
                        className="px-4 py-3"
                        style={{ fontSize: "13px", color: "#9CA3AF", whiteSpace: "nowrap" }}
                      >
                        {formatDate(c.start_date)}
                      </td>

                      <td
                        className="px-4 py-3"
                        style={{
                          fontSize: "13px",
                          color: expiry.color,
                          whiteSpace: "nowrap",
                          fontWeight: expiry.color !== "#9CA3AF" ? 500 : 400,
                        }}
                      >
                        {expiry.label}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          style={{
                            fontSize: "12px",
                            color: c.auto_renew ? "#10B981" : "#9CA3AF",
                          }}
                        >
                          {c.auto_renew ? "Yes" : "No"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
