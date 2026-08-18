/**
 * Platform Societies — cross-tenant directory of all registered societies.
 *
 * Security: createAdminClient() is called ONLY in this server component,
 * after the parent layout.tsx has confirmed is_platform_admin = true from
 * the database. The service-role key never reaches the browser.
 *
 * Search and status filter are applied server-side via URL searchParams so
 * the page remains a pure React Server Component with no client bundle.
 */

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { switchToSociety } from "../console/actions";

// ── types ─────────────────────────────────────────────────────────────────────

interface Society {
  id: string;
  name: string;
  registration_number: string;
  society_type: string;
  city: string;
  state: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

// ── data fetching ─────────────────────────────────────────────────────────────

async function fetchSocieties(
  search: string,
  status: string
): Promise<Society[]> {
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("[platform/societies] createAdminClient failed:", err);
    return [];
  }

  try {
    let query = admin
      .from("societies")
      .select(
        "id, name, registration_number, society_type, city, state, email, phone, is_active, created_at"
      )
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,city.ilike.%${search}%,registration_number.ilike.%${search}%,state.ilike.%${search}%`
      );
    }

    if (status === "active") query = query.eq("is_active", true);
    if (status === "inactive") query = query.eq("is_active", false);

    const { data, error } = await query;
    if (error) {
      console.error("[platform/societies] query error:", error.message);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.error("[platform/societies] unexpected error:", err);
    return [];
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── page ──────────────────────────────────────────────────────────────────────

export default async function PlatformSocietiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = (params.q ?? "").trim();
  const status = (params.status ?? "").trim();

  const societies = await fetchSocieties(search, status);
  const activeCount = societies.filter((s) => s.is_active).length;

  return (
    <div className="p-4 sm:p-8 max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1
            className="font-semibold"
            style={{ fontSize: "28px", color: "#FFFFFF" }}
          >
            Societies
          </h1>
          <p style={{ fontSize: "14px", color: "#9CA3AF", marginTop: "4px" }}>
            {societies.length} {status === "active" ? "active" : status === "inactive" ? "inactive" : "total"}{" "}
            {societies.length === 1 ? "society" : "societies"}
            {search ? ` matching "${search}"` : ""}
            {!search && !status && activeCount < societies.length
              ? ` — ${activeCount} active`
              : ""}
          </p>
        </div>
        <Link
          href="/platform/societies/new"
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-opacity hover:opacity-90 shrink-0"
          style={{ backgroundColor: "#10B981", color: "#FFFFFF" }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "16px" }}
            aria-hidden="true"
          >
            add_business
          </span>
          Register New Society
        </Link>
      </div>

      {/* Search + filter bar */}
      <form method="GET" className="flex flex-wrap gap-3 items-center">
        <div
          className="flex items-center gap-2 rounded px-3 py-2"
          style={{
            backgroundColor: "#1E1E1E",
            border: "1px solid #333333",
            minWidth: "240px",
            flex: "1 1 240px",
            maxWidth: "380px",
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
            placeholder="Name, city, reg. number…"
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
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
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
            href="/platform/societies"
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
                  "Society Name",
                  "Reg. Number",
                  "Type",
                  "Location",
                  "Contact",
                  "Status",
                  "Registered",
                  "Action",
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
              {societies.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-14 text-center"
                    style={{ color: "#9CA3AF", fontSize: "14px" }}
                  >
                    {search || status
                      ? "No societies match your filters."
                      : "No societies registered yet."}
                  </td>
                </tr>
              ) : (
                societies.map((s, idx) => (
                  <tr
                    key={s.id}
                    className="transition-colors hover:bg-[#242424]"
                    style={{
                      borderBottom:
                        idx < societies.length - 1
                          ? "1px solid #333333"
                          : undefined,
                    }}
                  >
                    <td className="px-4 py-3">
                      <span
                        className="font-medium"
                        style={{ fontSize: "14px", color: "#FFFFFF" }}
                      >
                        {s.name}
                      </span>
                    </td>

                    <td
                      className="px-4 py-3"
                      style={{ fontSize: "13px", color: "#9CA3AF", whiteSpace: "nowrap" }}
                    >
                      {s.registration_number}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: "rgba(96,165,250,0.12)",
                          color: "#60A5FA",
                        }}
                      >
                        {s.society_type}
                      </span>
                    </td>

                    <td
                      className="px-4 py-3"
                      style={{ fontSize: "13px", color: "#9CA3AF", whiteSpace: "nowrap" }}
                    >
                      {s.city}, {s.state}
                    </td>

                    <td className="px-4 py-3">
                      <div style={{ fontSize: "13px", color: "#9CA3AF" }}>
                        <div>{s.phone}</div>
                        <div style={{ fontSize: "12px", marginTop: "2px" }}>
                          {s.email}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={
                          s.is_active
                            ? {
                                backgroundColor: "rgba(16,185,129,0.12)",
                                color: "#10B981",
                              }
                            : {
                                backgroundColor: "rgba(245,158,11,0.12)",
                                color: "#F59E0B",
                              }
                        }
                      >
                        {s.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td
                      className="px-4 py-3"
                      style={{ fontSize: "13px", color: "#9CA3AF", whiteSpace: "nowrap" }}
                    >
                      {formatDate(s.created_at)}
                    </td>

                    <td className="px-4 py-3">
                      <form action={switchToSociety} className="inline">
                        <input type="hidden" name="societyId" value={s.id} />
                        <button
                          type="submit"
                          className="text-xs font-medium transition-colors hover:text-white"
                          style={{ color: "#10B981" }}
                          title={`Enter ${s.name} dashboard`}
                        >
                          Switch
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
