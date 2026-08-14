"use client";

/**
 * Login form — Stitch Obsidian design.
 *
 * - Dark error alert (red tint on dark surface, NOT light bg)
 * - Emerald submit button (#10B981)
 * - Label color: #9CA3AF (text-secondary)
 * - Material Symbols for show/hide password toggle
 */
import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "./actions";

interface Props {
  redirectTo?: string;
  urlError?: string;
}

const initialState: LoginState = {};

export default function LoginForm({ redirectTo, urlError }: Props) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );
  const [showPassword, setShowPassword] = useState(false);

  const generalError = state.error ?? urlError;

  return (
    <form action={formAction} noValidate className="space-y-5">
      {/* Hidden redirect field */}
      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}

      {/* General error summary — Obsidian dark alert */}
      {generalError && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2.5 p-3 rounded text-sm"
          style={{
            backgroundColor: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#EF4444",
          }}
        >
          <span
            className="material-symbols-outlined shrink-0 mt-0.5"
            style={{ fontSize: "16px" }}
            aria-hidden="true"
          >
            error
          </span>
          <span>{generalError}</span>
        </div>
      )}

      {/* Email field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium mb-1.5"
          style={{ color: "#9CA3AF" }}
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          disabled={isPending}
          aria-describedby={
            state.fieldErrors?.email ? "email-error" : undefined
          }
          aria-invalid={!!state.fieldErrors?.email}
          className="form-input"
          style={
            state.fieldErrors?.email
              ? { borderColor: "#EF4444" }
              : undefined
          }
          placeholder="you@example.com"
        />
        {state.fieldErrors?.email && (
          <p id="email-error" className="form-error" role="alert">
            {state.fieldErrors.email}
          </p>
        )}
      </div>

      {/* Password field */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium mb-1.5"
          style={{ color: "#9CA3AF" }}
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            disabled={isPending}
            aria-describedby={
              state.fieldErrors?.password ? "password-error" : undefined
            }
            aria-invalid={!!state.fieldErrors?.password}
            className="form-input pr-10"
            style={
              state.fieldErrors?.password
                ? { borderColor: "#EF4444" }
                : undefined
            }
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
            style={{ color: "#9CA3AF" }}
            onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF"; }}
            onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF"; }}
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={0}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "18px" }}
              aria-hidden="true"
            >
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
        {state.fieldErrors?.password && (
          <p id="password-error" className="form-error" role="alert">
            {state.fieldErrors.password}
          </p>
        )}
      </div>

      {/* Submit button — emerald primary */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          backgroundColor: isPending ? "rgba(16,185,129,0.6)" : "#10B981",
          color: "#FFFFFF",
          cursor: isPending ? "not-allowed" : "pointer",
          outlineColor: "#10B981",
        }}
        onMouseOver={(e) => {
          if (!isPending) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#0d9f6e";
        }}
        onMouseOut={(e) => {
          if (!isPending) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#10B981";
        }}
        aria-busy={isPending}
      >
        {isPending ? (
          <>
            <span
              className="material-symbols-outlined animate-spin"
              style={{ fontSize: "16px" }}
              aria-hidden="true"
            >
              progress_activity
            </span>
            <span>Signing in…</span>
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}
