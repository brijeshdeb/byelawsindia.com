/**
 * Permission utilities.
 *
 * These functions work with the UserContext object to answer
 * authorization questions in Server Components and client code.
 *
 * CRITICAL: These are UX helpers. The actual authorization source of truth
 * is PostgreSQL RLS and the server-side AccessService.requirePermission().
 * Never use only these client-side checks as a security gate.
 */
import type { UserContext, PermissionCode } from "@/types";

/**
 * Returns true if the user context includes the given permission.
 * Wing scoping is handled at assignment time — if the user has a permission
 * in their current context (which is already wing-scoped), this returns true.
 */
export function hasPermission(
  context: UserContext,
  permission: PermissionCode
): boolean {
  if (context.isPlatformAdmin) return true;
  return context.permissions.has(permission);
}

/**
 * Returns true if the user has ANY of the given permissions.
 */
export function hasAnyPermission(
  context: UserContext,
  permissions: PermissionCode[]
): boolean {
  if (context.isPlatformAdmin) return true;
  return permissions.some((p) => context.permissions.has(p));
}

/**
 * Returns true if the user has ALL of the given permissions.
 */
export function hasAllPermissions(
  context: UserContext,
  permissions: PermissionCode[]
): boolean {
  if (context.isPlatformAdmin) return true;
  return permissions.every((p) => context.permissions.has(p));
}

/**
 * Returns true if the user's context is scoped to a specific wing
 * (as opposed to society-wide access).
 */
export function isWingScoped(context: UserContext): boolean {
  return context.wingId !== null;
}

/**
 * Returns true if the user can access wing-level data.
 * Society-wide users can access any wing; wing-scoped users only their own.
 */
export function canAccessWing(
  context: UserContext,
  targetWingId: string
): boolean {
  if (context.isPlatformAdmin) return true;
  if (context.wingId === null) return true; // Society-wide access
  return context.wingId === targetWingId;
}

/**
 * Filter a list to only items the user can access by wing.
 */
export function filterByWingAccess<T extends { wing_id: string }>(
  context: UserContext,
  items: T[]
): T[] {
  if (context.isPlatformAdmin || context.wingId === null) return items;
  return items.filter((item) => item.wing_id === context.wingId);
}
