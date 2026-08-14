-- Migration 001: User profiles, login activity, and the auth trigger.
--
-- Design notes:
--   • profiles.id = auth.users.id (FK into auth schema)
--   • We do NOT store password hashes — Supabase Auth owns authentication
--   • handle_new_user() fires on INSERT into auth.users to create the profile
--   • login_activity is append-only (no UPDATE policy on it later)

-- ── profiles ──────────────────────────────────────────────────────────────────

create table public.profiles (
  id                uuid        not null references auth.users (id) on delete cascade,
  email             text        not null,
  full_name         text        not null default '',
  phone             text,
  avatar_url        text,
  is_active         boolean     not null default true,
  is_platform_admin boolean     not null default false,
  mfa_enabled       boolean     not null default false,
  last_sign_in_at   timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid,
  updated_by        uuid,

  constraint profiles_pkey primary key (id),
  constraint profiles_email_unique unique (email)
);

comment on table  public.profiles                  is 'Extended user profile linked to auth.users.';
comment on column public.profiles.id               is 'Matches auth.users.id — set by handle_new_user trigger.';
comment on column public.profiles.is_platform_admin is 'True: user can operate across all societies. Grant sparingly.';

create index profiles_email_idx on public.profiles (lower(email));
create index profiles_is_active_idx on public.profiles (is_active) where is_active = true;

-- Auto-update updated_at
create or replace function public.set_updated_at()
  returns trigger language plpgsql security definer as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ── login_activity ────────────────────────────────────────────────────────────

create table public.login_activity (
  id          uuid        not null default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  event_type  text        not null, -- LoginEventType values
  ip_address  text,
  user_agent  text,
  metadata    jsonb,
  created_at  timestamptz not null default now(),

  constraint login_activity_pkey primary key (id)
);

comment on table public.login_activity is
  'Append-only login event log. No UPDATE or DELETE allowed via RLS.';

create index login_activity_user_id_idx  on public.login_activity (user_id, created_at desc);
create index login_activity_created_idx  on public.login_activity (created_at desc);

-- ── Auth trigger: create profile on user signup ───────────────────────────────

create or replace function public.handle_new_user()
  returns trigger language plpgsql security definer as $$
declare
  v_full_name text;
begin
  -- Accept full_name from user_metadata if provided during signup
  v_full_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    ''
  );

  insert into public.profiles (
    id,
    email,
    full_name,
    is_active,
    is_platform_admin
  ) values (
    new.id,
    new.email,
    v_full_name,
    true,
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Fires on auth.users INSERT to create the matching profiles row.
   Security definer so it can write to profiles regardless of the
   calling user''s RLS context.';

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
