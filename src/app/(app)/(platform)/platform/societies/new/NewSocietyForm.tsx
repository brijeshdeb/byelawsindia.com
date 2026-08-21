"use client";

/**
 * NewSocietyForm
 *
 * Client component for registering a new society.
 * Uses useActionState to call the registerSociety server action.
 * On success the server action calls redirect() — no client-side success
 * handling needed. On error the form stays mounted and shows the message.
 */

import { useActionState } from "react";
import Link from "next/link";
import { registerSociety, type FormResult } from "./actions";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SOCIETY_TYPES = [
  { value: "CHS", label: "CHS — Co-operative Housing Society" },
  { value: "AOA", label: "AOA — Apartment Owners Association" },
  { value: "RWA", label: "RWA — Resident Welfare Association" },
  { value: "HSA", label: "HSA — Housing Society Association" },
  { value: "Other", label: "Other" },
];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  // Union Territories
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

// ---------------------------------------------------------------------------
// Styled sub-components
// ---------------------------------------------------------------------------

function FieldLabel({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
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
// Main form component
// ---------------------------------------------------------------------------

const initialResult: FormResult = { success: false, error: null };

export function NewSocietyForm() {
  const [state, formAction, isPending] = useActionState(registerSociety, initialResult);

  return (
    <form action={formAction} noValidate>
      {/* Global error banner */}
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

      {/* ── Section 1: Identity ───────────────────────────── */}
      <div
        className="rounded-xl p-6 mb-5"
        style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
      >
        <SectionHeading>Society Identity</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <FieldLabel htmlFor="name" required>
              Society Name
            </FieldLabel>
            <TextInput
              id="name"
              name="name"
              placeholder="e.g. Sunrise Co-operative Housing Society"
              required
              autoComplete="organization"
            />
          </div>

          <div>
            <FieldLabel htmlFor="registration_number" required>
              Registration Number
            </FieldLabel>
            <TextInput
              id="registration_number"
              name="registration_number"
              placeholder="e.g. MH/PUNE/TSC/12345/2022"
              required
            />
          </div>

          <div>
            <FieldLabel htmlFor="society_type" required>
              Society Type
            </FieldLabel>
            <SelectInput id="society_type" name="society_type" required>
              {SOCIETY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </SelectInput>
          </div>

          <div>
            <FieldLabel htmlFor="registered_at" required>
              Date of Registration
            </FieldLabel>
            <TextInput
              id="registered_at"
              name="registered_at"
              type="date"
              required
            />
          </div>
          <div>
            <FieldLabel htmlFor="pan">PAN (optional)</FieldLabel>
            <TextInput id="pan" name="pan" placeholder="ABCDE1234F" />
          </div>
          <div>
            <FieldLabel htmlFor="gstin">GSTIN (where applicable)</FieldLabel>
            <TextInput id="gstin" name="gstin" placeholder="27ABCDE1234F1Z5" />
          </div>
        </div>
      </div>

      {/* ── Section 2: Address ───────────────────────────── */}
      <div
        className="rounded-xl p-6 mb-5"
        style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
      >
        <SectionHeading>Address</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <FieldLabel htmlFor="address" required>
              Street Address
            </FieldLabel>
            <textarea
              id="address"
              name="address"
              placeholder="Plot no., building, street name..."
              required
              rows={2}
              className="w-full focus:outline-none transition-colors resize-none"
              style={INPUT_STYLE}
              onFocus={(e) => ((e.currentTarget as HTMLTextAreaElement).style.borderColor = "#10B981")}
              onBlur={(e) => ((e.currentTarget as HTMLTextAreaElement).style.borderColor = "#333333")}
            />
          </div>

          <div>
            <FieldLabel htmlFor="city" required>
              City
            </FieldLabel>
            <TextInput id="city" name="city" placeholder="e.g. Pune" required />
          </div>

          <div>
            <FieldLabel htmlFor="state" required>
              State / UT
            </FieldLabel>
            <SelectInput id="state" name="state" required>
              <option value="">Select state or UT...</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </SelectInput>
          </div>

          <div>
            <FieldLabel htmlFor="pin_code" required>
              PIN Code
            </FieldLabel>
            <TextInput
              id="pin_code"
              name="pin_code"
              placeholder="6-digit PIN"
              required
              autoComplete="postal-code"
            />
          </div>
        </div>
      </div>

      {/* ── Section 3: Contact ───────────────────────────── */}
      <div
        className="rounded-xl p-6 mb-5"
        style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
      >
        <SectionHeading>Contact Details</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="email" required>
              Email Address
            </FieldLabel>
            <TextInput
              id="email"
              name="email"
              type="email"
              placeholder="society@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <FieldLabel htmlFor="phone" required>
              Phone Number
            </FieldLabel>
            <TextInput
              id="phone"
              name="phone"
              type="tel"
              placeholder="+91 98765 43210"
              required
              autoComplete="tel"
            />
          </div>

          <div>
            <FieldLabel htmlFor="website">
              Website (optional)
            </FieldLabel>
            <TextInput
              id="website"
              name="website"
              type="url"
              placeholder="https://sunrisechs.org"
              autoComplete="url"
            />
          </div>
        </div>
      </div>

      <div
        className="rounded-xl p-6 mb-5"
        style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
      >
        <SectionHeading>Committee &amp; Authorized Signatories</SectionHeading>
        <p className="text-sm mb-4" style={{ color: "#9CA3AF" }}>
          The three principal officers are created as authorized signatories and can be updated later by the Society Admin.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><FieldLabel htmlFor="chairman_name" required>Chairman Name</FieldLabel><TextInput id="chairman_name" name="chairman_name" required /></div>
          <div><FieldLabel htmlFor="chairman_email">Chairman Email</FieldLabel><TextInput id="chairman_email" name="chairman_email" type="email" /></div>
          <div><FieldLabel htmlFor="secretary_name" required>Secretary Name</FieldLabel><TextInput id="secretary_name" name="secretary_name" required /></div>
          <div><FieldLabel htmlFor="secretary_email">Secretary Email</FieldLabel><TextInput id="secretary_email" name="secretary_email" type="email" /></div>
          <div><FieldLabel htmlFor="treasurer_name" required>Treasurer Name</FieldLabel><TextInput id="treasurer_name" name="treasurer_name" required /></div>
          <div><FieldLabel htmlFor="treasurer_email">Treasurer Email</FieldLabel><TextInput id="treasurer_email" name="treasurer_email" type="email" /></div>
          <div className="md:col-span-2">
            <FieldLabel htmlFor="committee_details">Other Managing Committee Details</FieldLabel>
            <textarea id="committee_details" name="committee_details" rows={3} placeholder="Names/designations of other committee members" className="w-full resize-none focus:outline-none transition-colors" style={INPUT_STYLE} />
          </div>
        </div>
      </div>

      {/* ── Section 4: First administrator ───────────────── */}
      <div
        className="rounded-xl p-6 mb-5"
        style={{ backgroundColor: "#1E1E1E", border: "1px solid #333333" }}
      >
        <SectionHeading>Required Society Administrator</SectionHeading>
        <p className="text-sm mb-4" style={{ color: "#9CA3AF" }}>
          Registration creates or links this login and grants it the society-wide Society Admin role. The society cannot be created without it.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="admin_full_name" required>
              Administrator Full Name
            </FieldLabel>
            <TextInput
              id="admin_full_name"
              name="admin_full_name"
              placeholder="e.g. Priya Deshmukh"
              required
              autoComplete="name"
            />
          </div>
          <div>
            <FieldLabel htmlFor="admin_email" required>
              Administrator Login Email
            </FieldLabel>
            <TextInput
              id="admin_email"
              name="admin_email"
              type="email"
              placeholder="admin@society.org"
              required
              autoComplete="email"
            />
          </div>
        </div>
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
          disabled={isPending}
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
              Registering & inviting...
            </>
          ) : (
            <>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "16px" }}
                aria-hidden="true"
              >
                add_business
              </span>
              Register Society & Invite Admin
            </>
          )}
        </button>
      </div>
    </form>
  );
}
