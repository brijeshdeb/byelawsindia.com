"use client";

import { useMemo, useState, useTransition } from "react";
import { provisionSocietyUserAction, revokeSocietyUserAccessAction } from "@/app/actions/society-users";

type Assignment = {
  assignment_id: string;
  user_id: string;
  full_name: string | null;
  email: string;
  role_id: string;
  role_name: string;
  wing_id: string | null;
  wing_name: string | null;
  is_active: boolean;
  last_sign_in_at: string | null;
  created_at: string;
};
type Role = { id: string; name: string; description: string | null };
type Wing = { id: string; name: string; code: string };
const inputClass = "w-full rounded border border-[#333] bg-[#171717] px-3 py-2 text-sm text-text-primary";

export function SocietyUsersClient({ currentUserId, canManage, assignments, roles, wings }: {
  currentUserId: string;
  canManage: boolean;
  assignments: Assignment[];
  roles: Role[];
  wings: Wing[];
}) {
  const [showInvite, setShowInvite] = useState(false);
  const [roleId, setRoleId] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const selectedRole = roles.find((role) => role.id === roleId);
  const activeAdmins = useMemo(() => assignments.filter((row) => row.is_active && row.role_name === "Society Admin" && !row.wing_id).length, [assignments]);

  function invite(formData: FormData) {
    startTransition(async () => {
      const result = await provisionSocietyUserAction({
        fullName: String(formData.get("fullName") ?? ""),
        email: String(formData.get("email") ?? ""),
        roleId: String(formData.get("roleId") ?? ""),
        wingId: String(formData.get("wingId") ?? "") || undefined,
      });
      if (!result.success) { setMessage(result.error); return; }
      setMessage(result.data.invited ? "Login invitation sent and access assigned." : "Existing login linked and access assigned.");
      setShowInvite(false);
      setRoleId("");
    });
  }

  function revoke(row: Assignment) {
    if (!window.confirm(`Deactivate ${row.role_name} access for ${row.full_name || row.email}?`)) return;
    startTransition(async () => {
      const result = await revokeSocietyUserAccessAction({ assignmentId: row.assignment_id });
      setMessage(result.success ? "Access deactivated." : result.error);
    });
  }

  return <div className="page-container">
    <div className="page-header">
      <div><h1 className="text-3xl font-bold text-text-primary">User Management</h1><p className="mt-1 text-sm text-[#9CA3AF]">Society logins, roles and wing access</p></div>
      {canManage ? <button onClick={() => setShowInvite((value) => !value)} className="flex items-center gap-2 rounded bg-[#10B981] px-4 py-2 text-sm font-medium text-white"><span className="material-symbols-outlined text-[18px]">person_add</span>{showInvite ? "Close" : "Invite User"}</button> : null}
    </div>
    {message ? <p className="mb-4 rounded border border-[#333] bg-[#1c1b1b] px-4 py-3 text-sm text-[#D1D5DB]">{message}</p> : null}
    {!canManage ? <div className="queue-section p-8 text-center text-sm text-[#9CA3AF]">Only a society-wide Society Admin can manage society logins.</div> : null}
    {canManage && showInvite ? <form action={invite} className="queue-section mb-5 grid gap-4 p-5 md:grid-cols-2">
      <div className="md:col-span-2"><h2 className="font-semibold text-text-primary">Invite or link a login</h2><p className="mt-1 text-sm text-[#9CA3AF]">Existing accounts are linked immediately. New customer accounts receive a secure password-setup invitation.</p></div>
      <label className="text-sm text-[#9CA3AF]">Full name<input name="fullName" required className={`${inputClass} mt-1`} /></label>
      <label className="text-sm text-[#9CA3AF]">Login email<input name="email" type="email" required className={`${inputClass} mt-1`} /></label>
      <label className="text-sm text-[#9CA3AF]">Role<select name="roleId" value={roleId} onChange={(event) => setRoleId(event.target.value)} required className={`${inputClass} mt-1`}><option value="">Select a role</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
      <label className="text-sm text-[#9CA3AF]">Scope<select name="wingId" disabled={!selectedRole || selectedRole.name === "Society Admin"} className={`${inputClass} mt-1 disabled:opacity-60`}><option value="">Society-wide</option>{wings.map((wing) => <option key={wing.id} value={wing.id}>{wing.name} ({wing.code})</option>)}</select></label>
      <button disabled={pending || !roleId} className="rounded bg-[#10B981] px-4 py-2 text-sm font-medium text-white disabled:opacity-60 md:col-span-2">Send invite & assign access</button>
    </form> : null}
    <div className="mb-4 grid gap-3 sm:grid-cols-3"><div className="queue-section p-4"><p className="text-xs text-[#6B7280]">Active assignments</p><p className="mt-1 text-2xl font-semibold text-text-primary">{assignments.filter((row) => row.is_active).length}</p></div><div className="queue-section p-4"><p className="text-xs text-[#6B7280]">Society Admins</p><p className="mt-1 text-2xl font-semibold text-text-primary">{activeAdmins}</p></div><div className="queue-section p-4"><p className="text-xs text-[#6B7280]">Safety rule</p><p className="mt-1 text-sm font-medium text-[#10B981]">At least one admin enforced</p></div></div>
    <div className="queue-section overflow-hidden">
      <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-3 border-b border-[#333] bg-[#1c1b1b] px-5 py-3 text-xs uppercase tracking-wide text-[#6B7280]"><span>User</span><span>Role</span><span>Scope</span><span>Action</span></div>
      {assignments.length === 0 ? <p className="p-10 text-center text-sm text-[#6B7280]">No access assignments found.</p> : assignments.map((row) => <div key={row.assignment_id} className={`grid grid-cols-[1.4fr_1fr_1fr_auto] items-center gap-3 border-b border-[#292929] px-5 py-4 text-sm ${row.is_active ? "" : "opacity-50"}`}><div><p className="font-medium text-text-primary">{row.full_name || "Unnamed user"}{row.user_id === currentUserId ? " (you)" : ""}</p><p className="text-xs text-[#6B7280]">{row.email}</p></div><div><p className="text-[#D1D5DB]">{row.role_name}</p><p className="text-xs text-[#6B7280]">{row.is_active ? "Active" : "Inactive"}</p></div><p className="text-[#9CA3AF]">{row.wing_name ?? "Society-wide"}</p><div>{canManage && row.is_active && row.user_id !== currentUserId ? <button disabled={pending || (row.role_name === "Society Admin" && activeAdmins <= 1)} onClick={() => revoke(row)} className="rounded border border-[#EF4444] px-3 py-1.5 text-xs text-[#EF4444] disabled:cursor-not-allowed disabled:opacity-40">Deactivate</button> : null}</div></div>)}
    </div>
  </div>;
}
