/**
 * PermissionGate — render children only when the user has a permission.
 *
 * This is a UX control, NOT a security boundary. Authorization is enforced
 * server-side in Route Handlers, Server Actions, and at the database
 * layer via RLS. This component prevents rendering inaccessible UI.
 *
 * Usage (server component):
 *   <PermissionGate context={userCtx} permission={PERMISSIONS.MEMBER_VIEW}>
 *     <SensitiveContent />
 *   </PermissionGate>
 *
 * For client components, import hasPermission from @/lib/permissions
 * and use it inside a hook or conditional render.
 */
import type { UserContext } from "@/types";
import { hasPermission, hasAnyPermission } from "@/lib/permissions";

interface Props {
  context: UserContext;
  /** Require this exact permission. */
  permission?: string;
  /** Require at least one of these permissions. */
  anyOf?: string[];
  /** What to render when access is denied. Defaults to null. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({
  context,
  permission,
  anyOf,
  fallback = null,
  children,
}: Props) {
  let allowed = false;

  if (context.isPlatformAdmin) {
    allowed = true;
  } else if (permission) {
    allowed = hasPermission(context, permission);
  } else if (anyOf && anyOf.length > 0) {
    allowed = hasAnyPermission(context, anyOf);
  } else {
    // No permission specified — allow by default (caller decides)
    allowed = true;
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}
