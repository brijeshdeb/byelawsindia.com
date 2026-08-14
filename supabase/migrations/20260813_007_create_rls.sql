-- Migration 007: Enable RLS and create all authorization policies.
--
-- Architecture:
--   1. Helper functions (SECURITY DEFINER) — read auth.uid() and bypass RLS
--      on the tables they join, returning only boolean results.
--   2. RLS enabled on every tenant table.
--   3. Policies reference the helper functions or check auth.uid() directly.
--
-- Helper function safety:
--   • They are SECURITY DEFINER — they execute as the function owner (postgres),
--     not as the calling user, so they bypass RLS on the tables they read.
--   • They return only boolean — no data is leaked to callers.
--   • They are STABLE — safe to inline by the query planner; results won't
--     vary within a single statement.
--   • set search_path = public prevents search_path injection.
--
-- Security layer summary:
--   Database (RLS)     → primary tenant isolation layer
--   Service layer      → requirePermission() in AccessService.ts
--   Frontend           → PermissionGate (UX only, not security)
--
-- NEVER weaken these policies without a corresponding test in
-- tests/isolation/tenant-isolation.test.ts passing.

-- ═══════════════════════════════════════════════════════════════════
-- SECTION 1: HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════

-- ── is_platform_admin() ──────────────────────────────────────────────────────

create or replace function public.is_platform_admin()
  returns boolean
  language plpgsql
  security definer
  stable
  set search_path = public
as $$
begin
  return coalesce(
    (
      select p.is_platform_admin
      from   public.profiles p
      where  p.id = auth.uid()
    ),
    false
  );
end;
$$;

comment on function public.is_platform_admin() is
  'Returns true if auth.uid() is a platform administrator.
   SECURITY DEFINER: bypasses RLS on profiles. Returns only a boolean.';

-- ── can_access_society(p_society_id) ────────────────────────────────────────
--
-- Returns true if the current user has at least one active assignment
-- in the given society. Platform admins always return true.

create or replace function public.can_access_society(p_society_id uuid)
  returns boolean
  language plpgsql
  security definer
  stable
  set search_path = public
as $$
begin
  -- Fast-path for platform admins
  if public.is_platform_admin() then
    return true;
  end if;

  return exists (
    select 1
    from   public.user_access_assignments
    where  user_id    = auth.uid()
      and  society_id = p_society_id
      and  is_active  = true
      and  (valid_from  is null or valid_from  <= now())
      and  (valid_until is null or valid_until >  now())
  );
end;
$$;

comment on function public.can_access_society(uuid) is
  'Returns true if auth.uid() has any active assignment in p_society_id.';

-- ── can_access_wing(p_society_id, p_wing_id) ────────────────────────────────
--
-- Returns true if the current user can operate on this wing.
-- A society-wide assignment (wing_id IS NULL) grants access to all wings.
-- A wing-scoped assignment only grants access to the exact wing.

create or replace function public.can_access_wing(p_society_id uuid, p_wing_id uuid)
  returns boolean
  language plpgsql
  security definer
  stable
  set search_path = public
as $$
begin
  if public.is_platform_admin() then
    return true;
  end if;

  return exists (
    select 1
    from   public.user_access_assignments
    where  user_id    = auth.uid()
      and  society_id = p_society_id
      and  is_active  = true
      and  (valid_from  is null or valid_from  <= now())
      and  (valid_until is null or valid_until >  now())
      and  (
             wing_id is null           -- society-wide: covers all wings
          or wing_id = p_wing_id       -- exact wing match
           )
  );
end;
$$;

comment on function public.can_access_wing(uuid, uuid) is
  'Returns true if auth.uid() can access p_wing_id within p_society_id.
   Society-wide assignments (wing_id = null) pass this check for any wing.';

-- ── has_permission(p_society_id, p_permission_code, p_wing_id) ──────────────
--
-- The core permission check. Returns true if the user holds a role that
-- includes the given permission code, scoped to the given society and wing.

create or replace function public.has_permission(
  p_society_id      uuid,
  p_permission_code text,
  p_wing_id         uuid default null
)
  returns boolean
  language plpgsql
  security definer
  stable
  set search_path = public
as $$
begin
  if public.is_platform_admin() then
    return true;
  end if;

  return exists (
    select 1
    from   public.user_access_assignments uaa
    join   public.role_permissions rp   on rp.role_id      = uaa.role_id
    join   public.permissions      perm on perm.id          = rp.permission_id
    where  uaa.user_id    = auth.uid()
      and  uaa.society_id = p_society_id
      and  uaa.is_active  = true
      and  (uaa.valid_from  is null or uaa.valid_from  <= now())
      and  (uaa.valid_until is null or uaa.valid_until >  now())
      and  perm.code      = p_permission_code
      and  (
             p_wing_id    is null        -- no wing filter requested
          or uaa.wing_id  is null        -- society-wide covers all wings
          or uaa.wing_id  = p_wing_id    -- exact match
           )
  );
end;
$$;

comment on function public.has_permission(uuid, text, uuid) is
  'Returns true if auth.uid() holds the given permission in the given society/wing context.';

-- ═══════════════════════════════════════════════════════════════════
-- SECTION 2: ENABLE RLS ON ALL TABLES
-- ═══════════════════════════════════════════════════════════════════

alter table public.profiles                    enable row level security;
alter table public.login_activity              enable row level security;
alter table public.societies                   enable row level security;
alter table public.society_settings            enable row level security;
alter table public.society_officers            enable row level security;
alter table public.document_number_sequences   enable row level security;
alter table public.wings                       enable row level security;
alter table public.units                       enable row level security;
alter table public.roles                       enable row level security;
alter table public.permissions                 enable row level security;
alter table public.role_permissions            enable row level security;
alter table public.user_access_assignments     enable row level security;
alter table public.audit_logs                  enable row level security;

-- Force RLS even for table owners (defense against accidental superuser misuse)
alter table public.profiles                    force row level security;
alter table public.societies                   force row level security;
alter table public.user_access_assignments     force row level security;
alter table public.audit_logs                  force row level security;

-- ═══════════════════════════════════════════════════════════════════
-- SECTION 3: RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════

-- ── profiles ────────────────────────────────────────────────────────────────

-- Users can always read their own profile
create policy "profiles: read own"
  on public.profiles for select
  using (id = auth.uid());

-- Platform admins can read all profiles
create policy "profiles: platform admin reads all"
  on public.profiles for select
  using (public.is_platform_admin());

-- Users can update their own profile (but not is_platform_admin or is_active)
-- Enforcement of the field restriction is in the application layer (RLS alone
-- cannot restrict individual columns; use a view or app check for that).
create policy "profiles: update own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Platform admins can update any profile
create policy "profiles: platform admin updates all"
  on public.profiles for update
  using (public.is_platform_admin());

-- The handle_new_user trigger uses a SECURITY DEFINER function — no INSERT policy needed.
-- Users cannot directly insert profiles.

-- ── login_activity ────────────────────────────────────────────────────────────

-- Users can see their own login history
create policy "login_activity: read own"
  on public.login_activity for select
  using (user_id = auth.uid());

-- Platform admins can see all login activity
create policy "login_activity: platform admin reads all"
  on public.login_activity for select
  using (public.is_platform_admin());

-- Authenticated users can insert their own login events
-- (in practice, the audit service uses the service role client,
--  but we allow authenticated role as a safe fallback)
create policy "login_activity: insert own"
  on public.login_activity for insert
  with check (user_id = auth.uid());

-- NO update or delete policies — login_activity is immutable

-- ── societies ────────────────────────────────────────────────────────────────

-- Users with any assignment to a society can see it
create policy "societies: members can read"
  on public.societies for select
  using (public.can_access_society(id));

-- Only platform admins create, update, or delete societies
create policy "societies: platform admin manages"
  on public.societies for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ── society_settings ─────────────────────────────────────────────────────────

create policy "society_settings: members can read"
  on public.society_settings for select
  using (public.can_access_society(society_id));

create policy "society_settings: admins can update"
  on public.society_settings for update
  using (public.has_permission(society_id, 'admin.settings'));

-- ── society_officers ─────────────────────────────────────────────────────────

create policy "society_officers: members can read"
  on public.society_officers for select
  using (public.can_access_society(society_id));

create policy "society_officers: admins manage"
  on public.society_officers for all
  using (
    public.has_permission(society_id, 'admin.settings')
    or public.is_platform_admin()
  )
  with check (
    public.has_permission(society_id, 'admin.settings')
    or public.is_platform_admin()
  );

-- ── document_number_sequences ────────────────────────────────────────────────

create policy "sequences: members can read"
  on public.document_number_sequences for select
  using (public.can_access_society(society_id));

-- All writes go through get_next_sequence() which is SECURITY DEFINER.
-- No direct INSERT/UPDATE/DELETE policies needed for authenticated users.

-- ── wings ────────────────────────────────────────────────────────────────────

-- Society members can see all wings in their society
create policy "wings: society members can read"
  on public.wings for select
  using (public.can_access_society(society_id));

-- Wing management requires admin.settings or wing.manage permission
create policy "wings: admins can manage"
  on public.wings for all
  using (
    public.has_permission(society_id, 'wing.manage')
    or public.is_platform_admin()
  )
  with check (
    public.has_permission(society_id, 'wing.manage')
    or public.is_platform_admin()
  );

-- ── units ────────────────────────────────────────────────────────────────────

-- Wing-scoped users see units only in their wing.
-- Society-wide users see all units.
create policy "units: wing-aware read"
  on public.units for select
  using (public.can_access_wing(society_id, wing_id));

-- Unit management requires wing.manage permission AND wing access
create policy "units: admins can manage"
  on public.units for all
  using (
    public.can_access_wing(society_id, wing_id)
    and (
      public.has_permission(society_id, 'wing.manage', wing_id)
      or public.is_platform_admin()
    )
  )
  with check (
    public.can_access_wing(society_id, wing_id)
    and (
      public.has_permission(society_id, 'wing.manage', wing_id)
      or public.is_platform_admin()
    )
  );

-- ── roles ────────────────────────────────────────────────────────────────────

-- Roles are global definitions — all authenticated users can see them
-- (needed to display role names in admin UIs)
create policy "roles: authenticated can read"
  on public.roles for select
  using (auth.role() = 'authenticated');

-- Only platform admins create/update/delete roles
create policy "roles: platform admin manages"
  on public.roles for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ── permissions ──────────────────────────────────────────────────────────────

-- All authenticated users can see permission definitions
create policy "permissions: authenticated can read"
  on public.permissions for select
  using (auth.role() = 'authenticated');

-- No INSERT/UPDATE/DELETE — permissions are managed via migrations only

-- ── role_permissions ─────────────────────────────────────────────────────────

-- All authenticated users can read role-permission mappings
-- (needed to display "this role has these permissions" in admin UIs)
create policy "role_permissions: authenticated can read"
  on public.role_permissions for select
  using (auth.role() = 'authenticated');

-- Platform admins can manage role-permission mappings
create policy "role_permissions: platform admin manages"
  on public.role_permissions for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ── user_access_assignments ──────────────────────────────────────────────────
--
-- CRITICAL: This is the assignment table. Getting this wrong breaks isolation.
-- A user can only see assignments for societies they already have access to.
-- This prevents an attacker from enumerating society membership.

-- Users can always see their own assignments
create policy "assignments: users see own"
  on public.user_access_assignments for select
  using (user_id = auth.uid());

-- Society admins (admin.users permission) can see all assignments in their society
create policy "assignments: admins see society assignments"
  on public.user_access_assignments for select
  using (public.has_permission(society_id, 'admin.users'));

-- Platform admins see all
create policy "assignments: platform admin sees all"
  on public.user_access_assignments for select
  using (public.is_platform_admin());

-- Creating or modifying assignments requires admin.users permission in the target society
create policy "assignments: admins can create"
  on public.user_access_assignments for insert
  with check (
    public.has_permission(society_id, 'admin.users')
    or public.is_platform_admin()
  );

create policy "assignments: admins can update"
  on public.user_access_assignments for update
  using (
    public.has_permission(society_id, 'admin.users')
    or public.is_platform_admin()
  )
  with check (
    public.has_permission(society_id, 'admin.users')
    or public.is_platform_admin()
  );

-- Only platform admins hard-delete assignments
-- (society admins should set is_active = false instead)
create policy "assignments: platform admin can delete"
  on public.user_access_assignments for delete
  using (public.is_platform_admin());

-- ── audit_logs ───────────────────────────────────────────────────────────────
--
-- Audit writes in production go via the service role (admin client),
-- which bypasses RLS. The INSERT policy below is a safe fallback only.
-- The immutability guarantee comes from the absence of UPDATE/DELETE policies.

-- Society members with audit permission can read their society's audit log
create policy "audit_logs: audit-permission read"
  on public.audit_logs for select
  using (
    (society_id is null and public.is_platform_admin())
    or (
      society_id is not null
      and public.has_permission(society_id, 'audit.read')
    )
  );

-- Platform admins see all audit records
create policy "audit_logs: platform admin reads all"
  on public.audit_logs for select
  using (public.is_platform_admin());

-- Safe fallback insert policy (real inserts bypass RLS via admin client)
create policy "audit_logs: authenticated can insert"
  on public.audit_logs for insert
  with check (auth.role() = 'authenticated');

-- NO update or delete policies — audit_logs are immutable

-- ═══════════════════════════════════════════════════════════════════
-- SECTION 4: GRANTS
-- ═══════════════════════════════════════════════════════════════════
--
-- Supabase creates the `anon` and `authenticated` roles automatically.
-- We grant EXECUTE on helper functions so RLS policies can call them.
-- We do NOT grant direct table access beyond what RLS allows.

grant execute on function public.is_platform_admin()                      to authenticated;
grant execute on function public.can_access_society(uuid)                 to authenticated;
grant execute on function public.can_access_wing(uuid, uuid)              to authenticated;
grant execute on function public.has_permission(uuid, text, uuid)         to authenticated;

-- get_next_sequence is used by server-side code via admin client;
-- but authenticated role needs EXECUTE for any direct calls too.
grant execute on function public.get_next_sequence(uuid, text, integer, text) to authenticated;
grant execute on function public.get_next_sequence(uuid, text, integer, text) to service_role;

-- set_updated_at is called by triggers (no grant needed — triggers run as owner)
-- handle_new_user is called by auth trigger (security definer — no grant needed)
-- validate_unit_society and validate_assignment_wing are trigger functions (no grant needed)
