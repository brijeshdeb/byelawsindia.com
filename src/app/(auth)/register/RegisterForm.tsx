"use client";

/**
 * Registration form — client component.
 *
 * Uses useActionState for Server Action integration. Shows field-level
 * validation errors, a loading state during submission, and a success
 * screen once the account is created.
 */
import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { registerAction, type RegisterState } from "./actions";

const INITIAL: RegisterState = {};

export default function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, INITIAL);
  const firstErrorRef = useRef<HTMLInputElement>(null);

  // Focus first invalid field on validation error
  useEffect(() => {
    if (state.fieldErrors) firstErrorRef.current?.focus();
  }, [state.fieldErrors]);

  // ── Success screen ────────────────────────────────────────────────────────
  if (state.success) {
    return (
      <div className="text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "28px", color: "#10B981" }}
          >
            check_circle
          </span>
        </div>
        <h3
          className="font-semibold mb-2"
          style={{ fontSize: "20px", color: "#FFFFFF" }}
        >
          Account created
        </h3>
        <p style={{ fontSize: "14px", color: "#9CA3AF", lineHeight: "1.6" }}>
          Your account for{" "}
          <span style={{ color: "#e5e2e1" }}>{state.email}</span> is ready.
        </p>
        <p className="mt-3" style={{ fontSize: "13px", color: "#6B7280", lineHeight: "1.6" }}>
          A platform administrator will assign you to your society. You will receive
          an email once access is active. This typically takes 1 business day.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#10B981", color: "#fff", fontSize: "14px" }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>arrow_back</span>
          Back to sign in
        </Link>
      </div>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <form action={formAction} noValidate>
      {/* Global error */}
      {state.error && (
        <div
          className="mb-5 px-4 py-3 rounded text-sm"
          style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5" }}
          role="alert"
        >
          {state.error}
        </div>
      )}

      <div className="space-y-4">
        {/* Full name */}
        <Field
          id="fullName"
          name="fullName"
          label="Full name"
          type="text"
          autoComplete="name"
          placeholder="Anand Krishnan"
          error={state.fieldErrors?.fullName}
          inputRef={state.fieldErrors?.fullName ? firstErrorRef : undefined}
          required
        />

        {/* Email */}
        <Field
          id="email"
          name="email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={state.fieldErrors?.email}
          inputRef={!state.fieldErrors?.fullName && state.fieldErrors?.email ? firstErrorRef : undefined}
          required
        />

        {/* Phone — optional */}
        <Field
          id="phone"
          name="phone"
          label="Phone number"
          type="tel"
          autoComplete="tel"
          placeholder="+91 98765 43210"
          hint="Optional — helps us reach you during onboarding"
        />

        {/* Society name — context only, not used to create society */}
        <Field
          id="societyName"
          name="societyName"
          label="Society name"
          type="text"
          autoComplete="organization"
          placeholder="Sunrise Cooperative Housing Society"
          hint="Optional — for our reference during access assignment"
        />

        {/* Password */}
        <Field
          id="password"
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          error={state.fieldErrors?.password}
          required
        />

        {/* Confirm password */}
        <Field
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          error={state.fieldErrors?.confirmPassword}
          required
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 w-full py-2.5 rounded font-semibold transition-opacity disabled:opacity-60"
        style={{ backgroundColor: "#10B981", color: "#fff", fontSize: "15px" }}
      >
        {isPending ? "Creating account…" : "Create account"}
      </button>

      <p className="mt-4 text-center" style={{ fontSize: "13px", color: "#6B7280" }}>
        Already have an account?{" "}
        <Link
          href="/login"
          className="underline underline-offset-2 transition-colors"
          style={{ color: "#10B981" }}
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

/* ── Field sub-component ─────────────────────────────────────────────────── */

interface FieldProps {
  id: string;
  name: string;
  label: string;
  type: string;
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}

function Field({ id, name, label, type, autoComplete, placeholder, hint, error, required, inputRef }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block font-medium mb-1.5"
        style={{ fontSize: "13px", color: "#9CA3AF" }}
      >
        {label}
        {required && <span className="ml-0.5" style={{ color: "#EF4444" }}>*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        ref={inputRef}
        className="w-full px-3 py-2.5 rounded outline-none transition-colors"
        style={{
          backgroundColor: "#2a2a2a",
          border: error ? "1px solid rgba(239,68,68,0.6)" : "1px solid #3a3a3a",
          color: "#FFFFFF",
          fontSize: "14px",
        }}
        onFocus={(e) => {
          e.target.style.border = error
            ? "1px solid rgba(239,68,68,0.8)"
            : "1px solid rgba(16,185,129,0.6)";
        }}
        onBlur={(e) => {
          e.target.style.border = error
            ? "1px solid rgba(239,68,68,0.6)"
            : "1px solid #3a3a3a";
        }}
      />
      {hint && !error && (
        <p id={`${id}-hint`} style={{ fontSize: "11px", color: "#6B7280", marginTop: "4px" }}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" style={{ fontSize: "12px", color: "#FCA5A5", marginTop: "4px" }}>
          {error}
        </p>
      )}
    </div>
  );
}
