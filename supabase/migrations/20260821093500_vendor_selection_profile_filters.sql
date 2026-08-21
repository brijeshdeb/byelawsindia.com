alter table public.vendors
  add column if not exists service_areas text[] not null default '{}',
  add column if not exists branch_availability text,
  add column if not exists is_preferred boolean not null default false;

create index if not exists vendors_selection_filter_idx
  on public.vendors(society_id,status,vendor_type,is_preferred);
create index if not exists vendors_service_areas_gin_idx
  on public.vendors using gin(service_areas);

comment on column public.vendors.service_areas is 'Locations, wings or service territories covered by the vendor.';
comment on column public.vendors.branch_availability is 'Vendor branch or local-team availability notes.';
comment on column public.vendors.is_preferred is 'Society-maintained preferred-vendor designation used during RFQ selection.';
