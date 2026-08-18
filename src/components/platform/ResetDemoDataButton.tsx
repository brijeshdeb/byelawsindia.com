"use client";
/**
 * ResetDemoDataButton — platform admin only.
 *
 * Shows a two-step confirmation before calling resetDemoDataAction.
 * Step 1: Click "Reset Demo Data" — reveals the confirmation panel.
 * Step 2: Confirm intent by clicking "Yes, reset everything" — calls the action.
 *
 * Only rendered when isPlatformAdmin && environmentType === "DEMO".
 * The server action independently re-verifies both conditions.
 */
import { useState, useTransition } from "react";
import { resetDemoDataAction } from "@/app/actions/platform/demo";

interface Props {
  societyId: string;
}

export function ResetDemoDataButton({ societyId }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleInitiate() {
    setResult(null);
    setConfirming(true);
  }

  function handleCancel() {
    setConfirming(false);
    setResult(null);
  }

  function handleConfirm() {
    startTransition(async () => {
      const res = await resetDemoDataAction(societyId);
      if (res.success) {
        setResult({ ok: true, message: res.data.message });
      } else {
        setResult({ ok: false, message: res.error ?? "Reset failed. Check server logs." });
      }
      setConfirming(false);
    });
  }

  if (result) {
    return (
      <div
        className="rounded px-3 py-3"
        style={{
          backgroundColor: result.ok ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${result.ok ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
        }}
      >
        <p style={{ fontSize: "12px", color: result.ok ? "#10B981" : "#EF4444" }}>
          {result.ok ? "Reset complete." : "Reset failed."} {result.message}
        </p>
        <button
          onClick={() => setResult(null)}
          style={{ fontSize: "11px", color: "#6B7280", marginTop: "6px", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (confirming) {
    return (
      <div
        className="rounded px-3 py-3 space-y-3"
        style={{ backgroundColor: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)" }}
      >
        <p style={{ fontSize: "12px", color: "#FCA5A5", lineHeight: 1.5 }}>
          This will delete all transactional data for this demo society (dues, payments, documents, complaints, work orders, audit log) and restore the original seed data. Structural data (wings, units, members, vendors, contracts) is preserved.
        </p>
        <p style={{ fontSize: "11px", fontWeight: 600, color: "#EF4444" }}>
          This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={isPending}
            style={{
              fontSize: "12px", fontWeight: 600, padding: "6px 14px",
              backgroundColor: "#EF4444", color: "#FFFFFF",
              border: "none", borderRadius: "4px", cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {isPending ? "Resetting…" : "Yes, reset everything"}
          </button>
          <button
            onClick={handleCancel}
            disabled={isPending}
            style={{
              fontSize: "12px", padding: "6px 12px",
              backgroundColor: "transparent", color: "#9CA3AF",
              border: "1px solid #333333", borderRadius: "4px", cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleInitiate}
      style={{
        width: "100%", fontSize: "12px", fontWeight: 500,
        padding: "8px 12px", borderRadius: "4px",
        backgroundColor: "rgba(239,68,68,0.08)",
        color: "#EF4444",
        border: "1px solid rgba(239,68,68,0.25)",
        cursor: "pointer", textAlign: "left",
        display: "flex", alignItems: "center", gap: "8px",
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "16px" }} aria-hidden="true">
        restart_alt
      </span>
      Reset Demo Data
    </button>
  );
}
