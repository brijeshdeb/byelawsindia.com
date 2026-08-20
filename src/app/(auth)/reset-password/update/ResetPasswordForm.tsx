"use client";

import { useActionState } from "react";
import Link from "next/link";
import { completePasswordResetAction, type ResetPasswordState } from "../actions";

const INITIAL_STATE: ResetPasswordState = {};

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(completePasswordResetAction, INITIAL_STATE);

  if (state.success) {
    return (
      <div role="status">
        <h1 className="text-2xl font-semibold">Password reset</h1>
        <p className="mt-3 text-sm" style={{ color: "#9CA3AF" }}>Your new password is active. Other sessions have been signed out.</p>
        <Link href="/login" className="inline-flex mt-6 text-sm font-medium" style={{ color: "#10B981" }}>Sign in</Link>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate>
      <h1 className="text-2xl font-semibold">Choose a new password</h1>
      <p className="mt-2 mb-6 text-sm leading-6" style={{ color: "#9CA3AF" }}>Use at least 12 characters with uppercase, lowercase, a number and a symbol.</p>
      {state.error && <p className="mb-4 text-sm" role="alert" style={{ color: "#FCA5A5" }}>{state.error}</p>}
      <ResetField id="newPassword" label="New password" error={state.fieldErrors?.newPassword} />
      <div className="mt-4"><ResetField id="confirmPassword" label="Confirm new password" error={state.fieldErrors?.confirmPassword} /></div>
      <button type="submit" disabled={isPending} className="mt-5 w-full rounded-lg py-2.5 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: "#10B981", color: "white" }}>
        {isPending ? "Resetting…" : "Reset password"}
      </button>
    </form>
  );
}

function ResetField({ id, label, error }: { id: string; label: string; error?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">{label}</label>
      <input id={id} name={id} type="password" autoComplete="new-password" required aria-invalid={Boolean(error)} className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none" style={{ backgroundColor: "#161616", border: `1px solid ${error ? "#EF4444" : "#3A3A3A"}`, color: "white" }} />
      {error && <p className="mt-1.5 text-xs" role="alert" style={{ color: "#FCA5A5" }}>{error}</p>}
    </div>
  );
}
