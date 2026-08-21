import type { Metadata } from "next";
import Link from "next/link";
import { getServerContext } from "@/lib/context";
import { PERMISSIONS } from "@/types";
import { requirePermission, resolveUserContext } from "@/server/services/AccessService";
import { StatutoryImport } from "./StatutoryImport";

export const metadata: Metadata = { title: "Form I & Form J Registers" };

function displayDate(value: string | null) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN") : "-";
}

export default async function StatutoryRegistersPage() {
  const { supabase, societyId, wingId } = await getServerContext();
  const context = await resolveUserContext(societyId, wingId);
  requirePermission(context, PERMISSIONS.MEMBER_READ);

  const [{ data: society }, { data: members }, { data: snapshots }] = await Promise.all([
    supabase.from("societies").select("name, registration_number").eq("id", societyId).single(),
    supabase
      .from("members")
      .select("id, full_name, member_type, status, effective_from, effective_until, address, units(unit_number, wings(name))")
      .eq("society_id", societyId)
      .order("member_number", { ascending: true }),
    supabase
      .from("form_register_snapshots")
      .select("id, version, form_type, row_count, generated_at")
      .eq("society_id", societyId)
      .order("version", { ascending: false })
      .limit(10),
  ]);

  const missingAddresses = (members ?? []).filter((member) => !member.address).length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Form I & Form J</h1>
          <p className="page-subtitle">
            Statutory member registers for {society?.name ?? "the selected society"}. Every download creates an immutable filing snapshot.
          </p>
        </div>
      </div>

      {missingAddresses > 0 && (
        <div className="rounded-lg px-4 py-3 mb-5 text-sm" style={{ backgroundColor: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", color: "#FBBF24" }}>
          {missingAddresses} member{missingAddresses === 1 ? " is" : "s are"} missing a statutory address. The export will leave those cells blank until the member record is completed.
        </div>
      )}

      {!context.isPlatformAdmin&&context.permissions.has(PERMISSIONS.MEMBER_UPDATE)?<StatutoryImport/>:null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-7">
        {[
          {
            code: "i",
            title: "Form I - Membership Register",
            description: "Admission, entrance fee, occupation, age, nomination, cessation and remarks in the supplied 13-column format.",
          },
          {
            code: "j",
            title: "Form J - List of Members",
            description: "Flat, member name, address, class of membership and active/inactive status in the supplied 6-column format.",
          },
        ].map((form) => (
          <section key={form.code} className="rounded-xl p-6" style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}>
            <div>
              <div>
                <span className="material-symbols-outlined mb-3" style={{ color: "#10B981", fontSize: 28 }}>table_view</span>
                <h2 className="text-base font-semibold text-white">{form.title}</h2>
                <p className="text-sm mt-2 leading-6" style={{ color: "#9CA3AF" }}>{form.description}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2"><Link href={`/api/members/statutory-registers/${form.code}`} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium" style={{ backgroundColor: "#10B981", color: "white" }}><span className="material-symbols-outlined" style={{ fontSize: 17 }}>table_view</span>Excel</Link><Link href={`/api/members/statutory-registers/${form.code}?format=pdf`} className="inline-flex items-center gap-2 rounded-lg border border-[#444] px-4 py-2 text-sm text-[#D1D5DB]"><span className="material-symbols-outlined" style={{ fontSize: 17 }}>picture_as_pdf</span>PDF</Link><Link href={`/api/members/statutory-registers/${form.code}?format=html`} target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-[#444] px-4 py-2 text-sm text-[#D1D5DB]"><span className="material-symbols-outlined" style={{ fontSize: 17 }}>print</span>Print</Link></div>
          </section>
        ))}
      </div>

      <section className="rounded-xl overflow-hidden mb-7" style={{ border: "1px solid #333333" }}>
        <div className="px-5 py-4" style={{ backgroundColor: "#1E1E1E", borderBottom: "1px solid #333333" }}>
          <h2 className="text-sm font-semibold text-white">Current register preview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead style={{ backgroundColor: "#161616" }}>
              <tr>
                {["Sr.No", "Flat", "Member", "Address", "Class", "Status", "Admission"].map((heading) => (
                  <th key={heading} className="text-left px-4 py-3 text-xs uppercase tracking-wide" style={{ color: "#6B7280" }}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ backgroundColor: "#1E1E1E" }}>
              {(members ?? []).slice(0, 50).map((member: any, index) => (
                <tr key={member.id} style={{ borderTop: "1px solid #2A2A2A" }}>
                  <td className="px-4 py-3" style={{ color: "#9CA3AF" }}>{index + 1}</td>
                  <td className="px-4 py-3 text-white">{member.units?.unit_number ?? "-"}</td>
                  <td className="px-4 py-3 text-white">{member.full_name}</td>
                  <td className="px-4 py-3" style={{ color: member.address ? "#D1D5DB" : "#FBBF24" }}>{member.address || "Missing"}</td>
                  <td className="px-4 py-3" style={{ color: "#D1D5DB" }}>{member.member_type.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3" style={{ color: member.status === "ACTIVE" ? "#10B981" : "#9CA3AF" }}>{member.status}</td>
                  <td className="px-4 py-3" style={{ color: "#9CA3AF" }}>{displayDate(member.effective_from)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl overflow-hidden" style={{ border: "1px solid #333333" }}>
        <div className="px-5 py-4" style={{ backgroundColor: "#1E1E1E", borderBottom: "1px solid #333333" }}>
          <h2 className="text-sm font-semibold text-white">Recent immutable snapshots</h2>
        </div>
        {(snapshots ?? []).length === 0 ? (
          <p className="px-5 py-8 text-sm" style={{ color: "#6B7280" }}>No statutory register has been exported yet.</p>
        ) : (
          <div className="divide-y" style={{ backgroundColor: "#1E1E1E", borderColor: "#2A2A2A" }}>
            {(snapshots ?? []).map((snapshot) => (
              <div key={snapshot.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm text-white">{snapshot.form_type === "FORM_I" ? "Form I" : "Form J"} - snapshot #{snapshot.version}</p>
                  <p className="text-xs mt-1" style={{ color: "#6B7280" }}>{new Date(snapshot.generated_at).toLocaleString("en-IN")}</p>
                </div>
                <span className="text-xs" style={{ color: "#9CA3AF" }}>{snapshot.row_count} rows</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
