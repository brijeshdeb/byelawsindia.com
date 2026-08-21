/**
 * Dashboard — Stitch Obsidian design.
 *
 * Typography uses the Obsidian type scale via Tailwind class pairs:
 *   font-{name} text-{name}  (e.g. font-headline-sm text-headline-sm)
 *
 * Layout: summary strip + personalized work queue + upcoming obligations + access context.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { resolveUserContext, CONTEXT_COOKIE } from "@/server/services/AccessService";
import { createClient } from "@/lib/supabase/server";
import { AppError } from "@/types";
import { safeJsonParse } from "@/lib/utils";
import { PERMISSIONS } from "@/types";
import { hasPermission, hasAnyPermission } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/auth";
import type { UserContext } from "@/types";

export const metadata: Metadata = {
  title: "Dashboard",
};

interface ContextCookie {
  societyId: string;
  wingId: string | null;
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CONTEXT_COOKIE)?.value ?? null;
  const ctx = safeJsonParse<ContextCookie>(raw);

  if (!ctx?.societyId) {
    // Platform admins don't use society context — send them straight to the console.
    const currentUser = await getCurrentUser();
    if (currentUser?.is_platform_admin) {
      redirect("/platform/console");
    }
    redirect("/select-context");
  }

  let userContext: UserContext;
  try {
    userContext = await resolveUserContext(ctx.societyId, ctx.wingId ?? null);
  } catch (err) {
    if (err instanceof AppError) {
      redirect("/select-context?error=" + encodeURIComponent(err.code));
    }
    redirect("/select-context?error=unexpected");
  }

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const canViewApplications = userContext.isPlatformAdmin ||
    hasAnyPermission(userContext, [
      PERMISSIONS.APPLICATION_VIEW,
      PERMISSIONS.APPLICATION_CREATE,
      PERMISSIONS.APPLICATION_APPROVE_LEVEL1,
      PERMISSIONS.APPLICATION_APPROVE_LEVEL2,
      PERMISSIONS.APPLICATION_APPROVE_FINAL,
    ]);

  const canViewMembers = userContext.isPlatformAdmin ||
    hasAnyPermission(userContext, [PERMISSIONS.MEMBER_VIEW, PERMISSIONS.MEMBER_CREATE]);

  const canViewFinance = userContext.isPlatformAdmin ||
    hasPermission(userContext, PERMISSIONS.FINANCE_VIEW);

  const canViewMaintenance = userContext.isPlatformAdmin ||
    hasPermission(userContext, PERMISSIONS.MAINTENANCE_VIEW);

  // Live summary counts — parallel queries, each falls back to 0 on RLS miss.
  const supabase = await createClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [membersRes, openAppsRes, overdueAppsRes, complaintsRes, duesRes] = await Promise.all([
    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("society_id", ctx.societyId)
      .eq("status", "ACTIVE"),
    supabase
      .from("member_applications")
      .select("*", { count: "exact", head: true })
      .eq("society_id", ctx.societyId)
      .in("status", ["SUBMITTED", "UNDER_REVIEW"]),
    supabase
      .from("member_applications")
      .select("*", { count: "exact", head: true })
      .eq("society_id", ctx.societyId)
      .in("status", ["SUBMITTED", "UNDER_REVIEW"])
      .lt("submitted_at", sevenDaysAgo),
    supabase
      .from("maintenance_complaints")
      .select("*", { count: "exact", head: true })
      .eq("society_id", ctx.societyId)
      .in("status", ["OPEN", "IN_PROGRESS"]),
    supabase
      .from("finance_dues")
      .select("*", { count: "exact", head: true })
      .eq("society_id", ctx.societyId)
      .in("status", ["UNPAID", "PARTIALLY_PAID"]),
  ]);

  const memberCount  = membersRes.count    ?? 0;
  const openApps     = openAppsRes.count   ?? 0;
  const overdueApps  = overdueAppsRes.count ?? 0;
  const openCmps     = complaintsRes.count  ?? 0;
  const unpaidDues   = duesRes.count        ?? 0;

  type QueueItem = { id:string; title:string; detail:string; href:string; tone?:"warning"|"danger" };
  const workQueue:QueueItem[]=[];
  const upcoming:QueueItem[]=[];

  const {data:memberApprovalInstances}=canViewApplications&&!userContext.isPlatformAdmin
    ? await supabase.from("approval_instances").select("id,entity_id,current_step_order,submitted_at").eq("society_id",ctx.societyId).eq("entity_type","MEMBER_APPLICATION").eq("status","PENDING").order("submitted_at").limit(25)
    : {data:[]};
  const actionableMemberInstances=(memberApprovalInstances??[]).filter((instance)=>{
    const step=Number(instance.current_step_order);
    if(step===1)return userContext.permissions.has(PERMISSIONS.APPLICATION_APPROVE_LEVEL1);
    if(step===2)return userContext.permissions.has(PERMISSIONS.APPLICATION_APPROVE_LEVEL2);
    return step===3&&userContext.roleName==="Society Admin"&&!userContext.wingId&&userContext.permissions.has(PERMISSIONS.APPLICATION_APPROVE_FINAL);
  });
  if(actionableMemberInstances.length){
    const ids=actionableMemberInstances.map((instance)=>instance.entity_id);
    const{data:applications}=await supabase.from("member_applications").select("id,application_number,applicant_name,status").eq("society_id",ctx.societyId).in("id",ids);
    const stageById=new Map(actionableMemberInstances.map((instance)=>[instance.entity_id,Number(instance.current_step_order)]));
    for(const application of applications??[])workQueue.push({id:`application-${application.id}`,title:`${application.application_number} · ${application.applicant_name}`,detail:`Membership approval · Stage ${stageById.get(application.id)??1} of 3`,href:`/applications/${application.id}`});
  }

  const isSocietyAdmin=!userContext.isPlatformAdmin&&userContext.roleName==="Society Admin"&&!userContext.wingId;
  const [financeQueue,serviceQueue,renewalQueue]=await Promise.all([
    isSocietyAdmin&&userContext.permissions.has(PERMISSIONS.FINANCE_ADJUSTMENT_APPROVE)
      ? supabase.from("finance_adjustment_requests").select("id,adjustment_type,amount,reason,requested_at").eq("society_id",ctx.societyId).eq("status","PENDING").neq("requested_by",userContext.userId).order("requested_at").limit(10)
      : Promise.resolve({data:[]}),
    !userContext.isPlatformAdmin&&(userContext.permissions.has(PERMISSIONS.SERVICE_REQUEST_PROCESS)||(isSocietyAdmin&&userContext.permissions.has(PERMISSIONS.SERVICE_REQUEST_APPROVE)))
      ? supabase.from("service_requests").select("id,request_number,title,status,priority,created_at").eq("society_id",ctx.societyId).in("status",["SUBMITTED","UNDER_REVIEW","APPROVED","IN_PROGRESS"]).order("created_at").limit(10)
      : Promise.resolve({data:[]}),
    isSocietyAdmin&&userContext.permissions.has(PERMISSIONS.CONTRACT_RENEWAL_MANAGE)
      ? supabase.from("contract_renewals").select("id,renewal_number,status,response_due_at,contracts(title)").eq("society_id",ctx.societyId).eq("status","VENDOR_QUOTED").order("submitted_at").limit(10)
      : Promise.resolve({data:[]}),
  ]);
  for(const request of financeQueue.data??[])workQueue.push({id:`finance-${request.id}`,title:`${request.adjustment_type} · INR ${Number(request.amount).toLocaleString("en-IN")}`,detail:request.reason,href:"/finance/payments",tone:"warning"});
  for(const request of serviceQueue.data??[])workQueue.push({id:`service-${request.id}`,title:`${request.request_number} · ${request.title}`,detail:`${request.priority} priority · ${request.status.replace(/_/g," ")}`,href:"/service-requests",tone:request.priority==="URGENT"?"danger":undefined});
  for(const renewal of renewalQueue.data??[]){const contract=renewal.contracts as unknown as {title:string}|null;workQueue.push({id:`renewal-${renewal.id}`,title:`${renewal.renewal_number} · ${contract?.title??"Contract renewal"}`,detail:"Vendor quotation awaiting Society Admin decision",href:"/procurement/contracts",tone:"warning"});}

  const todayIso=new Date().toISOString().slice(0,10);
  const inNinetyDays=new Date(Date.now()+90*86_400_000).toISOString().slice(0,10);
  const inThirtyDays=new Date(Date.now()+30*86_400_000).toISOString().slice(0,10);
  const [expiringContracts,expiringVendorDocuments,overdueDues]=await Promise.all([
    supabase.from("contracts").select("id,contract_number,title,end_date").eq("society_id",ctx.societyId).in("status",["ACTIVE","RENEWAL_INITIATED"]).gte("end_date",todayIso).lte("end_date",inNinetyDays).order("end_date").limit(8),
    supabase.from("vendor_documents").select("id,title,expires_on,vendors(name)").eq("society_id",ctx.societyId).gte("expires_on",todayIso).lte("expires_on",inThirtyDays).neq("status","REPLACED").order("expires_on").limit(8),
    canViewFinance?supabase.from("finance_dues").select("id,due_type,due_date,amount").eq("society_id",ctx.societyId).in("status",["UNPAID","PARTIALLY_PAID"]).lt("due_date",todayIso).order("due_date").limit(8):Promise.resolve({data:[]}),
  ]);
  for(const contract of expiringContracts.data??[])upcoming.push({id:`contract-${contract.id}`,title:`${contract.contract_number} · ${contract.title}`,detail:`Expires ${new Date(contract.end_date!).toLocaleDateString("en-IN")}`,href:"/procurement/contracts",tone:"warning"});
  for(const document of expiringVendorDocuments.data??[]){const vendor=document.vendors as unknown as {name:string}|null;upcoming.push({id:`vendor-document-${document.id}`,title:document.title,detail:`${vendor?.name??"Vendor"} · expires ${new Date(document.expires_on!).toLocaleDateString("en-IN")}`,href:"/vendors",tone:"warning"});}
  for(const due of overdueDues.data??[])upcoming.push({id:`due-${due.id}`,title:`Overdue ${due.due_type.replace(/_/g," ")}`,detail:`INR ${Number(due.amount).toLocaleString("en-IN")} · due ${new Date(due.due_date).toLocaleDateString("en-IN")}`,href:"/finance/dues",tone:"danger"});

  return (
    <div className="page-container">

      {/* Page header — flat, no card */}
      <div className="page-header">
        <div>
          {/* headline-lg-mobile on mobile, headline-lg on desktop — Obsidian type scale */}
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-text-primary">
            {userContext.societyName}
          </h1>
          <p className="font-body-sm text-body-sm mt-1" style={{ color: "#9CA3AF" }}>
            {userContext.wingName
              ? `${userContext.wingName} (${userContext.wingCode}) | ${userContext.roleName}`
              : `Society-Wide | ${userContext.roleName}`}
          </p>
        </div>
        {/* label-md for small metadata text */}
        <p
          className="font-label-md text-label-md hidden sm:block"
          style={{ color: "#6B7280" }}
        >
          {today}
        </p>
      </div>

      {/* Summary strip — one continuous bar, not four equal cards */}
      <div className="summary-strip mb-6">
        <SummaryItem
          value={String(memberCount)}
          label="Members registered"
          href={canViewMembers ? "/members" : undefined}
        />
        <SummaryItem
          value={String(openApps)}
          label="Applications open"
          flag={overdueApps > 0 ? `${overdueApps} overdue` : "0 overdue"}
          flagVariant={overdueApps > 0 ? "warning" : "neutral"}
          href={canViewApplications ? "/applications" : undefined}
        />
        <SummaryItem
          value={String(openCmps)}
          label="Maintenance requests"
          href={canViewMaintenance ? "/maintenance/complaints" : undefined}
        />
        <SummaryItem
          value={String(unpaidDues)}
          label="Dues outstanding"
          href={canViewFinance ? "/finance/dues" : undefined}
        />
      </div>

      {/* Main content: work queue + upcoming, side by side at lg */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Work queue — items needing the user's action */}
        <div className="lg:col-span-2 queue-section">
          <div className="queue-section-header">
            {/* headline-sm (20px/28px/600) matches Obsidian section heading */}
            <p className="font-headline-sm text-headline-sm text-text-primary">
              Awaiting your action
            </p>
          </div>

          {workQueue.length===0?<div className="flex flex-col items-center py-10" style={{ color: "#6B7280" }}>
            <span className="material-symbols-outlined mb-3" style={{ fontSize: "36px" }}>task_alt</span>
            <p className="text-sm" style={{ color: "#9CA3AF" }}>Nothing currently requires your action.</p>
          </div>:workQueue.slice(0,12).map((item)=><DashboardItem key={item.id} item={item}/>) }

          <div
            className="px-6 py-3"
            style={{ backgroundColor: "#1c1b1b", borderTop: "1px solid #333333" }}
          >
            <p className="font-body-sm text-body-sm italic" style={{ color: "#6B7280" }}>
              {workQueue.length} actionable item{workQueue.length===1?"":"s"} in your current society and role.
            </p>
          </div>
        </div>

        {/* Right column: upcoming + access context */}
        <div className="space-y-6">

          {/* Upcoming statutory / workflow obligations */}
          <div className="queue-section">
            <div className="queue-section-header">
              <p className="font-headline-sm text-headline-sm text-text-primary">Upcoming</p>
            </div>
            {upcoming.length===0?<div className="flex flex-col items-center py-8" style={{ color: "#6B7280" }}>
              <span className="material-symbols-outlined mb-2" style={{ fontSize: "28px" }}>event_available</span>
              <p className="text-xs text-center" style={{ color: "#6B7280" }}>No contract, document, or dues deadlines are approaching.</p>
            </div>:upcoming.slice(0,8).map((item)=><DashboardItem key={item.id} item={item} compact/>)}
          </div>

          {/* Access context card */}
          <div className="queue-section">
            <div className="queue-section-header">
              <p className="font-headline-sm text-headline-sm text-text-primary">Your access</p>
            </div>
            <div className="px-4 py-3">
              <dl className="space-y-2">
                <ContextRow
                  label="Signed in as"
                  value={userContext.isPlatformAdmin ? "Platform Admin" : (userContext.profile.full_name ?? userContext.profile.email ?? "—")}
                />
                <ContextRow label="Society" value={userContext.societyName} />
                <ContextRow
                  label="Wing"
                  value={userContext.wingName
                    ? `${userContext.wingName} (${userContext.wingCode})`
                    : "Society-Wide"}
                />
                <ContextRow label="Role" value={userContext.isPlatformAdmin ? "Super Admin" : userContext.roleName} />
                <ContextRow label="Permissions" value={userContext.isPlatformAdmin ? "All (platform admin)" : `${userContext.permissions.size} granted`} />
              </dl>
            </div>
          </div>

        </div>
      </div>

      {/* Footer note */}
      <p
        className="font-body-sm text-body-sm pt-4"
        style={{ color: "#6B7280", borderTop: "1px solid #333333" }}
      >
        Summary counts, role-specific actions, and upcoming obligations are live from the active society.
      </p>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────── */

function SummaryItem({
  value,
  label,
  flag,
  flagVariant = "neutral",
  href,
}: {
  value: string;
  label: string;
  flag?: string;
  flagVariant?: "neutral" | "warning" | "danger";
  href?: string;
}) {
  const flagColor =
    flagVariant === "danger"
      ? "#EF4444"
      : flagVariant === "warning"
        ? "#F59E0B"
        : "#6B7280";

  const content = (
    <div className="summary-strip-item">
      <div className="summary-strip-value">
        {value}
        {flag && (
          <span
            className="summary-strip-flag font-label-md"
            style={{ color: flagColor }}
          >
            {flag}
          </span>
        )}
      </div>
      {/* label-md: 12px/16px/600/0.05em tracking — matches Obsidian card label style */}
      <p className="font-label-md text-label-md" style={{ color: "#9CA3AF" }}>
        {label}
      </p>
    </div>
  );

  if (href) {
    // Hover handled by .summary-strip-item:hover in globals.css
    return (
      <Link
        href={href}
        className="block"
        style={{
          flex: 1,
          borderRight: "1px solid #333333",
          textDecoration: "none",
        }}
      >
        {content}
      </Link>
    );
  }

  return content;
}

function DashboardItem({item,compact=false}:{item:{title:string;detail:string;href:string;tone?:"warning"|"danger"};compact?:boolean}){
  const color=item.tone==="danger"?"#EF4444":item.tone==="warning"?"#F59E0B":"#10B981";
  return <Link href={item.href} className={`block border-b border-[#292929] hover:bg-[#1c1b1b] ${compact?"px-4 py-3":"px-6 py-4"}`}><div className="flex items-start gap-3"><span className="material-symbols-outlined mt-0.5" style={{fontSize:compact?"17px":"19px",color}}>{item.tone==="danger"?"error":item.tone==="warning"?"schedule":"task"}</span><div className="min-w-0"><p className="truncate text-sm font-medium text-text-primary">{item.title}</p><p className="mt-0.5 text-xs text-[#6B7280]">{item.detail}</p></div></div></Link>;
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-border-subtle last:border-b-0">
      {/* label-md for the key */}
      <dt className="font-label-md text-label-md shrink-0" style={{ color: "#6B7280" }}>
        {label}
      </dt>
      {/* body-sm for the value */}
      <dd
        className="font-body-sm text-body-sm font-medium text-right truncate"
        style={{ maxWidth: "55%", color: "#FFFFFF" }}
      >
        {value}
      </dd>
    </div>
  );
}
