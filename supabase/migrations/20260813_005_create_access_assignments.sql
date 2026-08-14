-- Migration 005: User access assignments.
--
-- This is the central authorization table. An assignment grants a user a
-- role within a specific society (and optionally a wing).
--
-- Key design rules:
--   • wing_id IS NULL = society-wide access (can operate in any wing)
--   • wing_id IS NOT NULL = wing-scoped access (restricted to that wing)
--   • valid_from / valid_until allow time-bounded access
--   • is_active = false means the assignment is inactive regardless of dates
--   • A user can have multiple assignments for the same society (different wings)
--   • A user can have assignments across multiple societies

create table public.user_access_assignments (
  id          uuid        not null default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  society_id  uuid        not null references public.societies (id) on delete cascade,
  wing_id     uuid                 references public.wings (id) on delete cascade,
  role_id     uuid        not null references public.roles (id) on delete restrict,
  is_active   boolean     not null default true,
  valid_from  timestamptz,          -- null = immediately active
  valid_until timestamptz,          -- null = never expires
  created_by  uuid        not null,
  updated_by  uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint user_access_assignments_pkey primary key (id),

  -- A user cannot hold the same role for the same society+wing combination
  -- (they can hold DIFFERENT roles, e.g. Procurement + Report roles)
  constraint user_access_assignments_unique
    unique nulls not distinct (user_id, society_id, wing_id, role_id)
);

comment on table  public.user_access_assignments is
  'Central authorization table. Each row grants a user a role within a specific
   society context. wing_id = null means society-wide access.
   NEVER query this table with only user_id — always include society_id.';
comment on column public.user_access_assignments.wing_id is
  'null = society-wide assignment. NOT NULL = restricted to this wing only.
   A society-wide user can read/write all wings. A wing-scoped user cannot
   cross into another wing.';
comment on column public.user_access_assignments.valid_from is
  'Start of access window. null = active immediately.
   RLS policies check: valid_from IS NULL OR valid_from <= now()';
comment on column public.user_access_assignments.valid_until is
  'End of access window. null = never expires.
   RLS policies check: valid_until IS NULL OR valid_until > now()';

-- ── Indexes ───────────────────────────────────────────────────────────────────
--
-- The most critical index for authorization performance:
-- Covering index on (user_id, society_id) — used in every session resolution.

create index uaa_user_society_idx
  on public.user_access_assignments (user_id, society_id)
  where is_active = true;

-- Used when listing all assignments for a society (admin views)
create index uaa_society_idx
  on public.user_access_assignments (society_id, is_active);

-- Used for wing-scope check
create index uaa_user_society_wing_idx
  on public.user_access_assignments (user_id, society_id, wing_id)
  where is_active = true;

-- Used for validity window checks
create index uaa_validity_idx
  on public.user_access_assignments (valid_until)
  where valid_until is not null;

create trigger trg_uaa_updated_at
  before update on public.user_access_assignments
  for each row execute procedure public.set_updated_at();

-- ── Guard: wing must belong to the same society ───────────────────────────────

create or replace function public.validate_assignment_wing()
  returns trigger language plpgsql security definer as $$
declare
  v_wing_society_id uuid;
begin
  if new.wing_id is null then
    return new; -- Society-wide assignments have no wing constraint
  end if;

  select society_id into v_wing_society_id
  from   public.wings
  where  id = new.wing_id;

  if v_wing_society_id is null then
    raise exception 'Wing % does not exist', new.wing_id;
  end if;

  if v_wing_society_id <> new.society_id then
    raise exception
      'Assignment wing % belongs to society % but the assignment is for society %.',
      new.wing_id, v_wing_society_id, new.society_id;
  end if;

  return new;
end;
$$;

create trigger trg_validate_assignment_wing
  before insert or update on public.user_access_assignments
  for each row execute procedure public.validate_assignment_wing();
