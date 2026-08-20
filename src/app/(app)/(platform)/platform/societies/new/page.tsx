/**
 * Register New Society page.
 *
 * Server component: renders the page header and delegates all form logic
 * to NewSocietyForm (client component with useActionState).
 *
 * Security: is_platform_admin is enforced by the parent layout.tsx.
 * The registerSociety server action re-verifies it independently.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { NewSocietyForm } from "./NewSocietyForm";

export const metadata: Metadata = {
  title: "Register New Society | ByelawsIndia Admin",
};

export default function RegisterNewSocietyPage() {
  return (
    <div
      style={{
        padding: "32px 40px",
        maxWidth: "760px",
        minHeight: "100%",
      }}
    >
      {/* Back link */}
      <Link
        href="/platform/console"
        className="inline-flex items-center gap-1.5 mb-8 text-xs transition-opacity hover:opacity-100"
        style={{ color: "rgba(156,163,175,0.6)" }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "15px" }}
          aria-hidden="true"
        >
          arrow_back
        </span>
        Back to Console
      </Link>

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="flex items-center justify-center rounded-lg shrink-0"
            style={{
              width: "36px",
              height: "36px",
              backgroundColor: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.25)",
            }}
            aria-hidden="true"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "20px", color: "#10B981" }}
            >
              add_business
            </span>
          </div>
          <h1
            className="font-semibold"
            style={{ color: "#FFFFFF", fontSize: "22px" }}
          >
            Register New Society
          </h1>
        </div>
        <p style={{ color: "#9CA3AF", fontSize: "13px", lineHeight: "1.6" }}>
          Creates the society, default settings, and its first Society Admin login as one protected onboarding step.
        </p>
      </div>

      {/* Form */}
      <NewSocietyForm />
    </div>
  );
}
