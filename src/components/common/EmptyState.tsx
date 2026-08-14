/**
 * EmptyState — zero-data placeholder for lists and tables.
 *
 * Usage:
 *   <EmptyState
 *     icon={FileX}
 *     title="No applications yet"
 *     description="Applications submitted by members will appear here."
 *     action={{ label: "New Application", href: "/applications/new" }}
 *   />
 */
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ActionProps {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ActionProps;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      {Icon && (
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
          style={{ backgroundColor: "#F0F2F4" }}
        >
          <Icon
            className="w-6 h-6 text-chs-text-muted"
            aria-hidden="true"
          />
        </div>
      )}

      <p className="font-semibold text-chs-text text-base mb-1">{title}</p>

      {description && (
        <p className="text-sm text-chs-text-secondary max-w-xs">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-5">
          {action.href ? (
            <Link
              href={action.href}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-sm font-semibold bg-chs-navy text-white hover:bg-chs-slate transition-colors"
            >
              {action.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-sm font-semibold bg-chs-navy text-white hover:bg-chs-slate transition-colors"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
