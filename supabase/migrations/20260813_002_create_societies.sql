-- Migration 002: Societies, settings, officers, and document sequences.
--
-- The society is the top-level tenant. Every subsequent table that belongs
-- to a tenant carries society_id as a FK and is protected by RLS using that.
--
-- get_next_sequence() is an atomic counter function — the only way to
-- advance a sequence. It uses FOR UPDATE to prevent concurrent duplicates.

-- ── societies ─────────────────────────────────────────────────────────────────

create table public.societies (
  id                  uuid        not null default gen_random_uuid(),
  name                text        not null,
  registration_number text        not null,
  society_type        text        not null default 'CHS', -- CHS, CGHS, etc.
  address             text        not null,
  city                text        not null,
  state               text        not null,
  pin_code            text        not null,
  email               text        not null,
  phone               text        not null,
  website             text,
  pan                 text,
  gstin               text,
  registered_at       date        not null,
  logo_url            text,
  letterhead_url      text,
  is_active           boolean     not null default true,
  metadata            jsonb       not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid,
  updated_by          uuid,

  constraint societies_pkey primary key (id),
  constraint societies_reg_num_unique unique (registration_number)
);

comment on table  public.societies is
  'Top-level tenant entity. Every tenant record in the system references a society.';
comment on column public.societies.registration_number is
  'Registrar-issued CHS registration number. Unique across all societies.';

create index societies_is_active_idx on public.societies (is_active) where is_active = true;
create index societies_name_trgm_idx on public.societies using gin (name gin_trgm_ops);

create trigger trg_societies_updated_at
  before update on public.societies
  for each row execute procedure public.set_updated_at();

-- ── society_settings ──────────────────────────────────────────────────────────

create table public.society_settings (
  id                            uuid        not null default gen_random_uuid(),
  society_id                    uuid        not null references public.societies (id) on delete cascade,
  application_number_pattern    text        not null default 'APP/{year}/{seq}',
  contract_number_pattern       text        not null default 'CTR/{year}/{seq}',
  rfq_number_pattern            text        not null default 'RFQ/{year}/{seq}',
  work_order_number_pattern     text        not null default 'WO/{year}/{seq}',
  default_timezone              text        not null default 'Asia/Kolkata',
  allowed_mime_types            text[]      not null default array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ],
  max_upload_size_bytes         bigint      not null default 10485760, -- 10 MB
  contract_reminder_days        integer[]   not null default array[90, 60, 30, 14, 7],
  metadata                      jsonb       not null default '{}',
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now(),

  constraint society_settings_pkey primary key (id),
  constraint society_settings_society_id_unique unique (society_id)
);

comment on table public.society_settings is
  'Per-society configuration. One row per society (enforced by unique constraint).';

create trigger trg_society_settings_updated_at
  before update on public.society_settings
  for each row execute procedure public.set_updated_at();

-- ── society_officers ──────────────────────────────────────────────────────────

create table public.society_officers (
  id              uuid        not null default gen_random_uuid(),
  society_id      uuid        not null references public.societies (id) on delete cascade,
  officer_type    text        not null, -- OfficerType enum values
  member_id       uuid,                 -- FK to members (added in a later migration)
  name            text        not null,
  designation     text,
  phone           text,
  email           text,
  is_signatory    boolean     not null default false,
  display_order   integer     not null default 0,
  effective_from  date        not null default current_date,
  effective_until date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint society_officers_pkey primary key (id),
  constraint society_officers_officer_type_check check (
    officer_type in ('CHAIRMAN', 'SECRETARY', 'TREASURER', 'COMMITTEE_MEMBER', 'MANAGING_COMMITTEE')
  )
);

comment on table public.society_officers is
  'Committee members who serve as signatories on letters and notices.';
comment on column public.society_officers.member_id is
  'Optional link to the members table (added in Phase 3 migration).';

create index society_officers_society_id_idx on public.society_officers (society_id, effective_from desc);

create trigger trg_society_officers_updated_at
  before update on public.society_officers
  for each row execute procedure public.set_updated_at();

-- ── document_number_sequences ─────────────────────────────────────────────────

create table public.document_number_sequences (
  id              uuid        not null default gen_random_uuid(),
  society_id      uuid        not null references public.societies (id) on delete cascade,
  sequence_type   text        not null, -- SequenceType enum values
  year            integer     not null,
  wing_code       text,                 -- null = society-wide sequence
  last_sequence   integer     not null default 0,
  created_at      timestamptz not null default now(),

  constraint document_number_sequences_pkey primary key (id),
  constraint document_number_sequences_unique
    unique (society_id, sequence_type, year, wing_code)
);

comment on table public.document_number_sequences is
  'Monotonically increasing counters for document numbers.
   Updated only via get_next_sequence() — never directly.';
comment on column public.document_number_sequences.wing_code is
  'When set, the sequence is per-wing (e.g. Wing A applications have their own counter).
   NULL = shared society-wide counter.';

create index document_number_sequences_lookup_idx
  on public.document_number_sequences (society_id, sequence_type, year);

-- ── get_next_sequence() ───────────────────────────────────────────────────────
--
-- Atomically increments and returns the next sequence number.
-- Uses SELECT ... FOR UPDATE to prevent concurrent duplicates.
-- Inserts the row if this is the first document of this type/year/wing.
--
-- Usage:
--   select get_next_sequence('society-uuid', 'MEMBER_APPLICATION', 2026, 'A');
--   → 1 (first application for Wing A in 2026)

create or replace function public.get_next_sequence(
  p_society_id    uuid,
  p_sequence_type text,
  p_year          integer,
  p_wing_code     text default null
)
  returns integer language plpgsql security definer as $$
declare
  v_next integer;
begin
  -- Upsert the sequence row, then lock it for update
  insert into public.document_number_sequences (
    society_id, sequence_type, year, wing_code, last_sequence
  ) values (
    p_society_id, p_sequence_type, p_year, p_wing_code, 0
  ) on conflict (society_id, sequence_type, year, wing_code)
  do nothing;

  -- Lock the row exclusively within this transaction
  update public.document_number_sequences
  set    last_sequence = last_sequence + 1
  where  society_id    = p_society_id
    and  sequence_type = p_sequence_type
    and  year          = p_year
    and  (
           (wing_code is null     and p_wing_code is null)
        or (wing_code = p_wing_code)
         )
  returning last_sequence into v_next;

  return v_next;
end;
$$;

comment on function public.get_next_sequence(uuid, text, integer, text) is
  'Atomic document sequence counter. Security definer — bypasses RLS
   so it can always write regardless of the caller''s row-level context.
   NEVER call this except when creating a new document.';
