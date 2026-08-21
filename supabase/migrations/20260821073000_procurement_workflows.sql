-- Vendor identity, documents, invitations, quotations, evaluation, selection,
-- performance and contract-renewal workflow.

insert into public.permissions(code,name,description,module) values
 ('vendor.portal','Vendor Portal Access','Access the vendor self-service portal','vendors'),
 ('quotation.create','Create Quotation','Create a draft quotation for an invited RFQ','procurement'),
 ('quotation.submit','Submit Quotation','Submit a quotation before the RFQ deadline','procurement'),
 ('vendor.performance.manage','Manage Vendor Performance','Record and approve vendor performance reviews','vendors'),
 ('contract.renewal.manage','Manage Contract Renewals','Initiate, assess and complete contract renewals','contracts')
on conflict(code) do nothing;

insert into public.roles(name,description,is_system_role) values
 ('Vendor','External vendor with access only to its invitations, quotations, work orders and contracts',true)
on conflict(name) do update set description=excluded.description,is_system_role=true;
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p where r.name='Vendor' and p.code in
 ('vendor.portal','rfq.read','quotation.read','quotation.create','quotation.submit','contract.read')
on conflict(role_id,permission_id) do nothing;
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p where r.name in ('Society Admin','Wing Admin') and p.code in
 ('vendor.performance.manage','contract.renewal.manage')
on conflict(role_id,permission_id) do nothing;
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p where r.name='Procurement Officer' and p.code in ('vendor.performance.manage','contract.renewal.manage')
on conflict(role_id,permission_id) do nothing;

create table public.vendor_users(
 id uuid primary key default gen_random_uuid(),society_id uuid not null references public.societies(id) on delete cascade,
 vendor_id uuid not null references public.vendors(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,
 is_primary boolean not null default false,is_active boolean not null default true,created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),constraint vendor_users_user_society_unique unique(user_id,society_id),constraint vendor_users_vendor_user_unique unique(vendor_id,user_id)
);
create index vendor_users_vendor_idx on public.vendor_users(vendor_id,is_active);create index vendor_users_society_idx on public.vendor_users(society_id,is_active);create index vendor_users_created_by_idx on public.vendor_users(created_by);

create or replace function public.is_vendor_user(p_society_id uuid) returns boolean language sql security definer stable set search_path=public as $$
 select exists(select 1 from public.vendor_users vu where vu.user_id=auth.uid() and vu.society_id=p_society_id and vu.is_active)
$$;
create or replace function public.can_access_vendor(p_society_id uuid,p_vendor_id uuid) returns boolean language sql security definer stable set search_path=public as $$
 select public.is_platform_admin() or exists(select 1 from public.vendor_users vu where vu.user_id=auth.uid() and vu.society_id=p_society_id and vu.vendor_id=p_vendor_id and vu.is_active)
$$;

create table public.vendor_documents(
 id uuid primary key default gen_random_uuid(),society_id uuid not null references public.societies(id) on delete cascade,vendor_id uuid not null references public.vendors(id) on delete cascade,
 document_type text not null,title text not null,document_number text,issued_on date,expires_on date,storage_path text,file_name text,mime_type text,file_size_bytes bigint,
 status text not null default 'UPLOADED',verified_by uuid references auth.users(id) on delete set null,verified_at timestamptz,rejection_reason text,version integer not null default 1,
 replaces_document_id uuid references public.vendor_documents(id) on delete set null,uploaded_by uuid references auth.users(id) on delete set null,created_at timestamptz not null default now(),metadata jsonb not null default '{}'::jsonb,
 constraint vendor_documents_status_check check(status in ('UPLOADED','VERIFIED','REJECTED','EXPIRED','REPLACED')),constraint vendor_documents_version_check check(version>0)
);
create index vendor_documents_vendor_idx on public.vendor_documents(vendor_id,status);create index vendor_documents_expiry_idx on public.vendor_documents(society_id,expires_on) where expires_on is not null and status='VERIFIED';create index vendor_documents_verified_by_idx on public.vendor_documents(verified_by);create index vendor_documents_uploaded_by_idx on public.vendor_documents(uploaded_by);create index vendor_documents_replaces_idx on public.vendor_documents(replaces_document_id);

create table public.rfq_invitations(
 id uuid primary key default gen_random_uuid(),society_id uuid not null references public.societies(id) on delete cascade,rfq_id uuid not null references public.rfqs(id) on delete cascade,vendor_id uuid not null references public.vendors(id) on delete cascade,
 status text not null default 'INVITED',invited_at timestamptz not null default now(),viewed_at timestamptz,responded_at timestamptz,decline_reason text,invited_by uuid references auth.users(id) on delete set null,
 reminder_count integer not null default 0,last_reminded_at timestamptz,metadata jsonb not null default '{}'::jsonb,
 constraint rfq_invitations_unique unique(rfq_id,vendor_id),constraint rfq_invitations_status_check check(status in ('INVITED','VIEWED','ACCEPTED','DECLINED','EXPIRED'))
);
create index rfq_invitations_vendor_idx on public.rfq_invitations(vendor_id,status,invited_at desc);create index rfq_invitations_society_idx on public.rfq_invitations(society_id,rfq_id);create index rfq_invitations_invited_by_idx on public.rfq_invitations(invited_by);

create table public.quotations(
 id uuid primary key default gen_random_uuid(),society_id uuid not null references public.societies(id) on delete cascade,rfq_id uuid not null references public.rfqs(id) on delete cascade,vendor_id uuid not null references public.vendors(id) on delete cascade,invitation_id uuid references public.rfq_invitations(id) on delete set null,
 quotation_number text not null,revision integer not null default 1,status text not null default 'DRAFT',currency text not null default 'INR',subtotal numeric(14,2) not null default 0,tax_amount numeric(14,2) not null default 0,total_amount numeric(14,2) not null default 0,
 validity_days integer,delivery_days integer,payment_terms text,warranty_terms text,terms text,submitted_at timestamptz,submitted_by uuid references auth.users(id) on delete set null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),metadata jsonb not null default '{}'::jsonb,
 constraint quotations_number_unique unique(society_id,quotation_number,revision),constraint quotations_vendor_revision_unique unique(rfq_id,vendor_id,revision),constraint quotations_status_check check(status in ('DRAFT','SUBMITTED','WITHDRAWN','UNDER_EVALUATION','SELECTED','REJECTED')),constraint quotations_amount_check check(subtotal>=0 and tax_amount>=0 and total_amount>=0),constraint quotations_revision_check check(revision>0)
);
create index quotations_rfq_idx on public.quotations(rfq_id,status,total_amount);create index quotations_vendor_idx on public.quotations(vendor_id,created_at desc);create index quotations_invitation_idx on public.quotations(invitation_id);create index quotations_submitted_by_idx on public.quotations(submitted_by);create trigger trg_quotations_updated_at before update on public.quotations for each row execute procedure public.set_updated_at();

create table public.quotation_items(
 id uuid primary key default gen_random_uuid(),quotation_id uuid not null references public.quotations(id) on delete cascade,line_number integer not null,description text not null,quantity numeric(12,3) not null default 1,unit text not null default 'LOT',unit_rate numeric(14,2) not null,line_total numeric(14,2) generated always as (quantity*unit_rate) stored,tax_rate numeric(5,2) not null default 0,notes text,
 constraint quotation_items_line_unique unique(quotation_id,line_number),constraint quotation_items_values_check check(quantity>0 and unit_rate>=0 and tax_rate>=0 and tax_rate<=100)
);create index quotation_items_quotation_idx on public.quotation_items(quotation_id,line_number);

create table public.quotation_evaluations(
 id uuid primary key default gen_random_uuid(),society_id uuid not null references public.societies(id) on delete cascade,quotation_id uuid not null references public.quotations(id) on delete cascade,
 evaluator_id uuid not null references auth.users(id) on delete restrict,technical_score numeric(5,2) not null,commercial_score numeric(5,2) not null,experience_score numeric(5,2) not null default 0,total_score numeric(6,2) not null,recommendation text,remarks text,evaluated_at timestamptz not null default now(),
 constraint quotation_evaluations_unique unique(quotation_id,evaluator_id),constraint quotation_scores_check check(technical_score between 0 and 100 and commercial_score between 0 and 100 and experience_score between 0 and 100 and total_score between 0 and 100)
);create index quotation_evaluations_society_idx on public.quotation_evaluations(society_id,evaluated_at desc);create index quotation_evaluations_evaluator_idx on public.quotation_evaluations(evaluator_id);

create table public.vendor_selections(
 id uuid primary key default gen_random_uuid(),society_id uuid not null references public.societies(id) on delete cascade,rfq_id uuid not null references public.rfqs(id) on delete cascade,quotation_id uuid not null references public.quotations(id) on delete restrict,vendor_id uuid not null references public.vendors(id) on delete restrict,
 status text not null default 'RECOMMENDED',justification text not null,recommended_by uuid references auth.users(id) on delete set null,recommended_at timestamptz not null default now(),decided_by uuid references auth.users(id) on delete set null,decided_at timestamptz,decision_comments text,
 constraint vendor_selections_status_check check(status in ('RECOMMENDED','APPROVED','REJECTED','CANCELLED'))
);create index vendor_selections_society_idx on public.vendor_selections(society_id,status);create index vendor_selections_quotation_idx on public.vendor_selections(quotation_id);create index vendor_selections_vendor_idx on public.vendor_selections(vendor_id);create index vendor_selections_recommended_by_idx on public.vendor_selections(recommended_by);create index vendor_selections_decided_by_idx on public.vendor_selections(decided_by);
create unique index vendor_selections_one_active_idx on public.vendor_selections(rfq_id) where status in ('RECOMMENDED','APPROVED');

create table public.vendor_performance_reviews(
 id uuid primary key default gen_random_uuid(),society_id uuid not null references public.societies(id) on delete cascade,vendor_id uuid not null references public.vendors(id) on delete cascade,contract_id uuid references public.contracts(id) on delete set null,work_order_id uuid references public.procurement_work_orders(id) on delete set null,
 quality_score numeric(3,2) not null,timeliness_score numeric(3,2) not null,safety_score numeric(3,2) not null,communication_score numeric(3,2) not null,value_score numeric(3,2) not null,overall_score numeric(3,2) not null,comments text,reviewed_by uuid references auth.users(id) on delete set null,reviewed_at timestamptz not null default now(),
 constraint performance_scores_check check(quality_score between 0 and 5 and timeliness_score between 0 and 5 and safety_score between 0 and 5 and communication_score between 0 and 5 and value_score between 0 and 5 and overall_score between 0 and 5)
);create index performance_vendor_idx on public.vendor_performance_reviews(vendor_id,reviewed_at desc);create index performance_contract_idx on public.vendor_performance_reviews(contract_id);create index performance_work_order_idx on public.vendor_performance_reviews(work_order_id);create index performance_reviewed_by_idx on public.vendor_performance_reviews(reviewed_by);

create table public.contract_renewals(
 id uuid primary key default gen_random_uuid(),society_id uuid not null references public.societies(id) on delete cascade,contract_id uuid not null references public.contracts(id) on delete cascade,vendor_id uuid not null references public.vendors(id) on delete restrict,renewal_number text not null,status text not null default 'DUE',current_end_date date not null,proposed_start_date date,proposed_end_date date,proposed_value numeric(14,2),vendor_comments text,society_comments text,response_due_at timestamptz,intimation_sent_at timestamptz,submitted_at timestamptz,decided_at timestamptz,created_by uuid references auth.users(id) on delete set null,decided_by uuid references auth.users(id) on delete set null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 constraint contract_renewals_number_unique unique(society_id,renewal_number),constraint contract_renewals_status_check check(status in ('DUE','INTIMATION_SENT','VENDOR_QUOTED','UNDER_REVIEW','APPROVED','REJECTED','COMPLETED','CANCELLED'))
);create index contract_renewals_contract_idx on public.contract_renewals(contract_id,created_at desc);create index contract_renewals_vendor_idx on public.contract_renewals(vendor_id,status);create index contract_renewals_society_idx on public.contract_renewals(society_id,status,response_due_at);create index contract_renewals_created_by_idx on public.contract_renewals(created_by);create index contract_renewals_decided_by_idx on public.contract_renewals(decided_by);create trigger trg_contract_renewals_updated_at before update on public.contract_renewals for each row execute procedure public.set_updated_at();

alter table public.vendor_users enable row level security;alter table public.vendor_documents enable row level security;alter table public.rfq_invitations enable row level security;alter table public.quotations enable row level security;alter table public.quotation_items enable row level security;alter table public.quotation_evaluations enable row level security;alter table public.vendor_selections enable row level security;alter table public.vendor_performance_reviews enable row level security;alter table public.contract_renewals enable row level security;

create policy "vendor_users_own_or_admin" on public.vendor_users for select to authenticated using(user_id=(select auth.uid()) or (select public.has_permission(society_id,'admin.users')));
create policy "vendor_documents_read" on public.vendor_documents for select to authenticated using((select public.can_access_vendor(society_id,vendor_id)) or ((select public.can_access_society(society_id)) and not (select public.is_vendor_user(society_id))));
create policy "vendor_documents_vendor_insert" on public.vendor_documents for insert to authenticated with check((select public.can_access_vendor(society_id,vendor_id)) or (select public.has_permission(society_id,'vendor.update')));
create policy "vendor_documents_staff_update" on public.vendor_documents for update to authenticated using((select public.has_permission(society_id,'vendor.verify'))) with check((select public.has_permission(society_id,'vendor.verify')));
create policy "rfq_invitations_read" on public.rfq_invitations for select to authenticated using((select public.can_access_vendor(society_id,vendor_id)) or ((select public.can_access_society(society_id)) and not (select public.is_vendor_user(society_id))));
create policy "rfq_invitations_staff_manage" on public.rfq_invitations for all to authenticated using((select public.has_permission(society_id,'rfq.publish'))) with check((select public.has_permission(society_id,'rfq.publish')));
create policy "rfq_invitations_vendor_update" on public.rfq_invitations for update to authenticated using((select public.can_access_vendor(society_id,vendor_id))) with check((select public.can_access_vendor(society_id,vendor_id)));
create policy "quotations_read" on public.quotations for select to authenticated using((select public.can_access_vendor(society_id,vendor_id)) or ((select public.can_access_society(society_id)) and not (select public.is_vendor_user(society_id))));
create policy "quotations_vendor_insert" on public.quotations for insert to authenticated with check((select public.can_access_vendor(society_id,vendor_id)) and (select public.has_permission(society_id,'quotation.create')));
create policy "quotations_vendor_update" on public.quotations for update to authenticated using((select public.can_access_vendor(society_id,vendor_id))) with check((select public.can_access_vendor(society_id,vendor_id)));
create policy "quotation_items_read" on public.quotation_items for select to authenticated using(exists(select 1 from public.quotations q where q.id=quotation_id and ((select public.can_access_vendor(q.society_id,q.vendor_id)) or ((select public.can_access_society(q.society_id)) and not (select public.is_vendor_user(q.society_id))))));
create policy "quotation_items_vendor_manage" on public.quotation_items for all to authenticated using(exists(select 1 from public.quotations q where q.id=quotation_id and q.status='DRAFT' and (select public.can_access_vendor(q.society_id,q.vendor_id)))) with check(exists(select 1 from public.quotations q where q.id=quotation_id and q.status='DRAFT' and (select public.can_access_vendor(q.society_id,q.vendor_id))));
create policy "quotation_evaluations_read" on public.quotation_evaluations for select to authenticated using((select public.has_permission(society_id,'quotation.read')) and not (select public.is_vendor_user(society_id)));
create policy "quotation_evaluations_manage" on public.quotation_evaluations for all to authenticated using((select public.has_permission(society_id,'quotation.evaluate'))) with check((select public.has_permission(society_id,'quotation.evaluate')));
create policy "vendor_selections_read" on public.vendor_selections for select to authenticated using((select public.can_access_society(society_id)) and not (select public.is_vendor_user(society_id)));
create policy "vendor_selections_manage" on public.vendor_selections for all to authenticated using((select public.has_permission(society_id,'vendor_selection.recommend')) or (select public.has_permission(society_id,'vendor_selection.approve'))) with check((select public.has_permission(society_id,'vendor_selection.recommend')) or (select public.has_permission(society_id,'vendor_selection.approve')));
create policy "performance_read" on public.vendor_performance_reviews for select to authenticated using((select public.can_access_vendor(society_id,vendor_id)) or ((select public.can_access_society(society_id)) and not (select public.is_vendor_user(society_id))));
create policy "performance_manage" on public.vendor_performance_reviews for all to authenticated using((select public.has_permission(society_id,'vendor.performance.manage'))) with check((select public.has_permission(society_id,'vendor.performance.manage')));
create policy "renewals_read" on public.contract_renewals for select to authenticated using((select public.can_access_vendor(society_id,vendor_id)) or ((select public.can_access_society(society_id)) and not (select public.is_vendor_user(society_id))));
create policy "renewals_staff_manage" on public.contract_renewals for all to authenticated using((select public.has_permission(society_id,'contract.renewal.manage'))) with check((select public.has_permission(society_id,'contract.renewal.manage')));
create policy "renewals_vendor_update" on public.contract_renewals for update to authenticated using((select public.can_access_vendor(society_id,vendor_id))) with check((select public.can_access_vendor(society_id,vendor_id)));

-- Restrictive policies prevent a vendor's required society assignment from exposing internal tenant data.
create policy "vendors_vendor_scope" on public.vendors as restrictive for select to authenticated using(not (select public.is_vendor_user(society_id)) or (select public.can_access_vendor(society_id,id)));
create policy "rfqs_vendor_scope" on public.rfqs as restrictive for select to authenticated using(not (select public.is_vendor_user(society_id)) or exists(select 1 from public.rfq_invitations i where i.rfq_id=id and (select public.can_access_vendor(society_id,i.vendor_id))));
create policy "contracts_vendor_scope" on public.contracts as restrictive for select to authenticated using(not (select public.is_vendor_user(society_id)) or (vendor_id is not null and (select public.can_access_vendor(society_id,vendor_id))));
create policy "procurement_work_orders_vendor_scope" on public.procurement_work_orders as restrictive for select to authenticated using(not (select public.is_vendor_user(society_id)) or (vendor_id is not null and (select public.can_access_vendor(society_id,vendor_id))));
create policy "vendors_vendor_update_scope" on public.vendors as restrictive for update to authenticated using(not (select public.is_vendor_user(society_id)) or (select public.can_access_vendor(society_id,id))) with check(not (select public.is_vendor_user(society_id)) or (select public.can_access_vendor(society_id,id)));
create policy "rfqs_vendor_no_insert" on public.rfqs as restrictive for insert to authenticated with check(not (select public.is_vendor_user(society_id)));
create policy "rfqs_vendor_no_update" on public.rfqs as restrictive for update to authenticated using(not (select public.is_vendor_user(society_id))) with check(not (select public.is_vendor_user(society_id)));
create policy "contracts_vendor_no_insert" on public.contracts as restrictive for insert to authenticated with check(not (select public.is_vendor_user(society_id)));
create policy "contracts_vendor_no_update" on public.contracts as restrictive for update to authenticated using(not (select public.is_vendor_user(society_id))) with check(not (select public.is_vendor_user(society_id)));
create policy "procurement_work_orders_vendor_no_insert" on public.procurement_work_orders as restrictive for insert to authenticated with check(not (select public.is_vendor_user(society_id)));
create policy "procurement_work_orders_vendor_no_update" on public.procurement_work_orders as restrictive for update to authenticated using(not (select public.is_vendor_user(society_id))) with check(not (select public.is_vendor_user(society_id)));

do $$ declare v_table text; begin
  foreach v_table in array array[
    'wings','units','audit_logs','members','society_documents','member_applications',
    'maintenance_complaints','maintenance_work_orders','finance_dues','finance_payments','finance_refunds',
    'form_register_snapshots','master_data_items','content_templates','generated_documents','service_requests',
    'approval_instances','nominations','associate_memberships','application_checklist_items','application_status_history'
  ] loop
    execute format('create policy %I on public.%I as restrictive for all to authenticated using (not (select public.is_vendor_user(society_id))) with check (not (select public.is_vendor_user(society_id)))','vendor_internal_block_'||v_table,v_table);
  end loop;
end $$;

grant select on public.vendor_users to authenticated;grant select,insert,update on public.vendor_documents to authenticated;grant select,insert,update on public.rfq_invitations to authenticated;grant select,insert,update on public.quotations to authenticated;grant select,insert,update,delete on public.quotation_items to authenticated;grant select,insert,update,delete on public.quotation_evaluations to authenticated;grant select,insert,update,delete on public.vendor_selections to authenticated;grant select,insert,update,delete on public.vendor_performance_reviews to authenticated;grant select,insert,update on public.contract_renewals to authenticated;
grant all on public.vendor_users,public.vendor_documents,public.rfq_invitations,public.quotations,public.quotation_items,public.quotation_evaluations,public.vendor_selections,public.vendor_performance_reviews,public.contract_renewals to service_role;
revoke all on function public.is_vendor_user(uuid) from public,anon;revoke all on function public.can_access_vendor(uuid,uuid) from public,anon;grant execute on function public.is_vendor_user(uuid) to authenticated;grant execute on function public.can_access_vendor(uuid,uuid) to authenticated;
