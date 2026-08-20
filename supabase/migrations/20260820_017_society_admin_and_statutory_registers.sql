-- Migration 017: Mandatory society administrators and statutory Form-I/Form-J data.

-- ── Statutory member fields ────────────────────────────────────────────────
alter table public.members
  add column address text,
  add column occupation text,
  add column age_at_admission smallint,
  add column entrance_fee_paid_at date,
  add column nominee_name_address text,
  add column nomination_date date,
  add column cessation_reason text,
  add column remark text,
  add constraint members_age_at_admission_check
    check (age_at_admission is null or age_at_admission between 0 and 120);

-- Every export creates an immutable filing snapshot. Updates and deletes are
-- deliberately omitted from both RLS policies and grants.
create table public.form_register_snapshots (
  id            uuid        not null default gen_random_uuid(),
  version       bigint      generated always as identity,
  society_id    uuid        not null references public.societies (id) on delete restrict,
  form_type     text        not null,
  row_count     integer     not null,
  data          jsonb       not null,
  generated_by  uuid        not null references auth.users (id) on delete restrict,
  generated_at  timestamptz not null default now(),

  constraint form_register_snapshots_pkey primary key (id),
  constraint form_register_snapshots_form_type_check check (form_type in ('FORM_I', 'FORM_J')),
  constraint form_register_snapshots_row_count_check check (row_count >= 0)
);

create index form_register_snapshots_society_form_idx
  on public.form_register_snapshots (society_id, form_type, version desc);

alter table public.form_register_snapshots enable row level security;

create policy "form_register_snapshots_select" on public.form_register_snapshots
  for select using (public.user_has_society_access(society_id));

create policy "form_register_snapshots_insert" on public.form_register_snapshots
  for insert with check (
    public.user_has_society_access(society_id)
    and generated_by = auth.uid()
  );

grant select, insert on table public.form_register_snapshots to authenticated;
grant usage, select on sequence public.form_register_snapshots_version_seq to authenticated;

-- ── Atomic society registration ────────────────────────────────────────────
-- Auth invitation happens first in the server action. This RPC then creates the
-- society, its defaults, and its first Society Admin assignment in one database
-- transaction, so a partially registered society cannot be committed.
create or replace function public.register_society_with_admin(
  p_name text,
  p_registration_number text,
  p_society_type text,
  p_address text,
  p_city text,
  p_state text,
  p_pin_code text,
  p_email text,
  p_phone text,
  p_website text,
  p_registered_at date,
  p_admin_user_id uuid,
  p_created_by uuid
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_society_id uuid;
  v_society_admin_role_id uuid;
begin
  if not exists (
    select 1 from public.profiles
    where id = p_admin_user_id and is_active = true
  ) then
    raise exception 'The selected Society Admin account is not active.';
  end if;

  select id into v_society_admin_role_id
  from public.roles
  where name = 'Society Admin' and is_system_role = true;

  if v_society_admin_role_id is null then
    raise exception 'The Society Admin system role is missing.';
  end if;

  insert into public.societies (
    name, registration_number, society_type, address, city, state, pin_code,
    email, phone, website, registered_at, is_active, created_by
  ) values (
    p_name, p_registration_number, p_society_type, p_address, p_city, p_state,
    p_pin_code, p_email, p_phone, p_website, p_registered_at, true, p_created_by
  ) returning id into v_society_id;

  insert into public.society_settings (society_id)
  values (v_society_id);

  insert into public.user_access_assignments (
    user_id, society_id, wing_id, role_id, is_active, created_by
  ) values (
    p_admin_user_id, v_society_id, null, v_society_admin_role_id, true, p_created_by
  );

  return v_society_id;
end;
$$;

revoke all on function public.register_society_with_admin(
  text, text, text, text, text, text, text, text, text, text, date, uuid, uuid
) from public, anon, authenticated;
grant execute on function public.register_society_with_admin(
  text, text, text, text, text, text, text, text, text, text, date, uuid, uuid
) to service_role;

-- ── Database-level administrator invariant ─────────────────────────────────
create or replace function public.assert_society_has_active_admin(p_society_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.societies
    where id = p_society_id and is_active = true
  ) and not exists (
    select 1
    from public.user_access_assignments uaa
    join public.roles r on r.id = uaa.role_id
    join public.profiles p on p.id = uaa.user_id
    where uaa.society_id = p_society_id
      and uaa.wing_id is null
      and uaa.is_active = true
      and uaa.valid_from is null
      and uaa.valid_until is null
      and r.name = 'Society Admin'
      and p.is_active = true
  ) then
    raise exception 'An active society must have at least one active, society-wide Society Admin.'
      using errcode = '23514';
  end if;
end;
$$;

create or replace function public.enforce_society_admin_on_society()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.assert_society_has_active_admin(new.id);
  return new;
end;
$$;

create or replace function public.enforce_society_admin_on_assignment()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.assert_society_has_active_admin(coalesce(new.society_id, old.society_id));
  if tg_op = 'UPDATE' and new.society_id is distinct from old.society_id then
    perform public.assert_society_has_active_admin(old.society_id);
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function public.enforce_society_admin_on_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_society_id uuid;
begin
  for v_society_id in
    select distinct society_id
    from public.user_access_assignments
    where user_id = new.id
  loop
    perform public.assert_society_has_active_admin(v_society_id);
  end loop;
  return new;
end;
$$;

create constraint trigger trg_society_requires_active_admin
  after insert or update of is_active on public.societies
  deferrable initially deferred
  for each row execute function public.enforce_society_admin_on_society();

create constraint trigger trg_assignment_preserves_society_admin
  after insert or update or delete on public.user_access_assignments
  deferrable initially deferred
  for each row execute function public.enforce_society_admin_on_assignment();

create constraint trigger trg_profile_preserves_society_admin
  after update of is_active on public.profiles
  deferrable initially deferred
  for each row execute function public.enforce_society_admin_on_profile();

revoke all on function public.assert_society_has_active_admin(uuid) from public, anon, authenticated;
revoke all on function public.enforce_society_admin_on_society() from public, anon, authenticated;
revoke all on function public.enforce_society_admin_on_assignment() from public, anon, authenticated;
revoke all on function public.enforce_society_admin_on_profile() from public, anon, authenticated;
