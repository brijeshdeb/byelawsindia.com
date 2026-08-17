/**
 * /platform/members — User Management
 *
 * Server component. Fetches all platform data via the service-role admin client
 * (createAdminClient), which bypasses RLS for cross-tenant reads.
 *
 * The layout's server guard has already verified is_platform_admin === true
 * before this page renders, so we only do data fetching here.
 *
 * Data fetched:
 *   - All profiles (ordered by created_at desc)
 *   - All active user_access_assignments, with society and role names
 *   - All active societies (for the Assign modal dropdown)
 *   - All roles (for the Assign modal dropdown)
 */

import { createAdminClient } from "@/lib/supabase/admin";
import {
  PlatformMembersClient,
  type UserRow,
  type AssignmentRow,
  type SocietyOption,
  type RoleOption,
} from "./PlatformMembersClient";

export const metadata = {
  title: "User Management | Platform Console",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StatPill = {
  label: string;
  value: number;
  icon: string;
  color: string;
  highlight?: boolean;
};

// ---------------------------------------------------------------------------
// Data layer
// ---------------------------------------------------------------------------

async function fetchMembersData(): Promise<{
  users: UserRow[];
  societies: SocietyOption[];
  roles: RoleOption[];
}> {
  const admin = createAdminClient();

  // Run all four queries in parallel.
  const [profilesResult, assignmentsResult, societiesResult, rolesResult] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, email, full_name, is_active, is_platform_admin, created_at")
        .order("created_at", { ascending: false }),

      admin
        .from("user_access_assignments")
        .select("id, user_id, society_id, role_id, societies(name), roles(name)")
        .eq("is_active", true),

      admin
        .from("societies")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true }),

      admin.from("roles").select("id, name").order("name", { ascending: true }),
    ]);

  // Build a map: user_id => AssignmentRow[]
  const assignmentsByUser = new Map<string, AssignmentRow[]>();

  for (const row of assignmentsResult.data ?? []) {
    // Supabase returns joined tables as nested objects or arrays.
    const society = Array.isArray(row.societies) ? row.societies[0] : row.societies;
    const role = Array.isArray(row.roles) ? row.roles[0] : row.roles;

    const assignment: AssignmentRow = {
      id: row.id,
      society_id: row.society_id,
      society_name: (society as { name?: string } | null)?.name ?? "Unknown Society",
      role_id: row.role_id,
      role_name: (role as { name?: string } | null)?.name ?? "Unknown Role",
    };

    const existing = assignmentsByUser.get(row.user_id) ?? [];
    existing.push(assignment);
    assignmentsByUser.set(row.user_id, existing);
  }

  const users: UserRow[] = (profilesResult.data ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    full_name: p.full_name ?? "",
    is_active: p.is_active,
    is_platform_admin: p.is_platform_admin,
    created_at: p.created_at,
    assignments: assignmentsByUser.get(p.id) ?? [],
  }));

  const societies: SocietyOption[] = (societiesResult.data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
  }));

  const roles: RoleOption[] = (rolesResult.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
  }));

  return { users, societies, roles };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PlatformMembersPage() {
  const { users, societies, roles } = await fetchMembersData();

  const totalUsers = users.length;
  const pendingCount = users.filter(
    (u) => u.assignments.length === 0 && !u.is_platform_admin && u.is_active
  ).length;
  const platformAdminCount = users.filter((u) => u.is_platform_admin).length;
  const activeWithAccessCount = users.filter(
    (u) => u.is_active && u.assignments.length > 0
  ).length;

  const stats: StatPill[] = [
    { label: "Total Users", value: totalUsers, icon: "group", color: "#9CA3AF" },
    {
      label: "Pending Review",
      value: pendingCount,
      icon: "hourglass_empty",
      color: pendingCount > 0 ? "#FBB724" : "#9CA3AF",
      highlight: pendingCount > 0,
    },
    {
      label: "Active with Access",
      value: activeWithAccessCount,
      icon: "check_circle",
      color: "#10B981",
    },
    {
      label: "Platform Admins",
      value: platformAdminCount,
      icon: "shield",
      color: "#10B981",
    },
  ];

  return (
    <div className="page-container">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">
            All registered users across the platform. Assign access to activate pending accounts.
          </p>
        </div>
      </div>

      {/* Summary stat pills */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5"
            style={{
              backgroundColor: stat.highlight ? "rgba(251,183,36,0.07)" : "#1E1E1E",
              border: stat.highlight
                ? "1px solid rgba(251,183,36,0.25)"
                : "1px solid #333333",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "16px", color: stat.color }}
              aria-hidden="true"
            >
              {stat.icon}
            </span>
            <span
              className="text-lg font-bold"
              style={{ color: stat.highlight ? "#FBB724" : "#FFFFFF" }}
            >
              {stat.value}
            </span>
            <span className="text-xs" style={{ color: "#9CA3AF" }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Client component: tabs, search, table, modals */}
      <PlatformMembersClient users={users} societies={societies} roles={roles} />
    </div>
  );
}
