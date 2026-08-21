alter table public.society_documents
  add column if not exists document_number text,
  add column if not exists status text not null default 'UPLOADED',
  add column if not exists version integer not null default 1,
  add column if not exists expires_on date,
  add column if not exists wing_id uuid references public.wings(id) on delete set null,
  add column if not exists replaces_document_id uuid references public.society_documents(id) on delete set null,
  add column if not exists rejection_reason text,
  add column if not exists classification text not null default 'INTERNAL',
  add column if not exists checksum_sha256 text;

update public.society_documents set
  document_number=coalesce(nullif(metadata->>'document_number',''),'DOC-'||upper(replace(id::text,'-',''))),
  status=case when is_verified then 'VERIFIED' else 'UPLOADED' end
where document_number is null;
alter table public.society_documents alter column document_number set not null;
alter table public.society_documents drop constraint if exists society_documents_status_check;
alter table public.society_documents add constraint society_documents_status_check check(status in ('UPLOADED','VERIFIED','REJECTED','EXPIRED','ARCHIVED','REPLACED'));
alter table public.society_documents drop constraint if exists society_documents_classification_check;
alter table public.society_documents add constraint society_documents_classification_check check(classification in ('INTERNAL','MEMBERS','CONFIDENTIAL'));
alter table public.society_documents drop constraint if exists society_documents_version_check;
alter table public.society_documents add constraint society_documents_version_check check(version>0);
create unique index society_documents_number_version_idx on public.society_documents(society_id,document_number,version);
create index society_documents_expiry_idx on public.society_documents(society_id,expires_on) where expires_on is not null and status='VERIFIED';
create index society_documents_wing_id_idx on public.society_documents(wing_id);
create index society_documents_replaces_idx on public.society_documents(replaces_document_id);

create table public.document_access_logs(
  id uuid primary key default gen_random_uuid(),society_id uuid not null references public.societies(id) on delete cascade,
  document_id uuid not null references public.society_documents(id) on delete cascade,actor_user_id uuid not null references auth.users(id) on delete restrict,
  access_type text not null check(access_type in ('PREVIEW','DOWNLOAD')),accessed_at timestamptz not null default now(),metadata jsonb not null default '{}'::jsonb
);
create index document_access_logs_document_idx on public.document_access_logs(document_id,accessed_at desc);
create index document_access_logs_society_idx on public.document_access_logs(society_id,accessed_at desc);
create index document_access_logs_actor_idx on public.document_access_logs(actor_user_id,accessed_at desc);
alter table public.document_access_logs enable row level security;
create policy "document_access_logs_read" on public.document_access_logs for select to authenticated using(
  public.has_permission(society_id,'audit.read') or public.has_permission(society_id,'document.verify')
);
grant select on public.document_access_logs to authenticated;
grant all on public.document_access_logs to service_role;

drop policy if exists "society_documents_select" on public.society_documents;
drop policy if exists "society_documents_insert" on public.society_documents;
drop policy if exists "society_documents_update" on public.society_documents;
create policy "society_documents_read" on public.society_documents for select to authenticated using(
  public.has_permission(society_id,'document.read',wing_id) and public.can_access_wing(society_id,wing_id)
);
create policy "society_documents_create" on public.society_documents for insert to authenticated with check(
  public.has_permission(society_id,'document.upload',wing_id) and public.can_access_wing(society_id,wing_id)
);
create policy "society_documents_review" on public.society_documents for update to authenticated using(
  public.has_permission(society_id,'document.verify',wing_id) and public.can_access_wing(society_id,wing_id)
) with check(
  public.has_permission(society_id,'document.verify',wing_id) and public.can_access_wing(society_id,wing_id)
);
