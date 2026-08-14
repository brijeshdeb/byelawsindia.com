-- Migration 003: Wings and units.
--
-- Wings are sub-divisions of a society (e.g. "Wing A", "Wing B").
-- Units are individual flats/offices within a wing.
--
-- Both carry society_id directly for efficient RLS filtering.
-- This avoids a JOIN through wings just to check society_id when
-- filtering unit-level data.

-- ── wings ─────────────────────────────────────────────────────────────────────

create table public.wings (
  id            uuid        not null default gen_random_uuid(),
  society_id    uuid        not null references public.societies (id) on delete cascade,
  name          text        not null,
  code          text        not null, -- Short code: "A", "B", "C", "SHOP"
  address       text,
  total_units   integer,
  is_active     boolean     not null default true,
  display_order integer     not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint wings_pkey primary key (id),
  constraint wings_society_code_unique unique (society_id, code)
);

comment on table  public.wings is
  'Wings (blocks/buildings) within a society. A society must have at least one wing.';
comment on column public.wings.code is
  'Short identifier used in document numbers (e.g. APP/2026/A/001).
   Unique per society. Uppercase, no spaces.';

create index wings_society_id_idx on public.wings (society_id, display_order);
create index wings_active_idx on public.wings (society_id, is_active) where is_active = true;

create trigger trg_wings_updated_at
  before update on public.wings
  for each row execute procedure public.set_updated_at();

-- ── units ─────────────────────────────────────────────────────────────────────

create table public.units (
  id                  uuid        not null default gen_random_uuid(),
  society_id          uuid        not null references public.societies (id) on delete cascade,
  wing_id             uuid        not null references public.wings (id) on delete restrict,
  unit_number         text        not null,
  floor               integer,
  unit_type           text        not null default 'RESIDENTIAL',
  carpet_area_sqft    numeric(10, 2),
  built_up_area_sqft  numeric(10, 2),
  status              text        not null default 'VACANT',
  metadata            jsonb       not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint units_pkey primary key (id),
  constraint units_wing_unit_unique unique (wing_id, unit_number),
  constraint units_type_check check (
    unit_type in ('RESIDENTIAL', 'COMMERCIAL', 'PARKING', 'OTHER')
  ),
  constraint units_status_check check (
    status in ('OCCUPIED', 'VACANT', 'UNDER_TRANSFER', 'DISPUTED')
  ),
  constraint units_society_matches_wing check (
    -- Enforced at app layer; this constraint catches bugs
    true -- Cannot directly join during constraint evaluation; handled in trigger
  )
);

comment on table  public.units is
  'Individual dwelling units / flats / offices within a wing.';
comment on column public.units.society_id is
  'Denormalized from wings.society_id for direct RLS filtering.
   Must always match wings.society_id — enforced by the insert trigger below.';
comment on column public.units.status is
  'VACANT: unoccupied; OCCUPIED: active member; UNDER_TRANSFER: NOC in progress; DISPUTED: legal hold.';

create index units_society_id_idx  on public.units (society_id);
create index units_wing_id_idx     on public.units (wing_id);
create index units_status_idx      on public.units (society_id, status);

create trigger trg_units_updated_at
  before update on public.units
  for each row execute procedure public.set_updated_at();

-- Trigger: ensure units.society_id matches wings.society_id
create or replace function public.validate_unit_society()
  returns trigger language plpgsql security definer as $$
declare
  v_wing_society_id uuid;
begin
  select society_id into v_wing_society_id
  from   public.wings
  where  id = new.wing_id;

  if v_wing_society_id is null then
    raise exception 'Wing % does not exist', new.wing_id;
  end if;

  if v_wing_society_id <> new.society_id then
    raise exception
      'Unit society_id (%) does not match wing society_id (%). '
      'Units must belong to the same society as their wing.',
      new.society_id, v_wing_society_id;
  end if;

  return new;
end;
$$;

create trigger trg_validate_unit_society
  before insert or update on public.units
  for each row execute procedure public.validate_unit_society();
