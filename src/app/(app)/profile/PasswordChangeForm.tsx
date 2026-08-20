"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction, type ChangePasswordState } from "./actions";

const INITIAL_STATE: ChangePasswordState = {};

export function PasswordChangeForm() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, INITIAL_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5" noValidate>
      {state.success && (
        <div className="rounded-lg px-4 py-3 text-sm" role="status" style={{ backgroundColor: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#6EE7B7" }}>
          Password changed. Other sessions for this account have been signed out.
        </div>
      )}
      {state.error && (
        <div className="rounded-lg px-4 py-3 text-sm" role="alert" style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
          {state.error}
        </div>
      )}

      <PasswordField
        id="currentPassword"
        label="Current password"
        autoComplete="current-password"
        error={state.fieldErrors?.currentPassword}
      />
      <PasswordField
        id="newPassword"
        label="New password"
        autoComplete="new-password"
        hint="At least 12 characters with uppercase, lowercase, a number and a symbol."
        error={state.fieldErrors?.newPassword}
      />
      <PasswordField
        id="confirmPassword"
        label="Confirm new password"
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword}
      />

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
        style={{ backgroundColor: "#10B981", color: "white" }}
      >
        {isPending ? "Changing password…" : "Change password"}
      </button>
    </form>
  );
}

function PasswordField({
  id,
  label,
  autoComplete,
  hint,
  error,
}: {
  id: string;
  label: string;
  autoComplete: string;
  hint?: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5" style={{ color: "#E5E7EB" }}>
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="password"
        autoComplete={autoComplete}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
        style={{ backgroundColor: "#161616", border: `1px solid ${error ? "#EF4444" : "#3A3A3A"}`, color: "white" }}
      />
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-xs" style={{ color: "#6B7280" }}>{hint}</p>}
      {error && <p id={`${id}-error`} className="mt-1.5 text-xs" role="alert" style={{ color: "#FCA5A5" }}>{error}</p>}
    </div>
  );
}
