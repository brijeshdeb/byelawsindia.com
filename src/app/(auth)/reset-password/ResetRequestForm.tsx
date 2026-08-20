"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction, type ResetRequestState } from "./actions";

const INITIAL_STATE: ResetRequestState = {};

export function ResetRequestForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, INITIAL_STATE);

  if (state.success) {
    return (
      <div role="status">
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="mt-3 text-sm leading-6" style={{ color: "#9CA3AF" }}>
          If an account exists for that address, a password-reset link has been sent. The link expires shortly.
        </p>
        <Link href="/login" className="inline-flex mt-6 text-sm font-medium" style={{ color: "#10B981" }}>Return to sign in</Link>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate>
      <h1 className="text-2xl font-semibold">Reset your password</h1>
      <p className="mt-2 mb-6 text-sm leading-6" style={{ color: "#9CA3AF" }}>
        Enter the email used for any ByelawsIndia login. We will send a secure recovery link.
      </p>
      {state.error && <p className="mb-4 text-sm" role="alert" style={{ color: "#FCA5A5" }}>{state.error}</p>}
      <label htmlFor="email" className="block text-sm font-medium mb-1.5">Email address</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        aria-invalid={Boolean(state.fieldErrors?.email)}
        className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
        style={{ backgroundColor: "#161616", border: `1px solid ${state.fieldErrors?.email ? "#EF4444" : "#3A3A3A"}`, color: "white" }}
      />
      {state.fieldErrors?.email && <p className="mt-1.5 text-xs" role="alert" style={{ color: "#FCA5A5" }}>{state.fieldErrors.email}</p>}
      <button type="submit" disabled={isPending} className="mt-5 w-full rounded-lg py-2.5 text-sm font-semibold disabled:opacity-60" style={{ backgroundColor: "#10B981", color: "white" }}>
        {isPending ? "Sending…" : "Send reset link"}
      </button>
      <Link href="/login" className="block mt-5 text-center text-sm" style={{ color: "#10B981" }}>Back to sign in</Link>
    </form>
  );
}
