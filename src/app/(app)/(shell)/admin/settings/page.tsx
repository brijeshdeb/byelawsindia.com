/**
 * Society Settings — live read from the societies table.
 *
 * Security: getServerContext() validates the user session and society scope.
 * Mutations (Edit / Save) are not yet implemented; those controls are hidden
 * until write operations, validation, and audit logging are ready.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerContext } from "@/lib/context";

export const metadata: Metadata = { title: "Society Settings | ByelawsIndia" };

interface SocietyRow {
  id: string;
  name: string;
  registration_number: string;
  society_type: string;
  address: string;
  city: string;
  state: string;
  pin_code: string;
  email: string;
  phone: string;
  website: string | null;
  pan: string | null;
  gstin: string | null;
  registered_at: string;
  is_active: boolean;
}

async function fetchSociety(societyId: string, supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>): Promise<SocietyRow | null> {
  const { data, error } = await supabase
    .from("societies")
    .select("id, name, registration_number, society_type, address, city, state, pin_code, email, phone, website, pan, gstin, registered_at, is_active")
    .eq("id", societyId)
    .single();

  if (error) {
    console.error("[admin/settings] fetch error:", error.message);
    return null;
  }
  return data as SocietyRow;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function Field({ label, value, readOnly = false }: { label: string; value: string | null; readOnly?: boolean }) {
  return (
    <div className="px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
      <p className="font-label-md text-label-md shrink-0 sm:min-w-[260px]" style={{ color: "#9CA3AF" }}>{label}</p>
      <div className="flex items-center gap-3 flex-1">
        <p className="font-body-sm text-body-sm text-text-primary">{value || "—"}</p>
        {readOnly && (
          <span
            className="font-label-md text-label-md px-2 py-0.5 rounded ml-2 hidden sm:inline"
            style={{ backgroundColor: "rgba(107,114,128,0.1)", color: "#6B7280", fontSize: "10px" }}
          >
            read-only
          </span>
        )}
      </div>
    </div>
  );
}

export default async function SettingsPage() {
  let ctx: Awaited<ReturnType<typeof getServerContext>>;
  try {
    ctx = await getServerContext();
  } catch {
    redirect("/login");
  }

  const society = await fetchSociety(ctx.societyId, ctx.supabase);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            Society Settings
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            Profile and configuration for this society
          </p>
        </div>
      </div>

      {!society ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "32px", color: "#6B7280" }} aria-hidden="true">
            error_outline
          </span>
          <p className="mt-3 font-body-sm text-body-sm" style={{ color: "#9CA3AF" }}>
            Unable to load society settings. Please try again.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Society Profile */}
          <div className="queue-section">
            <div className="queue-section-header">
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#10B981" }}>business</span>
              <h2 className="font-headline-sm text-headline-sm text-text-primary">Society Profile</h2>
            </div>
            <div className="divide-y" style={{ borderColor: "#2a2a2a" }}>
              <Field label="Society Name" value={society.name} />
              <Field label="Society Type" value={society.society_type} readOnly />
              <Field label="Registration Number" value={society.registration_number} readOnly />
              <Field
                label="Registered Since"
                value={formatDate(society.registered_at)}
                readOnly
              />
              <Field label="Status" value={society.is_active ? "Active" : "Inactive"} readOnly />
            </div>
          </div>

          {/* Contact & Location */}
          <div className="queue-section">
            <div className="queue-section-header">
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#10B981" }}>location_on</span>
              <h2 className="font-headline-sm text-headline-sm text-text-primary">Contact &amp; Location</h2>
            </div>
            <div className="divide-y" style={{ borderColor: "#2a2a2a" }}>
              <Field label="Registered Address" value={society.address} />
              <Field label="City" value={society.city} />
              <Field label="State" value={society.state} />
              <Field label="PIN Code" value={society.pin_code} />
              <Field label="Email" value={society.email} />
              <Field label="Phone" value={society.phone} />
              {society.website && <Field label="Website" value={society.website} />}
            </div>
          </div>

          {/* Tax & Compliance */}
          <div className="queue-section">
            <div className="queue-section-header">
              <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#10B981" }}>receipt_long</span>
              <h2 className="font-headline-sm text-headline-sm text-text-primary">Tax &amp; Compliance</h2>
            </div>
            <div className="divide-y" style={{ borderColor: "#2a2a2a" }}>
              <Field label="PAN" value={society.pan} readOnly />
              <Field label="GSTIN" value={society.gstin} readOnly />
            </div>
          </div>
        </div>
      )}

      {/* Coming next */}
      <div className="mt-4 px-4 py-3 rounded" style={{ backgroundColor: "#1c1b1b", border: "1px solid #333333" }}>
        <p className="font-body-sm text-body-sm" style={{ color: "#6B7280" }}>
          Billing policy, notification preferences, approval thresholds, and workflow configuration will be editable in the next release.
        </p>
      </div>
    </div>
  );
}
