"use client";

/**
 * PlatformMembersClient
 *
 * Client component for the /platform/members page.
 *
 * Responsibilities:
 *   - Tab switching: "Pending Review" vs "All Users"
 *   - Search/filter by name or email (client-side, no round-trip)
 *   - "Assign Access" modal: society + role selects, submit via useActionState
 *   - "Revoke" per assignment row, also via useActionState
 *   - router.refresh() after successful mutations to re-run the server fetch
 *
 * Data is fetched server-side and passed as props; this component owns no fetch logic.
 */

import { useState, useEffect, useActionState, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { assignUserAccess, revokeUserAccess, inviteUser, type ActionResult } from "./actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AssignmentRow {
  id: string;
  society_id: string;
  society_name: string;
  role_id: string;
  role_name: string;
}

export interface UserRow {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_platform_admin: boolean;
  created_at: string;
  assignments: AssignmentRow[];
}

export interface SocietyOption {
  id: string;
  name: string;
}

export interface RoleOption {
  id: string;
  name: string;
}

interface Props {
  users: UserRow[];
  societies: SocietyOption[];
  roles: RoleOption[];
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialResult: ActionResult = { success: false, error: null };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// AssignModal
// ---------------------------------------------------------------------------

interface AssignModalProps {
  user: UserRow;
  societies: SocietyOption[];
  roles: RoleOption[];
  onClose: () => void;
  onSuccess: () => void;
}

function AssignModal({ user, societies, roles, onClose, onSuccess }: AssignModalProps) {
  const [state, formAction, isPending] = useActionState(assignUserAccess, initialResult);
  const formRef = useRef<HTMLFormElement>(null);

  // Dismiss on success.
  useEffect(() => {
    if (state.success) {
      onSuccess();
    }
  }, [state.success, onSuccess]);

  // Close on Escape.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(2px)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-xl"
        style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid #333333" }}
        >
          <div>
            <h2
              id="assign-modal-title"
              className="text-base font-semibold"
              style={{ color: "#FFFFFF" }}
            >
              Assign Access
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
              {user.full_name || user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 transition-colors"
            style={{ color: "#9CA3AF" }}
            aria-label="Close modal"
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(255,255,255,0.05)";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF";
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              close
            </span>
          </button>
        </div>

        {/* Form */}
        <form ref={formRef} action={formAction} className="px-6 py-5 space-y-4">
          <input type="hidden" name="userId" value={user.id} />

          {/* Society select */}
          <div>
            <label
              htmlFor="societyId"
              className="block text-xs font-medium mb-1.5"
              style={{ color: "#9CA3AF", letterSpacing: "0.05em", textTransform: "uppercase" }}
            >
              Society *
            </label>
            <select
              id="societyId"
              name="societyId"
              required
              className="w-full rounded px-3 py-2.5 text-sm focus:outline-none transition-colors"
              style={{
                backgroundColor: "#161616",
                border: "1px solid #333333",
                color: "#FFFFFF",
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLSelectElement).style.borderColor = "#10B981";
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLSelectElement).style.borderColor = "#333333";
              }}
            >
              <option value="">Select a society...</option>
              {societies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Role select */}
          <div>
            <label
              htmlFor="roleId"
              className="block text-xs font-medium mb-1.5"
              style={{ color: "#9CA3AF", letterSpacing: "0.05em", textTransform: "uppercase" }}
            >
              Role *
            </label>
            <select
              id="roleId"
              name="roleId"
              required
              className="w-full rounded px-3 py-2.5 text-sm focus:outline-none transition-colors"
              style={{
                backgroundColor: "#161616",
                border: "1px solid #333333",
                color: "#FFFFFF",
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLSelectElement).style.borderColor = "#10B981";
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLSelectElement).style.borderColor = "#333333";
              }}
            >
              <option value="">Select a role...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Error */}
          {state.error && !state.success && (
            <p
              className="flex items-center gap-2 text-sm rounded px-3 py-2"
              style={{ color: "#EF4444", backgroundColor: "rgba(239,68,68,0.08)" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                error
              </span>
              {state.error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded transition-colors"
              style={{ color: "#9CA3AF", backgroundColor: "transparent" }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(255,255,255,0.05)";
                (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded transition-opacity disabled:opacity-60"
              style={{ backgroundColor: "#10B981", color: "#FFFFFF" }}
            >
              {isPending ? (
                <>
                  <span
                    className="material-symbols-outlined animate-spin"
                    style={{ fontSize: "16px" }}
                  >
                    progress_activity
                  </span>
                  Assigning...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    add_circle
                  </span>
                  Assign Access
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// InviteUserModal
// ---------------------------------------------------------------------------

interface InviteUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const INVITE_INPUT_STYLE = {
  backgroundColor: "#161616",
  border: "1px solid #333333",
  color: "#FFFFFF",
  borderRadius: "6px",
  padding: "10px 12px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
};

function InviteUserModal({ onClose, onSuccess }: InviteUserModalProps) {
  const [state, formAction, isPending] = useActionState(inviteUser, initialResult);

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(2px)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-xl"
        style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid #333333" }}
        >
          <div>
            <h2
              id="invite-modal-title"
              className="text-base font-semibold"
              style={{ color: "#FFFFFF" }}
            >
              Invite User
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
              A sign-up link will be emailed to the address below.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 transition-colors"
            style={{ color: "#9CA3AF" }}
            aria-label="Close modal"
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(255,255,255,0.05)";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF";
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
              close
            </span>
          </button>
        </div>

        {/* Form */}
        <form action={formAction} className="px-6 py-5 space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="invite-email"
              className="block text-xs font-medium mb-1.5"
              style={{ color: "#9CA3AF", letterSpacing: "0.05em", textTransform: "uppercase" }}
            >
              Email Address <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              id="invite-email"
              name="email"
              type="email"
              required
              placeholder="user@example.com"
              autoComplete="email"
              className="focus:outline-none transition-colors"
              style={INVITE_INPUT_STYLE}
              onFocus={(e) =>
                ((e.currentTarget as HTMLInputElement).style.borderColor = "#10B981")
              }
              onBlur={(e) =>
                ((e.currentTarget as HTMLInputElement).style.borderColor = "#333333")
              }
            />
          </div>

          {/* Full name */}
          <div>
            <label
              htmlFor="invite-full-name"
              className="block text-xs font-medium mb-1.5"
              style={{ color: "#9CA3AF", letterSpacing: "0.05em", textTransform: "uppercase" }}
            >
              Full Name (optional)
            </label>
            <input
              id="invite-full-name"
              name="full_name"
              type="text"
              placeholder="Display name"
              autoComplete="name"
              className="focus:outline-none transition-colors"
              style={INVITE_INPUT_STYLE}
              onFocus={(e) =>
                ((e.currentTarget as HTMLInputElement).style.borderColor = "#10B981")
              }
              onBlur={(e) =>
                ((e.currentTarget as HTMLInputElement).style.borderColor = "#333333")
              }
            />
          </div>

          {/* Error */}
          {state.error && !state.success && (
            <p
              className="flex items-center gap-2 text-sm rounded px-3 py-2"
              style={{ color: "#EF4444", backgroundColor: "rgba(239,68,68,0.08)" }}
              role="alert"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                error
              </span>
              {state.error}
            </p>
          )}

          {/* Success */}
          {state.success && (
            <p
              className="flex items-center gap-2 text-sm rounded px-3 py-2"
              style={{ color: "#10B981", backgroundColor: "rgba(16,185,129,0.08)" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                check_circle
              </span>
              Invite sent successfully.
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded transition-colors"
              style={{ color: "#9CA3AF", backgroundColor: "transparent" }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(255,255,255,0.05)";
                (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded transition-opacity disabled:opacity-60"
              style={{ backgroundColor: "#10B981", color: "#FFFFFF" }}
            >
              {isPending ? (
                <>
                  <span
                    className="material-symbols-outlined animate-spin"
                    style={{ fontSize: "16px" }}
                  >
                    progress_activity
                  </span>
                  Sending...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                    send
                  </span>
                  Send Invite
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RevokeButton — inline form per assignment
// ---------------------------------------------------------------------------

interface RevokeButtonProps {
  assignmentId: string;
  userId: string;
  societyId: string;
  onSuccess: () => void;
}

function RevokeButton({ assignmentId, userId, societyId, onSuccess }: RevokeButtonProps) {
  const [state, formAction, isPending] = useActionState(revokeUserAccess, initialResult);

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="societyId" value={societyId} />
      <button
        type="submit"
        disabled={isPending}
        className="text-xs rounded px-2 py-0.5 transition-colors disabled:opacity-50"
        style={{ color: "#EF4444", backgroundColor: "transparent" }}
        title="Revoke this access"
        onMouseOver={(e) => {
          if (!isPending)
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "rgba(239,68,68,0.1)";
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
        }}
      >
        {isPending ? "..." : "Revoke"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// User row component
// ---------------------------------------------------------------------------

interface UserRowProps {
  user: UserRow;
  societies: SocietyOption[];
  roles: RoleOption[];
  onMutate: () => void;
}

function UserTableRow({ user, societies, roles, onMutate }: UserRowProps) {
  const [assignOpen, setAssignOpen] = useState(false);
  const isPending = user.assignments.length === 0 && !user.is_platform_admin;
  const initials = user.full_name
    ? getInitials(user.full_name)
    : user.email.slice(0, 2).toUpperCase();

  return (
    <>
      <tr
        style={{ borderBottom: "1px solid rgba(51,51,51,0.5)" }}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
            "rgba(255,255,255,0.02)";
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent";
        }}
      >
        {/* User info */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-xs font-semibold"
              style={{ backgroundColor: isPending ? "#374151" : "#10B981", color: "#FFFFFF" }}
              aria-hidden="true"
            >
              {initials}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "#FFFFFF" }}>
                {user.full_name || "(no name)"}
              </p>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                {user.email}
              </p>
            </div>
          </div>
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          {user.is_platform_admin ? (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded"
              style={{ backgroundColor: "rgba(16,185,129,0.12)", color: "#10B981" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                shield
              </span>
              Platform Admin
            </span>
          ) : !user.is_active ? (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded"
              style={{ backgroundColor: "rgba(239,68,68,0.12)", color: "#EF4444" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                block
              </span>
              Deactivated
            </span>
          ) : isPending ? (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded"
              style={{ backgroundColor: "rgba(251,191,36,0.12)", color: "#FBB724" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                hourglass_empty
              </span>
              Pending Review
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded"
              style={{ backgroundColor: "rgba(16,185,129,0.08)", color: "#10B981" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "12px" }}>
                check_circle
              </span>
              Active
            </span>
          )}
        </td>

        {/* Registered date */}
        <td className="px-4 py-3">
          <span className="text-sm" style={{ color: "#9CA3AF" }}>
            {formatDate(user.created_at)}
          </span>
        </td>

        {/* Assignments */}
        <td className="px-4 py-3">
          {user.is_platform_admin ? (
            <span className="text-xs" style={{ color: "#6B7280" }}>
              System-wide
            </span>
          ) : user.assignments.length === 0 ? (
            <span className="text-xs italic" style={{ color: "#6B7280" }}>
              No access assigned
            </span>
          ) : (
            <div className="space-y-1">
              {user.assignments.map((a) => (
                <div key={a.id} className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-xs rounded px-1.5 py-0.5"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.05)",
                      color: "#D1D5DB",
                      border: "1px solid #333333",
                    }}
                  >
                    {a.society_name}
                  </span>
                  <span className="text-xs" style={{ color: "#6B7280" }}>
                    {a.role_name}
                  </span>
                  <RevokeButton
                    assignmentId={a.id}
                    userId={user.id}
                    societyId={a.society_id}
                    onSuccess={onMutate}
                  />
                </div>
              ))}
            </div>
          )}
        </td>

        {/* Actions */}
        <td className="px-4 py-3 text-right">
          {!user.is_platform_admin && user.is_active && (
            <button
              type="button"
              onClick={() => setAssignOpen(true)}
              className="flex items-center gap-1.5 ml-auto text-xs font-medium rounded px-3 py-1.5 transition-colors"
              style={{ color: "#10B981", border: "1px solid rgba(16,185,129,0.3)" }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(16,185,129,0.08)";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                add
              </span>
              Assign Access
            </button>
          )}
        </td>
      </tr>

      {/* Assign modal */}
      {assignOpen && (
        <AssignModal
          user={user}
          societies={societies}
          roles={roles}
          onClose={() => setAssignOpen(false)}
          onSuccess={() => {
            setAssignOpen(false);
            onMutate();
          }}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type Tab = "pending" | "all";

export function PlatformMembersClient({ users, societies, roles }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  function handleMutate() {
    router.refresh();
  }

  const pendingUsers = users.filter(
    (u) => u.assignments.length === 0 && !u.is_platform_admin && u.is_active
  );

  const filteredUsers = (activeTab === "pending" ? pendingUsers : users).filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.full_name ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Tabs + search bar */}
      <div
        className="flex items-center justify-between gap-4 mb-5 flex-wrap"
        style={{ borderBottom: "1px solid #333333", paddingBottom: "0" }}
      >
        {/* Tabs */}
        <div className="flex items-end gap-0">
          {(
            [
              { key: "pending" as Tab, label: "Pending Review", count: pendingUsers.length },
              { key: "all" as Tab, label: "All Users", count: users.length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors"
              style={{
                color: activeTab === tab.key ? "#10B981" : "#9CA3AF",
                borderBottom:
                  activeTab === tab.key ? "2px solid #10B981" : "2px solid transparent",
                background: "transparent",
              }}
            >
              {tab.label}
              <span
                className="text-xs rounded-full px-1.5 py-0.5 font-semibold"
                style={{
                  backgroundColor:
                    activeTab === tab.key
                      ? "rgba(16,185,129,0.15)"
                      : "rgba(255,255,255,0.06)",
                  color: activeTab === tab.key ? "#10B981" : "#6B7280",
                  minWidth: "20px",
                  textAlign: "center",
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Right side: Invite User + Search */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{
              backgroundColor: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.3)",
              color: "#10B981",
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(16,185,129,0.18)";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                "rgba(16,185,129,0.1)";
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              person_add
            </span>
            Invite User
          </button>

          <div
            className="flex items-center gap-2 rounded px-3 py-2"
            style={{
              backgroundColor: "#161616",
              border: "1px solid #333333",
              width: "240px",
            }}
          >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "16px", color: "#6B7280" }}
            aria-hidden="true"
          >
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or email..."
            className="bg-transparent border-none text-sm focus:outline-none w-full"
            style={{ color: "#FFFFFF" }}
            aria-label="Search users"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="shrink-0"
              style={{ color: "#6B7280" }}
              aria-label="Clear search"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                close
              </span>
            </button>
          )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid #333333" }}
      >
        {filteredUsers.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "#6B7280" }}>
            <span
              className="material-symbols-outlined block mb-3"
              style={{ fontSize: "36px", opacity: 0.4 }}
            >
              {activeTab === "pending" ? "check_circle" : "group"}
            </span>
            <p className="text-sm">
              {search
                ? "No users match your search."
                : activeTab === "pending"
                ? "No users pending review. All registered users have access assigned."
                : "No users found."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ backgroundColor: "#161616", borderBottom: "1px solid #333333" }}>
                  {["User", "Status", "Registered", "Access", ""].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-xs font-semibold"
                      style={{
                        color: "#6B7280",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody style={{ backgroundColor: "#1E1E1E" }}>
                {filteredUsers.map((user) => (
                  <UserTableRow
                    key={user.id}
                    user={user}
                    societies={societies}
                    roles={roles}
                    onMutate={handleMutate}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer count */}
      {filteredUsers.length > 0 && (
        <p className="mt-3 text-xs text-right" style={{ color: "#6B7280" }}>
          Showing {filteredUsers.length} of {activeTab === "pending" ? pendingUsers.length : users.length} user
          {(activeTab === "pending" ? pendingUsers.length : users.length) !== 1 ? "s" : ""}
        </p>
      )}

      {/* Invite User modal */}
      {inviteOpen && (
        <InviteUserModal
          onClose={() => setInviteOpen(false)}
          onSuccess={() => {
            setInviteOpen(false);
            handleMutate();
          }}
        />
      )}
    </div>
  );
}
