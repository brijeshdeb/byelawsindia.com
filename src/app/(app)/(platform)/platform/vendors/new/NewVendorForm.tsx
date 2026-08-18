"use client";

/**
 * NewVendorForm
 *
 * Client component for adding a vendor to a society.
 * Receives a list of societies from the server component (fetched server-side).
 * Uses useActionState to call addVendor.
 * vendor_code is generated server-side — it is not shown or controlled here.
 */

import { useActionState } from "react";
import Link from "next/link";
import { addVendor, type FormResult } from "./actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SocietyOption {
  id: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VENDOR_TYPES = [
  { value: "CIVIL",        label: "Civil / Construction" },
  { value: "ELECTRICAL",   label: "Electrical" },
  { value: "PLUMBING",     label: "Plumbing" },
  { value: "SECURITY",     label: "Security" },
  { value: "HOUSEKEEPING", label: "Housekeeping / Sanitation" },
  { value: "IT",           label: "IT / Technology" },
  { value: "LANDSCAPING",  label: "Landscaping / Horticulture" },
  { value: "OTHER",        label: "Other" },
];

const INPUT_STYLE = {
  backgroundColor: "#161616",
  border: "1px solid #333333",
  color: "#FFFFFF",
  borderRadius: "6px",
  padding: "10px 12px",
  fontSize: "14px",
  width: "100%",
  outline: "none",
};

function FieldLabel({ htmlFor, children, required }: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium mb-1.5"
      style={{ color: "#9CA3AF", letterSpacing: "0.05em", textTransform: "uppercase" }}
    >
      {children}
      {required && <span style={{ color: "#EF4444", marginLeft: "3px" }}>*</span>}
    </label>
  );
}

function TextInput({ id, name, type = "text", placeholder, required, autoComplete }: {
  id: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      placeholder={placeholder}
      required={required}
      autoComplete={autoComplete}
      className="w-full focus:outline-none transition-colors"
      style={INPUT_STYLE}
      onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = "#10B981")}
      onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = "#333333")}
    />
  );
}

function SelectInput({ id, name, children, required }: {
  id: string;
  name: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <select
      id={id}
      name={name}
      required={required}
      className="w-full focus:outline-none transition-colors"
      style={{ ...INPUT_STYLE, cursor: "pointer" }}
      onFocus={(e) => ((e.currentTarget as HTMLSelectElement).style.borderColor = "#10B981")}
      onBlur={(e) => ((e.currentTarget as HTMLSelectElement).style.borderColor = "#333333")}
    >
      {children}
    </select>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-semibold text-sm mb-4"
      style={{
        color: "#9CA3AF",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        borderBottom: "1px solid #2A2A2A",
        paddingBottom: "8px",
      }}
    >
      {children}
    </h2>
  );
}

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------

const initialResult: FormResult = { success: false, error: null };

export function NewVendorForm({ societies }: { societies: SocietyOption[] }) {
  const [state, formAction, isPending] = useActionState(addVendor, initialResult);

  return (
    <form action={formAction} noValidate>
      {/* Global error */}
      {state.error && (
        <div
          className="flex items-start gap-3 rounded-lg px-4 py-3 mb-6"
          style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}
          role="alert"
        >
          <span
            className="material-symbols-outlined shrink-0 mt-0.5"
            style={{ fontSize: "18px", color: "#EF4444" }}
            aria-hidden="true"
          >
            error
          </span>
          <p style={{ color: "#EF4444", fontSize: "14px", lineHeight: "1.5" }}>
            {state.error}
          </p>
        </div>
      )}

      {/* ── Section 1: Society + Type ─────────────────────── */}
      <div
        className="rounded-xl p-6 mb-5"
        style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
      >
        <SectionHeading>Assignment</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="society_id" required>
              Society
            </FieldLabel>
            {societies.length === 0 ? (
              <p style={{ color: "#EF4444", fontSize: "13px" }}>
                No societies found. Register a society first.
              </p>
            ) : (
              <SelectInput id="society_id" name="society_id" required>
                <option value="">Select a society...</option>
                {societies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </SelectInput>
            )}
          </div>

          <div>
            <FieldLabel htmlFor="vendor_type" required>
              Vendor Type
            </FieldLabel>
            <SelectInput id="vendor_type" name="vendor_type" required>
              {VENDOR_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </SelectInput>
          </div>
        </div>
      </div>

      {/* ── Section 2: Vendor Details ─────────────────────── */}
      <div
        className="rounded-xl p-6 mb-5"
        style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
      >
        <SectionHeading>Vendor Details</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <FieldLabel htmlFor="name" required>
              Vendor / Company Name
            </FieldLabel>
            <TextInput
              id="name"
              name="name"
              placeholder="e.g. Apex Security Services Pvt Ltd"
              required
              autoComplete="organization"
            />
          </div>

          <div>
            <FieldLabel htmlFor="contact_name">
              Contact Person
            </FieldLabel>
            <TextInput
              id="contact_name"
              name="contact_name"
              placeholder="Primary contact name"
            />
          </div>

          <div>
            <FieldLabel htmlFor="phone">
              Phone Number
            </FieldLabel>
            <TextInput
              id="phone"
              name="phone"
              type="tel"
              placeholder="+91 98765 43210"
              autoComplete="tel"
            />
          </div>

          <div>
            <FieldLabel htmlFor="email">
              Email Address
            </FieldLabel>
            <TextInput
              id="email"
              name="email"
              type="email"
              placeholder="vendor@example.com"
              autoComplete="email"
            />
          </div>

          <div className="md:col-span-2">
            <FieldLabel htmlFor="address">
              Address
            </FieldLabel>
            <textarea
              id="address"
              name="address"
              placeholder="Office or business address..."
              rows={2}
              className="w-full focus:outline-none transition-colors resize-none"
              style={INPUT_STYLE}
              onFocus={(e) => ((e.currentTarget as HTMLTextAreaElement).style.borderColor = "#10B981")}
              onBlur={(e) => ((e.currentTarget as HTMLTextAreaElement).style.borderColor = "#333333")}
            />
          </div>
        </div>
      </div>

      {/* ── Section 3: Tax / Compliance ───────────────────── */}
      <div
        className="rounded-xl p-6 mb-5"
        style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
      >
        <SectionHeading>Tax and Compliance (optional)</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="gstin">
              GSTIN
            </FieldLabel>
            <TextInput
              id="gstin"
              name="gstin"
              placeholder="15-character GST number"
            />
          </div>

          <div>
            <FieldLabel htmlFor="pan">
              PAN
            </FieldLabel>
            <TextInput
              id="pan"
              name="pan"
              placeholder="10-character PAN"
            />
          </div>
        </div>

        <p className="mt-3 text-xs" style={{ color: "#6B7280" }}>
          Vendor code is auto-generated. GSTIN and PAN are validated for format only.
        </p>
      </div>

      {/* ── Form actions ─────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3">
        <Link
          href="/platform/console"
          className="px-5 py-2.5 text-sm rounded-lg transition-colors"
          style={{
            color: "#9CA3AF",
            border: "1px solid #333333",
            backgroundColor: "transparent",
          }}
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending || societies.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-opacity disabled:opacity-60"
          style={{ backgroundColor: "#10B981", color: "#FFFFFF" }}
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
              Adding...
            </>
          ) : (
            <>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "16px" }}
                aria-hidden="true"
              >
                storefront
              </span>
              Add Vendor
            </>
          )}
        </button>
      </div>
    </form>
  );
}
