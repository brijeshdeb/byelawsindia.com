/**
 * Shared utility functions.
 * shadcn/ui requires a `cn` utility in @/lib/utils.
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely, handling conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Indian currency (₹12,50,000) */
export function formatCurrency(
  amount: number,
  options?: { showPaise?: boolean }
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: options?.showPaise ? 2 : 0,
    maximumFractionDigits: options?.showPaise ? 2 : 0,
  }).format(amount);
}

/** Format a number in Indian grouping (1,23,456) */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}

/** Format a date as "13 Aug 2026" */
export function formatDate(
  date: string | Date | null | undefined,
  options?: { includeTime?: boolean }
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  const dateStr = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(d);

  if (options?.includeTime) {
    const timeStr = new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    }).format(d);
    return `${dateStr}, ${timeStr}`;
  }

  return dateStr;
}

/** Returns a human-readable relative time string ("2 days ago") */
export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 30) return formatDate(d);
  if (diffDay > 1) return `${diffDay} days ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffHour > 1) return `${diffHour} hours ago`;
  if (diffHour === 1) return "1 hour ago";
  if (diffMin > 1) return `${diffMin} minutes ago`;
  return "Just now";
}

/** Truncate a string to a maximum length */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}

/** Build initials from a full name (up to 2 characters) */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

/** Safely parse JSON, returning null on failure */
export function safeJsonParse<T>(json: string | null | undefined): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}
