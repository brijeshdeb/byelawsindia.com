-- Migration 009: Domain tables — members, documents, applications,
-- maintenance, finance, vendors, and procurement.
--
-- Design notes:
--   • Every table carries society_id for direct RLS filtering (no JOIN traversal).
--   • Sequence numbers use get_next_sequence() — never generate them inline.
--   • All INSERT/UPDATE policies rely on user_has_society_access() helper below.
--   • App layer enforces finer-grained permission codes; RLS is the second wall.

-- ── RLS helper: check active society assignment ───────────────────────────────
create or replace function public.user_has_society_access(p_society_id uuid)
  returns boolean language sql security definer stable as $$
    select exists (
      select 1 from public.user_access_assignments
      where user_id   = auth.uid()
        and society_id = p_society_id
        and is_active  = true
        and (valid_from  is null or valid_from  <= now())
        and (valid_until is null or valid_until  > now())
    )
$$;

comment on function public.user_has_society_access(uuid) is
  'Returns true if the calling auth.uid() has any active assignment for the given society.
   Used as the gate in RLS policies for all tenant-scoped tables.
   Security definer so it can read user_access_assignments regardless of the caller.';

-- ── members ───────────────────────────────────────────────────────────────────
create table public.members (
  id              uuid        not null default gen_random_uuid(),
  society_id      uuid        not null references public.societies (id) on delete cascade,
  unit_id         uuid                 references public.units (id) on delete set null,
  member_number   text        not null,
  full_name       text        not null,
  email           text,
  phone           text,
  member_type     text        not null default 'OWNER',
  status          text        not null default 'ACTIVE',
  effective_from  date        not null default current_date,
  effective_until date,
  notes           text,
  metadata        jsonb       not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  created_by      uuid                 references auth.users (id),

  constraint members_pkey primary key (id),
  constraint members_society_number_unique unique (society_id, member_number),
  constraint members_type_check check (
    member_type in ('OWNER', 'TENANT', 'ASSOCIATE', 'COMMITTEE')
  ),
  constraint members_status_check check (
    status in ('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'DECEASED')
  )
);

alter table public.members enable row level security;

create policy "members_select" on public.members
  for select using (user_has_society_access(society_id));

create policy "members_insert" on public.members
  for insert with check (user_has_society_access(society_id));

create policy "members_update" on public.members
  for update using (user_has_society_access(society_id));

create index members_society_id_idx  on public.members (society_id);
create index members_unit_id_idx     on public.members (unit_id);
create index members_status_idx      on public.members (society_id, status);

create trigger trg_members_updated_at
  before update on public.members
  for each row execute procedure public.set_updated_at();

-- ── society_documents ─────────────────────────────────────────────────────────
create table public.society_documents (
  id               uuid        not null default gen_random_uuid(),
  society_id       uuid        not null references public.societies (id) on delete cascade,
  title            text        not null,
  category         text        not null default 'OTHER',
  description      text,
  file_name        text,
  file_size_bytes  bigint,
  mime_type        text,
  storage_path     text,
  is_verified      boolean     not null default false,
  verified_by      uuid                 references auth.users (id),
  verified_at      timestamptz,
  metadata         jsonb       not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  uploaded_by      uuid                 references auth.users (id),

  constraint society_documents_pkey primary key (id),
  constraint society_documents_category_check check (
    category in ('MINUTES', 'NOTICE', 'CIRCULAR', 'COMPLIANCE', 'FINANCIAL', 'LEGAL', 'OTHER')
  )
);

alter table public.society_documents enable row level security;

create policy "society_documents_select" on public.society_documents
  for select using (user_has_society_access(society_id));

create policy "society_documents_insert" on public.society_documents
  for insert with check (user_has_society_access(society_id));

create policy "society_documents_update" on public.society_documents
  for update using (user_has_society_access(society_id));

create index society_documents_society_id_idx  on public.society_documents (society_id);
create index society_documents_category_idx    on public.society_documents (society_id, category);

create trigger trg_society_documents_updated_at
  before update on public.society_documents
  for each row execute procedure public.set_updated_at();

-- ── member_applications ───────────────────────────────────────────────────────
create table public.member_applications (
  id                  uuid        not null default gen_random_uuid(),
  society_id          uuid        not null references public.societies (id) on delete cascade,
  application_number  text        not null,
  applicant_name      text        not null,
  applicant_email     text,
  applicant_phone     text,
  unit_id             uuid                 references public.units (id),
  application_type    text        not null default 'MEMBERSHIP',
  status              text        not null default 'SUBMITTED',
  submitted_at        timestamptz          default now(),
  notes               text,
  metadata            jsonb       not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid                 references auth.users (id),

  constraint member_applications_pkey primary key (id),
  constraint member_applications_number_unique unique (society_id, application_number),
  constraint member_applications_type_check check (
    application_type in ('MEMBERSHIP', 'NOC_SALE', 'NOC_RENOVATION', 'PARKING', 'OTHER')
  ),
  constraint member_applications_status_check check (
    status in ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN')
  )
);

alter table public.member_applications enable row level security;

create policy "member_applications_select" on public.member_applications
  for select using (user_has_society_access(society_id));

create policy "member_applications_insert" on public.member_applications
  for insert with check (user_has_society_access(society_id));

create policy "member_applications_update" on public.member_applications
  for update using (user_has_society_access(society_id));

create index member_applications_society_id_idx on public.member_applications (society_id);
create index member_applications_status_idx     on public.member_applications (society_id, status);

create trigger trg_member_applications_updated_at
  before update on public.member_applications
  for each row execute procedure public.set_updated_at();

-- ── vendors ───────────────────────────────────────────────────────────────────
create table public.vendors (
  id            uuid        not null default gen_random_uuid(),
  society_id    uuid        not null references public.societies (id) on delete cascade,
  vendor_code   text        not null,
  name          text        not null,
  vendor_type   text        not null default 'OTHER',
  contact_name  text,
  email         text,
  phone         text,
  address       text,
  gstin         text,
  pan           text,
  status        text        not null default 'ACTIVE',
  is_verified   boolean     not null default false,
  notes         text,
  metadata      jsonb       not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid                 references auth.users (id),

  constraint vendors_pkey primary key (id),
  constraint vendors_society_code_unique unique (society_id, vendor_code),
  constraint vendors_type_check check (
    vendor_type in ('CIVIL', 'ELECTRICAL', 'PLUMBING', 'SECURITY', 'HOUSEKEEPING', 'IT', 'LANDSCAPING', 'OTHER')
  ),
  constraint vendors_status_check check (
    status in ('ACTIVE', 'INACTIVE', 'BLACKLISTED')
  )
);

alter table public.vendors enable row level security;

create policy "vendors_select" on public.vendors
  for select using (user_has_society_access(society_id));

create policy "vendors_insert" on public.vendors
  for insert with check (user_has_society_access(society_id));

create policy "vendors_update" on public.vendors
  for update using (user_has_society_access(society_id));

create index vendors_society_id_idx on public.vendors (society_id);
create index vendors_status_idx     on public.vendors (society_id, status);

create trigger trg_vendors_updated_at
  before update on public.vendors
  for each row execute procedure public.set_updated_at();

-- ── maintenance_complaints ────────────────────────────────────────────────────
create table public.maintenance_complaints (
  id                      uuid        not null default gen_random_uuid(),
  society_id              uuid        not null references public.societies (id) on delete cascade,
  complaint_number        text        not null,
  title                   text        not null,
  description             text,
  location                text,
  wing_id                 uuid                 references public.wings (id),
  unit_id                 uuid                 references public.units (id),
  urgency                 text        not null default 'NORMAL',
  status                  text        not null default 'OPEN',
  reported_by_member_id   uuid                 references public.members (id),
  assigned_to             text,
  resolved_at             timestamptz,
  metadata                jsonb       not null default '{}',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  created_by              uuid                 references auth.users (id),

  constraint maintenance_complaints_pkey primary key (id),
  constraint maintenance_complaints_number_unique unique (society_id, complaint_number),
  constraint maintenance_complaints_urgency_check check (
    urgency in ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')
  ),
  constraint maintenance_complaints_status_check check (
    status in ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')
  )
);

alter table public.maintenance_complaints enable row level security;

create policy "maintenance_complaints_select" on public.maintenance_complaints
  for select using (user_has_society_access(society_id));

create policy "maintenance_complaints_insert" on public.maintenance_complaints
  for insert with check (user_has_society_access(society_id));

create policy "maintenance_complaints_update" on public.maintenance_complaints
  for update using (user_has_society_access(society_id));

create index maintenance_complaints_society_id_idx on public.maintenance_complaints (society_id);
create index maintenance_complaints_status_idx     on public.maintenance_complaints (society_id, status);

create trigger trg_maintenance_complaints_updated_at
  before update on public.maintenance_complaints
  for each row execute procedure public.set_updated_at();

-- ── maintenance_work_orders ───────────────────────────────────────────────────
create table public.maintenance_work_orders (
  id                  uuid        not null default gen_random_uuid(),
  society_id          uuid        not null references public.societies (id) on delete cascade,
  work_order_number   text        not null,
  title               text        not null,
  description         text,
  wing_id             uuid                 references public.wings (id),
  priority            text        not null default 'NORMAL',
  status              text        not null default 'PENDING',
  vendor_id           uuid                 references public.vendors (id),
  complaint_id        uuid                 references public.maintenance_complaints (id),
  estimated_cost      numeric(12, 2),
  actual_cost         numeric(12, 2),
  scheduled_date      date,
  completed_at        timestamptz,
  created_by          uuid                 references auth.users (id),
  metadata            jsonb       not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint maintenance_work_orders_pkey primary key (id),
  constraint maintenance_work_orders_number_unique unique (society_id, work_order_number),
  constraint maintenance_work_orders_priority_check check (
    priority in ('LOW', 'NORMAL', 'HIGH', 'URGENT')
  ),
  constraint maintenance_work_orders_status_check check (
    status in ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
  )
);

alter table public.maintenance_work_orders enable row level security;

create policy "maintenance_work_orders_select" on public.maintenance_work_orders
  for select using (user_has_society_access(society_id));

create policy "maintenance_work_orders_insert" on public.maintenance_work_orders
  for insert with check (user_has_society_access(society_id));

create policy "maintenance_work_orders_update" on public.maintenance_work_orders
  for update using (user_has_society_access(society_id));

create index maintenance_work_orders_society_id_idx on public.maintenance_work_orders (society_id);
create index maintenance_work_orders_status_idx     on public.maintenance_work_orders (society_id, status);

create trigger trg_maintenance_work_orders_updated_at
  before update on public.maintenance_work_orders
  for each row execute procedure public.set_updated_at();

-- ── rfqs ──────────────────────────────────────────────────────────────────────
create table public.rfqs (
  id                   uuid        not null default gen_random_uuid(),
  society_id           uuid        not null references public.societies (id) on delete cascade,
  rfq_number           text        not null,
  title                text        not null,
  description          text,
  category             text        not null default 'GENERAL',
  status               text        not null default 'DRAFT',
  submission_deadline  timestamptz,
  estimated_budget     numeric(12, 2),
  notes                text,
  awarded_vendor       text,
  created_by           uuid                 references auth.users (id),
  metadata             jsonb       not null default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint rfqs_pkey primary key (id),
  constraint rfqs_number_unique unique (society_id, rfq_number),
  constraint rfqs_category_check check (
    category in ('CIVIL', 'ELECTRICAL', 'PLUMBING', 'SECURITY', 'HOUSEKEEPING', 'IT', 'LANDSCAPING', 'GENERAL', 'OTHER')
  ),
  constraint rfqs_status_check check (
    status in ('DRAFT', 'PUBLISHED', 'EVALUATION', 'AWARDED', 'CANCELLED')
  )
);

alter table public.rfqs enable row level security;

create policy "rfqs_select" on public.rfqs
  for select using (user_has_society_access(society_id));

create policy "rfqs_insert" on public.rfqs
  for insert with check (user_has_society_access(society_id));

create policy "rfqs_update" on public.rfqs
  for update using (user_has_society_access(society_id));

create index rfqs_society_id_idx on public.rfqs (society_id);
create index rfqs_status_idx     on public.rfqs (society_id, status);

create trigger trg_rfqs_updated_at
  before update on public.rfqs
  for each row execute procedure public.set_updated_at();

-- ── procurement_work_orders ───────────────────────────────────────────────────
create table public.procurement_work_orders (
  id                  uuid        not null default gen_random_uuid(),
  society_id          uuid        not null references public.societies (id) on delete cascade,
  work_order_number   text        not null,
  title               text        not null,
  vendor_id           uuid                 references public.vendors (id),
  rfq_id              uuid                 references public.rfqs (id),
  contract_id         uuid,
  amount              numeric(12, 2),
  status              text        not null default 'DRAFT',
  start_date          date,
  completion_date     date,
  description         text,
  created_by          uuid                 references auth.users (id),
  metadata            jsonb       not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint procurement_work_orders_pkey primary key (id),
  constraint procurement_work_orders_number_unique unique (society_id, work_order_number),
  constraint procurement_work_orders_status_check check (
    status in ('DRAFT', 'ISSUED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
  )
);

alter table public.procurement_work_orders enable row level security;

create policy "procurement_work_orders_select" on public.procurement_work_orders
  for select using (user_has_society_access(society_id));

create policy "procurement_work_orders_insert" on public.procurement_work_orders
  for insert with check (user_has_society_access(society_id));

create policy "procurement_work_orders_update" on public.procurement_work_orders
  for update using (user_has_society_access(society_id));

create index procurement_work_orders_society_id_idx on public.procurement_work_orders (society_id);
create index procurement_work_orders_status_idx     on public.procurement_work_orders (society_id, status);

create trigger trg_procurement_work_orders_updated_at
  before update on public.procurement_work_orders
  for each row execute procedure public.set_updated_at();

-- ── contracts ─────────────────────────────────────────────────────────────────
create table public.contracts (
  id                uuid        not null default gen_random_uuid(),
  society_id        uuid        not null references public.societies (id) on delete cascade,
  contract_number   text        not null,
  title             text        not null,
  vendor_id         uuid                 references public.vendors (id),
  rfq_id            uuid                 references public.rfqs (id),
  value             numeric(12, 2),
  status            text        not null default 'DRAFT',
  start_date        date,
  end_date          date,
  auto_renew        boolean     not null default false,
  description       text,
  created_by        uuid                 references auth.users (id),
  metadata          jsonb       not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint contracts_pkey primary key (id),
  constraint contracts_number_unique unique (society_id, contract_number),
  constraint contracts_status_check check (
    status in ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED')
  )
);

alter table public.contracts enable row level security;

create policy "contracts_select" on public.contracts
  for select using (user_has_society_access(society_id));

create policy "contracts_insert" on public.contracts
  for insert with check (user_has_society_access(society_id));

create policy "contracts_update" on public.contracts
  for update using (user_has_society_access(society_id));

create index contracts_society_id_idx on public.contracts (society_id);
create index contracts_status_idx     on public.contracts (society_id, status);

create trigger trg_contracts_updated_at
  before update on public.contracts
  for each row execute procedure public.set_updated_at();

-- ── finance_dues ──────────────────────────────────────────────────────────────
create table public.finance_dues (
  id            uuid        not null default gen_random_uuid(),
  society_id    uuid        not null references public.societies (id) on delete cascade,
  member_id     uuid                 references public.members (id),
  unit_id       uuid                 references public.units (id),
  due_type      text        not null default 'MAINTENANCE',
  description   text,
  amount        numeric(12, 2) not null,
  due_date      date        not null,
  status        text        not null default 'UNPAID',
  period_from   date,
  period_to     date,
  created_by    uuid                 references auth.users (id),
  metadata      jsonb       not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint finance_dues_pkey primary key (id),
  constraint finance_dues_type_check check (
    due_type in ('MAINTENANCE', 'SPECIAL_LEVY', 'PARKING', 'WATER', 'SINKING_FUND', 'OTHER')
  ),
  constraint finance_dues_status_check check (
    status in ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'WAIVED')
  )
);

alter table public.finance_dues enable row level security;

create policy "finance_dues_select" on public.finance_dues
  for select using (user_has_society_access(society_id));

create policy "finance_dues_insert" on public.finance_dues
  for insert with check (user_has_society_access(society_id));

create policy "finance_dues_update" on public.finance_dues
  for update using (user_has_society_access(society_id));

create index finance_dues_society_id_idx on public.finance_dues (society_id);
create index finance_dues_status_idx     on public.finance_dues (society_id, status);

create trigger trg_finance_dues_updated_at
  before update on public.finance_dues
  for each row execute procedure public.set_updated_at();

-- ── finance_payments ──────────────────────────────────────────────────────────
create table public.finance_payments (
  id                uuid        not null default gen_random_uuid(),
  society_id        uuid        not null references public.societies (id) on delete cascade,
  due_id            uuid                 references public.finance_dues (id),
  payment_method    text        not null default 'BANK_TRANSFER',
  reference_number  text,
  amount_paid       numeric(12, 2) not null,
  payment_date      date        not null,
  notes             text,
  recorded_by       uuid                 references auth.users (id),
  metadata          jsonb       not null default '{}',
  created_at        timestamptz not null default now(),

  constraint finance_payments_pkey primary key (id),
  constraint finance_payments_method_check check (
    payment_method in ('CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'NEFT', 'RTGS', 'OTHER')
  )
);

alter table public.finance_payments enable row level security;

create policy "finance_payments_select" on public.finance_payments
  for select using (user_has_society_access(society_id));

create policy "finance_payments_insert" on public.finance_payments
  for insert with check (user_has_society_access(society_id));

create index finance_payments_society_id_idx on public.finance_payments (society_id);
create index finance_payments_due_id_idx     on public.finance_payments (due_id);
