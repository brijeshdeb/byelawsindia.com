"use client";

/**
 * DemoBanner — persistent amber warning strip shown at the top of the
 * main content area whenever the active society has environmentType = "DEMO".
 *
 * Purpose: prevent any confusion during sales demonstrations that this is
 * live production data or that actions have real-world consequences.
 *
 * Design decisions:
 * - Non-dismissible. The banner must always be visible in a demo session.
 * - Server-rendered friendly: receives environmentType as a prop from AppShell.
 * - "use client" only because it renders as a leaf inside a server component.
 */

interface Props {
  environmentType: "CUSTOMER" | "DEMO" | "TEST";
}

export function DemoBanner({ environmentType }: Props) {
  if (environmentType !== "DEMO") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        backgroundColor: "rgba(217, 119, 6, 0.12)",
        borderBottom: "1px solid rgba(217, 119, 6, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "7px 16px",
        flexShrink: 0,
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: "16px", color: "#D97706" }}
        aria-hidden="true"
      >
        science
      </span>
      <span
        style={{
          fontSize: "12px",
          fontWeight: 500,
          color: "#D97706",
          letterSpacing: "0.01em",
        }}
      >
        DEMO ENVIRONMENT — Sample data only. No emails are sent and no external
        systems are triggered.
      </span>
    </div>
  );
}
