/**
 * Platform Vendors — cross-tenant vendor directory.
 *
 * Security: createAdminClient() is called ONLY in this server component.
 * The service-role key never reaches the browser.
 * The parent layout.tsx confirms is_platform_admin from the DB before
 * this page is rendered.
 *
 * Search, status, and type filters are applied server-side via URL
 * searchParams — no client JS required.
 */

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyVendor } from "./actions";

// ── types ─────────────────────────────────────────────────────────────────────

interface Vendor {
  id: string;
  vendor_code: string;
  name: string;
  vendor_type: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  is_verified: boolean;
  created_at: string;
  societies: { name: string } | null;
}

// ── constants ─────────────────────────────────────────────────────────────────

const VENDOR_TYPE_LABELS: Record<string, string> = {
  CIVIL: "Civil",
  ELECTRICAL: "Electrical",
  PLUMBING: "Plumbing",
  SECURITY: "Security",
  HOUSEKEEPING: "Housekeeping",
  IT: "IT",
  LANDSCAPING: "Landscaping",
  OTHER: "Other",
};

type StatusStyle = { bg: string; color: string; label: string };

function getVendorStatusStyle(status: string): StatusStyle {
  switch (status) {
    case "ACTIVE":
      return { bg: "rgba(16,185,129,0.12)", color: "#10B981", label: "Active" };
    case "INACTIVE":
      return { bg: "rgba(245,158,11,0.12)", color: "#F59E0B", label: "Inactive" };
    case "BLACKLISTED":
      return { bg: "rgba(239,68,68,0.12)", color: "#EF4444", label: "Blacklisted" };
    default:
      return { bg: "rgba(156,163,175,0.12)", color: "#9CA3AF", label: status };
  }
}

// ── data fetching ─────────────────────────────────────────────────────────────

async function fetchVendors(
  search: string,
  status: string,
  type: string
): Promise<Vendor[]> {
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (err) {
    console.error("[platform/vendors] createAdminClient failed:", err);
    return [];
  }

  try {
    let query = admin
      .from("vendors")
      .select(
        "id, vendor_code, name, vendor_type, contact_name, email, phone, status, is_verified, created_at, societies(name)"
      )
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,vendor_code.ilike.%${search}%,contact_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    if (status === "active") query = query.eq("status", "ACTIVE");
    if (status === "inactive") query = query.eq("status", "INACTIVE");
    if (status === "blacklisted") query = query.eq("status", "BLACKLISTED");
    if (status === "verified") query = query.eq("is_verified", true);
    if (status === "unverified") query = query.eq("is_verified", false);

    if (type) query = query.eq("vendor_type", type.toUpperCase());

    const { data, error } = await query;
    if (error) {
      console.error("[platform/vendors] query error:", error.message);
      return [];
    }
    return (data ?? []) as unknown as Vendor[];
  } catch (err) {
    console.error("[platform/vendors] unexpected error:", err);
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

export default async function PlatformVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string }>;
}) {
  const params = await searchParams;
  const search = (params.q ?? "").trim();
  const status = (params.status ?? "").trim();
  const type = (params.type ?? "").trim();

  const vendors = await fetchVendors(search, status, type);
  const verifiedCount = vendors.filter((v) => v.is_verified).length;

  return (
    <div className="p-4 sm:p-8 max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1
            className="font-semibold"
            style={{ fontSize: "28px", color: "#FFFFFF" }}
          >
            Vendors
          </h1>
          <p style={{ fontSize: "14px", color: "#9CA3AF", marginTop: "4px" }}>
            {vendors.length} {vendors.length === 1 ? "vendor" : "vendors"}
            {search || status || type ? " match your filters" : " total"}
            {!search && !status && !type && vendors.length > 0
              ? ` — ${verifiedCount} verified`
              : ""}
          </p>
        </div>
        <Link
          href="/platform/vendors/new"
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-opacity hover:opacity-90 shrink-0"
          style={{ backgroundColor: "#10B981", color: "#FFFFFF" }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "16px" }}
            aria-hidden="true"
          >
            add
          </span>
          Add Vendor
        </Link>
      </div>

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
            placeholder="Name, code, contact…"
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
          <option value="blacklisted">Blacklisted</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>

        <select
          name="type"
          defaultValue={type}
          className="rounded px-3 py-2 text-sm outline-none"
          style={{
            backgroundColor: "#1E1E1E",
            border: "1px solid #333333",
            color: "#FFFFFF",
          }}
        >
          <option value="">All Types</option>
          {Object.entries(VENDOR_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k.toLowerCase()}>
              {v}
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

        {(search || status || type) && (
          <Link
            href="/platform/vendors"
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
                  "Vendor",
                  "Code",
                  "Type",
                  "Society",
                  "Contact",
                  "Status",
                  "Verified",
                  "Added",
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
              {vendors.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-14 text-center"
                    style={{ color: "#9CA3AF", fontSize: "14px" }}
                  >
                    {search || status || type
                      ? "No vendors match your filters."
                      : "No vendors registered yet."}
                  </td>
                </tr>
              ) : (
                vendors.map((v, idx) => {
                  const statusStyle = getVendorStatusStyle(v.status);
                  return (
                    <tr
                      key={v.id}
                      className="transition-colors hover:bg-[#242424]"
                      style={{
                        borderBottom:
                          idx < vendors.length - 1
                            ? "1px solid #333333"
                            : undefined,
                      }}
                    >
                      <td className="px-4 py-3">
                        <span
                          className="font-medium"
                          style={{ fontSize: "14px", color: "#FFFFFF" }}
                        >
                          {v.name}
                        </span>
                      </td>

                      <td
                        className="px-4 py-3"
                        style={{
                          fontSize: "12px",
                          color: "#9CA3AF",
                          fontFamily: "monospace",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {v.vendor_code}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: "rgba(96,165,250,0.12)",
                            color: "#60A5FA",
                          }}
                        >
                          {VENDOR_TYPE_LABELS[v.vendor_type] ?? v.vendor_type}
                        </span>
                      </td>

                      <td
                        className="px-4 py-3"
                        style={{
                          fontSize: "13px",
                          color: "#9CA3AF",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {v.societies?.name ?? (
                          <span style={{ color: "#EF4444", fontSize: "12px" }}>
                            Unknown
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div style={{ fontSize: "13px", color: "#9CA3AF" }}>
                          {v.contact_name && <div>{v.contact_name}</div>}
                          {v.phone && (
                            <div style={{ fontSize: "12px", marginTop: "2px" }}>
                              {v.phone}
                            </div>
                          )}
                          {!v.contact_name && !v.phone && (
                            <span style={{ color: "#4B5563", fontSize: "12px" }}>
                              N/A
                            </span>
                          )}
                        </div>
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

                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium"
                          style={{
                            color: v.is_verified ? "#10B981" : "#9CA3AF",
                          }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "14px" }}
                            aria-hidden="true"
                          >
                            {v.is_verified ? "verified" : "pending"}
                          </span>
                          {v.is_verified ? "Yes" : "No"}
                        </span>
                      </td>

                      <td
                        className="px-4 py-3"
                        style={{
                          fontSize: "13px",
                          color: "#9CA3AF",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatDate(v.created_at)}
                      </td>

                      <td className="px-4 py-3">
                        <form action={verifyVendor} className="inline">
                          <input type="hidden" name="vendorId" value={v.id} />
                          <button
                            type="submit"
                            className="text-xs font-medium transition-colors hover:text-white"
                            style={{
                              color: v.is_verified ? "#F59E0B" : "#10B981",
                            }}
                            title={
                              v.is_verified ? "Revoke verification" : "Verify vendor"
                            }
                          >
                            {v.is_verified ? "Unverify" : "Verify"}
                          </button>
                        </form>
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
