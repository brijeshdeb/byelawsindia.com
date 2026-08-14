/**
 * StatusBadge — semantic status indicator.
 *
 * Maps domain status strings to visual badge variants.
 * Used in tables, detail panels, and workflow views.
 *
 * Variants:
 *   success  — green  — approved, active, paid, verified
 *   warning  — amber  — pending, under_review, expiring_soon
 *   danger   — red    — rejected, overdue, suspended, blacklisted
 *   info     — blue   — draft, submitted, in_progress
 *   neutral  — gray   — archived, inactive, cancelled
 */
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

const variantClasses: Record<BadgeVariant, string> = {
  success: "badge-success",
  warning: "badge-warning",
  danger:  "badge-danger",
  info:    "badge-info",
  neutral: "badge-neutral",
};

interface Props {
  variant: BadgeVariant;
  label: string;
  className?: string;
}

export function StatusBadge({ variant, label, className }: Props) {
  return (
    <span className={cn(variantClasses[variant], className)}>
      {label}
    </span>
  );
}

/* ── Status → variant mapping helpers ───────────────────────────── */

/** Map application workflow states to badge variants */
export function applicationStatusVariant(
  status: string
): BadgeVariant {
  switch (status.toLowerCase()) {
    case "approved":
    case "registered":
      return "success";
    case "rejected":
    case "cancelled":
      return "danger";
    case "pending":
    case "under_review":
    case "correction_required":
      return "warning";
    case "draft":
    case "submitted":
    case "in_progress":
      return "info";
    default:
      return "neutral";
  }
}

/** Map vendor statuses to badge variants */
export function vendorStatusVariant(status: string): BadgeVariant {
  switch (status.toLowerCase()) {
    case "active":
    case "verified":
      return "success";
    case "suspended":
    case "blacklisted":
      return "danger";
    case "pending_verification":
      return "warning";
    default:
      return "neutral";
  }
}

/** Map maintenance/complaint statuses to badge variants */
export function maintenanceStatusVariant(status: string): BadgeVariant {
  switch (status.toLowerCase()) {
    case "resolved":
    case "closed":
      return "success";
    case "overdue":
      return "danger";
    case "in_progress":
    case "assigned":
      return "info";
    case "open":
    case "pending":
      return "warning";
    default:
      return "neutral";
  }
}

/** Map payment statuses to badge variants */
export function paymentStatusVariant(status: string): BadgeVariant {
  switch (status.toLowerCase()) {
    case "paid":
    case "settled":
      return "success";
    case "overdue":
    case "failed":
      return "danger";
    case "partial":
    case "due":
      return "warning";
    case "pending":
      return "info";
    default:
      return "neutral";
  }
}
