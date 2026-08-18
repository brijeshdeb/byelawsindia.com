-- Migration 016: Platform admin RLS bypass in user_has_society_access
--
-- Problem discovered after migration 014:
--   user_has_society_access() only checked user_access_assignments.
--   Platform admins had no rows there for the demo society (or any society
--   they hadn't explicitly been assigned to), so RLS blocked all SELECT
--   queries on finance_dues, society_documents, etc. when browsing as a
--   platform admin in the tenant shell.
--
-- Fix:
--   Add an OR branch that grants access when the calling user has
--   is_platform_admin = true in profiles. This mirrors the application-layer
--   bypass already in AccessService.resolveUserContext().
--
-- Security note:
--   Platform admins are already trusted at the application layer (server
--   actions verify is_platform_admin before operating on any data). Granting
--   them RLS SELECT access is consistent with their role and does not open
--   new attack surface. Write operations on tenant tables still go through
--   server actions that enforce RBAC independently of RLS.

CREATE OR REPLACE FUNCTION public.user_has_society_access(p_society_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Platform admins have implicit read access to every society
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND is_platform_admin = true
    )
    OR
    -- Regular users need an active access assignment
    EXISTS (
      SELECT 1 FROM public.user_access_assignments
      WHERE user_id   = auth.uid()
        AND society_id = p_society_id
        AND is_active  = true
        AND (valid_from  IS NULL OR valid_from  <= now())
        AND (valid_until IS NULL OR valid_until  > now())
    )
$$;
