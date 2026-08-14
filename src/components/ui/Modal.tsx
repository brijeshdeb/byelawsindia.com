"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Max width class, default "max-w-lg" */
  maxWidth?: string;
}

export function Modal({ open, onClose, title, description, children, maxWidth = "max-w-lg" }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Trap scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={panelRef}
        className={`relative w-full ${maxWidth} rounded-lg shadow-2xl flex flex-col`}
        style={{
          backgroundColor: "#1E1E1E",
          border: "1px solid #333333",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 py-5"
          style={{ borderBottom: "1px solid #2a2a2a" }}
        >
          <div>
            <h2
              id="modal-title"
              className="text-base font-semibold"
              style={{ color: "#F3F4F6" }}
            >
              {title}
            </h2>
            {description && (
              <p className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 mt-0.5 flex-shrink-0 rounded p-1 transition-colors"
            style={{ color: "#6B7280" }}
            aria-label="Close"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ---- Shared form primitives ----

export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium"
        style={{ color: "#D1D5DB" }}
      >
        {label}
        {required && <span style={{ color: "#EF4444" }} aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs" style={{ color: "#6B7280" }}>{hint}</p>
      )}
      {error && (
        <p className="text-xs" style={{ color: "#EF4444" }} role="alert">{error}</p>
      )}
    </div>
  );
}

const inputBase: React.CSSProperties = {
  backgroundColor: "#121212",
  border: "1px solid #333333",
  borderRadius: "6px",
  color: "#F3F4F6",
  fontSize: "14px",
  padding: "8px 12px",
  width: "100%",
  outline: "none",
};

export function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  const { error, style, ...rest } = props;
  return (
    <input
      {...rest}
      style={{
        ...inputBase,
        ...(error ? { borderColor: "#EF4444" } : {}),
        ...style,
      }}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  const { error, style, ...rest } = props;
  return (
    <textarea
      rows={3}
      {...rest}
      style={{
        ...inputBase,
        resize: "vertical",
        ...(error ? { borderColor: "#EF4444" } : {}),
        ...style,
      }}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  const { error, style, children, ...rest } = props;
  return (
    <select
      {...rest}
      style={{
        ...inputBase,
        ...(error ? { borderColor: "#EF4444" } : {}),
        ...style,
      }}
    >
      {children}
    </select>
  );
}

export function ModalActions({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex items-center justify-end gap-3 pt-4"
      style={{ borderTop: "1px solid #2a2a2a", marginTop: "8px" }}
    >
      {children}
    </div>
  );
}

export function CancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 rounded text-sm font-medium transition-colors"
      style={{ backgroundColor: "#2a2a2a", color: "#9CA3AF", border: "1px solid #333333" }}
    >
      Cancel
    </button>
  );
}

export function SubmitButton({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="px-4 py-2 rounded text-sm font-semibold transition-colors disabled:opacity-60"
      style={{ backgroundColor: "#10B981", color: "#fff" }}
    >
      {loading ? "Saving..." : children}
    </button>
  );
}
