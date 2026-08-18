/**
 * Add Vendor page.
 *
 * Server component: fetches the list of active societies using the admin client
 * (service role, bypasses RLS — valid here because platform admins are entitled
 * to see all societies and this page is behind the is_platform_admin gate in
 * the parent layout).
 *
 * Passes the list to NewVendorForm (client component) as a prop.
 * No society data touches the browser — only id + name, which are not sensitive.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { NewVendorForm, type SocietyOption } from "./NewVendorForm";

export const metadata: Metadata = {
  title: "Add Vendor | ByelawsIndia Admin",
};

async function fetchActiveSocieties(): Promise<SocietyOption[]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("societies")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("[vendors/new] societies fetch error:", error.message);
      return [];
    }
    return (data as SocietyOption[]) ?? [];
  } catch (err) {
    console.error("[vendors/new] createAdminClient failed:", err);
    return [];
  }
}

export default async function AddVendorPage() {
  const societies = await fetchActiveSocieties();

  return (
    <div
      style={{
        padding: "32px 40px",
        maxWidth: "760px",
        minHeight: "100%",
      }}
    >
      {/* Back link */}
      <Link
        href="/platform/console"
        className="inline-flex items-center gap-1.5 mb-8 text-xs transition-opacity hover:opacity-100"
        style={{ color: "rgba(156,163,175,0.6)" }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "15px" }}
          aria-hidden="true"
        >
          arrow_back
        </span>
        Back to Console
      </Link>

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="flex items-center justify-center rounded-lg shrink-0"
            style={{
              width: "36px",
              height: "36px",
              backgroundColor: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.25)",
            }}
            aria-hidden="true"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "20px", color: "#10B981" }}
            >
              storefront
            </span>
          </div>
          <h1
            className="font-semibold"
            style={{ color: "#FFFFFF", fontSize: "22px" }}
          >
            Add Vendor
          </h1>
        </div>
        <p style={{ color: "#9CA3AF", fontSize: "13px", lineHeight: "1.6" }}>
          Adds a vendor to a specific society. The vendor code is auto-generated.
          After adding, assign the vendor to contracts from the society dashboard.
        </p>
      </div>

      {/* Form */}
      <NewVendorForm societies={societies} />
    </div>
  );
}
