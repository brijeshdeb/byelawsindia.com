-- Release foundations: configurable reference data, versioned content templates,
-- generated document snapshots, service requests, notifications and reusable
-- approval workflows. Client-specific wording is data, never application code.

create table public.master_data_items (
  id uuid primary key default gen_random_uuid(),
  society_id uuid references public.societies(id) on delete cascade,
  category text not null,
  code text not null,
  label text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint master_data_category_check check (category ~ '^[A-Z][A-Z0-9_]{1,63}$'),
  constraint master_data_code_check check (code ~ '^[A-Z0-9][A-Z0-9_-]{0,63}$')
);

create unique index master_data_global_key_uidx
  on public.master_data_items(category, code) where society_id is null;
create unique index master_data_society_key_uidx
  on public.master_data_items(society_id, category, code) where society_id is not null;
create index master_data_society_category_idx
  on public.master_data_items(society_id, category, is_active, sort_order);

create table public.content_templates (
  id uuid primary key default gen_random_uuid(),
  society_id uuid references public.societies(id) on delete cascade,
  template_key text not null,
  name text not null,
  category text not null,
  version integer not null default 1,
  status text not null default 'DRAFT',
  subject_template text,
  body_template text not null,
  variables jsonb not null default '[]'::jsonb,
  output_format text not null default 'HTML',
  is_default boolean not null default false,
  effective_from timestamptz,
  effective_until timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_templates_key_check check (template_key ~ '^[A-Z][A-Z0-9_]{2,79}$'),
  constraint content_templates_version_check check (version > 0),
  constraint content_templates_status_check check (status in ('DRAFT','ACTIVE','ARCHIVED')),
  constraint content_templates_output_check check (output_format in ('HTML','TEXT','PDF','DOCX','EMAIL')),
  constraint content_templates_effective_check check (effective_until is null or effective_from is null or effective_until > effective_from),
  constraint content_templates_scope_version_unique unique nulls not distinct (society_id, template_key, version)
);

create index content_templates_lookup_idx
  on public.content_templates(society_id, template_key, status, version desc);
create unique index content_templates_one_default_idx
  on public.content_templates(society_id, template_key)
  nulls not distinct where is_default and status = 'ACTIVE';

create table public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  template_id uuid references public.content_templates(id) on delete set null,
  document_number text not null,
  title text not null,
  entity_type text,
  entity_id uuid,
  subject_rendered text,
  body_rendered text not null,
  input_data jsonb not null default '{}'::jsonb,
  output_format text not null default 'HTML',
  storage_path text,
  checksum_sha256 text,
  status text not null default 'GENERATED',
  generated_by uuid references auth.users(id) on delete set null,
  generated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint generated_documents_number_unique unique (society_id, document_number),
  constraint generated_documents_status_check check (status in ('GENERATED','ISSUED','VOID')),
  constraint generated_documents_output_check check (output_format in ('HTML','TEXT','PDF','DOCX','EMAIL'))
);

create index generated_documents_society_date_idx
  on public.generated_documents(society_id, generated_at desc);
create index generated_documents_entity_idx
  on public.generated_documents(society_id, entity_type, entity_id);
create index generated_documents_template_id_idx on public.generated_documents(template_id);

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  request_number text not null,
  request_type text not null,
  title text not null,
  description text,
  member_id uuid references public.members(id) on delete set null,
  unit_id uuid references public.units(id) on delete set null,
  wing_id uuid references public.wings(id) on delete set null,
  priority text not null default 'NORMAL',
  status text not null default 'SUBMITTED',
  assigned_to uuid references auth.users(id) on delete set null,
  due_at timestamptz,
  completed_at timestamptz,
  resolution text,
  form_data jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_requests_number_unique unique (society_id, request_number),
  constraint service_requests_priority_check check (priority in ('LOW','NORMAL','HIGH','URGENT')),
  constraint service_requests_status_check check (status in ('DRAFT','SUBMITTED','UNDER_REVIEW','APPROVED','IN_PROGRESS','COMPLETED','REJECTED','CANCELLED'))
);

create index service_requests_society_status_idx
  on public.service_requests(society_id, status, created_at desc);
create index service_requests_member_id_idx on public.service_requests(member_id);
create index service_requests_unit_id_idx on public.service_requests(unit_id);
create index service_requests_wing_id_idx on public.service_requests(wing_id);
create index service_requests_assigned_to_idx on public.service_requests(assigned_to);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  society_id uuid references public.societies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null,
  title text not null,
  message text not null,
  entity_type text,
  entity_id uuid,
  action_url text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index notifications_user_unread_idx
  on public.notifications(user_id, created_at desc) where read_at is null;
create index notifications_society_idx on public.notifications(society_id, created_at desc);

create table public.approval_workflows (
  id uuid primary key default gen_random_uuid(),
  society_id uuid references public.societies(id) on delete cascade,
  workflow_key text not null,
  name text not null,
  entity_type text not null,
  description text,
  version integer not null default 1,
  is_active boolean not null default true,
  conditions jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint approval_workflows_key_check check (workflow_key ~ '^[A-Z][A-Z0-9_]{2,79}$'),
  constraint approval_workflows_version_check check (version > 0),
  constraint approval_workflows_scope_version_unique unique nulls not distinct (society_id, workflow_key, version)
);

create index approval_workflows_lookup_idx
  on public.approval_workflows(society_id, entity_type, is_active);

create table public.approval_workflow_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.approval_workflows(id) on delete cascade,
  step_order integer not null,
  name text not null,
  permission_code text not null references public.permissions(code) on update cascade,
  min_approvals integer not null default 1,
  rejection_ends_workflow boolean not null default true,
  sla_hours integer,
  conditions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint approval_steps_order_check check (step_order > 0),
  constraint approval_steps_min_check check (min_approvals > 0),
  constraint approval_steps_sla_check check (sla_hours is null or sla_hours > 0),
  constraint approval_steps_order_unique unique (workflow_id, step_order)
);

create index approval_workflow_steps_workflow_id_idx
  on public.approval_workflow_steps(workflow_id, step_order);

create table public.approval_instances (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  workflow_id uuid not null references public.approval_workflows(id) on delete restrict,
  entity_type text not null,
  entity_id uuid not null,
  status text not null default 'PENDING',
  current_step_order integer not null default 1,
  submitted_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz not null default now(),
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  constraint approval_instances_status_check check (status in ('PENDING','APPROVED','REJECTED','CANCELLED')),
  constraint approval_instances_step_check check (current_step_order > 0),
  constraint approval_instances_entity_unique unique (workflow_id, entity_type, entity_id)
);

create index approval_instances_society_status_idx
  on public.approval_instances(society_id, status, submitted_at desc);
create index approval_instances_workflow_id_idx on public.approval_instances(workflow_id);

create table public.approval_decisions (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid not null references public.approval_instances(id) on delete cascade,
  workflow_step_id uuid not null references public.approval_workflow_steps(id) on delete restrict,
  decision text not null,
  comments text,
  decided_by uuid not null references auth.users(id) on delete restrict,
  decided_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint approval_decisions_decision_check check (decision in ('APPROVED','REJECTED','RETURNED')),
  constraint approval_decisions_actor_unique unique (instance_id, workflow_step_id, decided_by)
);

create index approval_decisions_instance_id_idx on public.approval_decisions(instance_id, decided_at);
create index approval_decisions_workflow_step_id_idx on public.approval_decisions(workflow_step_id);
create index approval_decisions_decided_by_idx on public.approval_decisions(decided_by);

create trigger trg_master_data_updated_at before update on public.master_data_items
  for each row execute procedure public.set_updated_at();
create trigger trg_content_templates_updated_at before update on public.content_templates
  for each row execute procedure public.set_updated_at();
create trigger trg_service_requests_updated_at before update on public.service_requests
  for each row execute procedure public.set_updated_at();
create trigger trg_approval_workflows_updated_at before update on public.approval_workflows
  for each row execute procedure public.set_updated_at();

alter table public.master_data_items enable row level security;
alter table public.content_templates enable row level security;
alter table public.generated_documents enable row level security;
alter table public.service_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.approval_workflows enable row level security;
alter table public.approval_workflow_steps enable row level security;
alter table public.approval_instances enable row level security;
alter table public.approval_decisions enable row level security;

create policy "master_data_select" on public.master_data_items for select to authenticated
  using (society_id is null or (select public.can_access_society(society_id)));
create policy "master_data_manage" on public.master_data_items for all to authenticated
  using ((select public.is_platform_admin()) or (society_id is not null and (select public.has_permission(society_id, 'admin.master_data'))))
  with check ((select public.is_platform_admin()) or (society_id is not null and (select public.has_permission(society_id, 'admin.master_data'))));

create policy "content_templates_select" on public.content_templates for select to authenticated
  using (society_id is null or (select public.can_access_society(society_id)));
create policy "content_templates_manage" on public.content_templates for all to authenticated
  using ((select public.is_platform_admin()) or (society_id is not null and (select public.has_permission(society_id, 'admin.templates'))))
  with check ((select public.is_platform_admin()) or (society_id is not null and (select public.has_permission(society_id, 'admin.templates'))));

create policy "generated_documents_select" on public.generated_documents for select to authenticated
  using ((select public.can_access_society(society_id)));
create policy "generated_documents_insert" on public.generated_documents for insert to authenticated
  with check ((select public.can_access_society(society_id)));
create policy "generated_documents_update" on public.generated_documents for update to authenticated
  using ((select public.has_permission(society_id, 'admin.templates')))
  with check ((select public.has_permission(society_id, 'admin.templates')));

create policy "service_requests_select" on public.service_requests for select to authenticated
  using ((select public.has_permission(society_id, 'service_request.read')));
create policy "service_requests_insert" on public.service_requests for insert to authenticated
  with check ((select public.has_permission(society_id, 'service_request.create')));
create policy "service_requests_update" on public.service_requests for update to authenticated
  using ((select public.has_permission(society_id, 'service_request.process')) or (select public.has_permission(society_id, 'service_request.approve')))
  with check ((select public.has_permission(society_id, 'service_request.process')) or (select public.has_permission(society_id, 'service_request.approve')));

create policy "notifications_select_own" on public.notifications for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "notifications_update_own" on public.notifications for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "approval_workflows_select" on public.approval_workflows for select to authenticated
  using (society_id is null or (select public.can_access_society(society_id)));
create policy "approval_workflows_manage" on public.approval_workflows for all to authenticated
  using ((select public.is_platform_admin()) or (society_id is not null and (select public.has_permission(society_id, 'admin.templates'))))
  with check ((select public.is_platform_admin()) or (society_id is not null and (select public.has_permission(society_id, 'admin.templates'))));
create policy "approval_steps_select" on public.approval_workflow_steps for select to authenticated
  using (exists (select 1 from public.approval_workflows w where w.id = workflow_id and (w.society_id is null or (select public.can_access_society(w.society_id)))));
create policy "approval_steps_manage" on public.approval_workflow_steps for all to authenticated
  using (exists (select 1 from public.approval_workflows w where w.id = workflow_id and ((select public.is_platform_admin()) or (w.society_id is not null and (select public.has_permission(w.society_id, 'admin.templates'))))))
  with check (exists (select 1 from public.approval_workflows w where w.id = workflow_id and ((select public.is_platform_admin()) or (w.society_id is not null and (select public.has_permission(w.society_id, 'admin.templates'))))));
create policy "approval_instances_select" on public.approval_instances for select to authenticated
  using ((select public.can_access_society(society_id)));
create policy "approval_instances_insert" on public.approval_instances for insert to authenticated
  with check ((select public.can_access_society(society_id)));
create policy "approval_instances_update" on public.approval_instances for update to authenticated
  using ((select public.can_access_society(society_id))) with check ((select public.can_access_society(society_id)));
create policy "approval_decisions_select" on public.approval_decisions for select to authenticated
  using (exists (select 1 from public.approval_instances i where i.id = instance_id and (select public.can_access_society(i.society_id))));
create policy "approval_decisions_insert" on public.approval_decisions for insert to authenticated
  with check ((select auth.uid()) = decided_by and exists (
    select 1 from public.approval_instances i
    join public.approval_workflow_steps s on s.workflow_id = i.workflow_id
    where i.id = instance_id and s.id = workflow_step_id and s.step_order = i.current_step_order
      and (select public.has_permission(i.society_id, s.permission_code))
  ));

grant select, insert, update, delete on public.master_data_items to authenticated;
grant select, insert, update, delete on public.content_templates to authenticated;
grant select, insert, update on public.generated_documents to authenticated;
grant select, insert, update on public.service_requests to authenticated;
grant select, update on public.notifications to authenticated;
grant select, insert, update, delete on public.approval_workflows to authenticated;
grant select, insert, update, delete on public.approval_workflow_steps to authenticated;
grant select, insert, update on public.approval_instances to authenticated;
grant select, insert on public.approval_decisions to authenticated;

grant all on public.master_data_items, public.content_templates, public.generated_documents,
  public.service_requests, public.notifications, public.approval_workflows,
  public.approval_workflow_steps, public.approval_instances, public.approval_decisions to service_role;

insert into public.master_data_items(category, code, label, sort_order) values
  ('SERVICE_REQUEST_TYPE','PASSPORT_LETTER','Passport address confirmation letter',10),
  ('SERVICE_REQUEST_TYPE','DOMICILE_LETTER','Domicile address confirmation letter',20),
  ('SERVICE_REQUEST_TYPE','ELECTRIC_METER_CHANGE','Electric meter name change',30),
  ('SERVICE_REQUEST_TYPE','SALE_NOC','Sale / transfer NOC',40),
  ('SERVICE_REQUEST_TYPE','SUBLETTING_NOC','Subletting / leave and licence NOC',50),
  ('SERVICE_REQUEST_TYPE','BANK_LOAN_NOC','Bank loan / mortgage NOC',60),
  ('SERVICE_REQUEST_TYPE','DOMESTIC_HELP','Domestic help registration',70),
  ('SERVICE_REQUEST_TYPE','NOMINATION','Nomination request',80),
  ('SERVICE_REQUEST_TYPE','ASSOCIATE_MEMBER','Associate membership request',90),
  ('PRIORITY','LOW','Low',10), ('PRIORITY','NORMAL','Normal',20),
  ('PRIORITY','HIGH','High',30), ('PRIORITY','URGENT','Urgent',40);

insert into public.content_templates(
  template_key, name, category, status, subject_template, body_template,
  variables, output_format, is_default, metadata
) values
  ('PASSPORT_LETTER','Passport Address Confirmation','LETTER','ACTIVE','Address confirmation for {{member_name}}','To whom it may concern,\n\nThis is to certify that {{member_name}} resides at {{unit_address}} in {{society_name}}. This draft may be replaced with the society-approved wording.\n\nFor {{society_name}}\nAuthorized Signatory','["member_name","unit_address","society_name"]','DOCX',true,'{"draft":true,"client_format_pending":true}'),
  ('DOMICILE_LETTER','Domicile Address Confirmation','LETTER','ACTIVE','Residence confirmation for {{member_name}}','To whom it may concern,\n\nThis is to confirm that {{member_name}} is recorded as residing at {{unit_address}}, {{society_name}}. This draft may be replaced with approved wording.\n\nAuthorized Signatory','["member_name","unit_address","society_name"]','DOCX',true,'{"draft":true,"client_format_pending":true}'),
  ('ELECTRIC_METER_CHANGE','Electric Meter Name Change','LETTER','ACTIVE','No objection for meter name change - {{unit_number}}','To,\nThe Electricity Distribution Company\n\n{{society_name}} has no objection to processing the meter name change for {{unit_number}} in favour of {{member_name}}, subject to statutory verification.\n\nAuthorized Signatory','["society_name","unit_number","member_name"]','DOCX',true,'{"draft":true,"client_format_pending":true}'),
  ('SALE_NOC','Sale / Transfer NOC','LETTER','ACTIVE','NOC for proposed transfer of {{unit_number}}','This is a provisional society NOC framework for the proposed transfer of {{unit_number}} by {{member_name}}. Conditions, dues confirmation and final approved wording will be inserted before issue.\n\nAuthorized Signatory','["unit_number","member_name","society_name"]','DOCX',true,'{"draft":true,"client_format_pending":true}'),
  ('SUBLETTING_NOC','Subletting NOC','LETTER','ACTIVE','NOC for leave and licence - {{unit_number}}','{{society_name}} records the request by {{member_name}} to grant leave and licence for {{unit_number}}. This provisional format is subject to document verification and society approval.\n\nAuthorized Signatory','["society_name","member_name","unit_number"]','DOCX',true,'{"draft":true,"client_format_pending":true}'),
  ('BANK_LOAN_NOC','Bank Loan / Mortgage NOC','LETTER','ACTIVE','NOC for loan against {{unit_number}}','To,\n{{bank_name}}\n\n{{society_name}} has no objection in principle to {{member_name}} obtaining finance against {{unit_number}}, subject to the society records and approved conditions.\n\nAuthorized Signatory','["bank_name","society_name","member_name","unit_number"]','DOCX',true,'{"draft":true,"client_format_pending":true}'),
  ('DOMESTIC_HELP_ACK','Domestic Help Registration Acknowledgement','LETTER','ACTIVE','Domestic help registration - {{unit_number}}','The domestic help details submitted by {{member_name}} for {{unit_number}} have been recorded, subject to identity and police-verification requirements.','["member_name","unit_number"]','DOCX',true,'{"draft":true,"client_format_pending":true}'),
  ('NOMINATION_ACK','Nomination Request Acknowledgement','LETTER','ACTIVE','Nomination request acknowledgement - {{unit_number}}','The nomination request submitted by {{member_name}} for {{unit_number}} has been received for scrutiny and committee approval.','["member_name","unit_number"]','DOCX',true,'{"draft":true,"client_format_pending":true}'),
  ('ASSOCIATE_MEMBER_ACK','Associate Membership Acknowledgement','LETTER','ACTIVE','Associate membership request - {{unit_number}}','The associate membership request for {{associate_name}} in respect of {{unit_number}} has been received for document verification and approval.','["associate_name","unit_number"]','DOCX',true,'{"draft":true,"client_format_pending":true}'),
  ('REQUEST_RECEIVED_EMAIL','Service Request Received','EMAIL','ACTIVE','Request {{request_number}} received','Hello {{member_name}},\n\nYour request {{request_number}} has been received and is currently {{status}}.\n\n{{society_name}}','["member_name","request_number","status","society_name"]','EMAIL',true,'{"draft":true}'),
  ('REQUEST_STATUS_EMAIL','Service Request Status Update','EMAIL','ACTIVE','Update for request {{request_number}}','Hello {{member_name}},\n\nThe status of request {{request_number}} is now {{status}}. {{remarks}}\n\n{{society_name}}','["member_name","request_number","status","remarks","society_name"]','EMAIL',true,'{"draft":true}');

insert into public.approval_workflows(workflow_key, name, entity_type, description, version, is_active)
values ('DEFAULT_SERVICE_REQUEST','Default Service Request Approval','SERVICE_REQUEST','Configurable two-stage review and approval for society service requests.',1,true);

insert into public.approval_workflow_steps(workflow_id, step_order, name, permission_code, min_approvals, sla_hours)
select id, 1, 'Administrative review', 'service_request.process', 1, 48
from public.approval_workflows where workflow_key = 'DEFAULT_SERVICE_REQUEST' and society_id is null;
insert into public.approval_workflow_steps(workflow_id, step_order, name, permission_code, min_approvals, sla_hours)
select id, 2, 'Final approval', 'service_request.approve', 1, 48
from public.approval_workflows where workflow_key = 'DEFAULT_SERVICE_REQUEST' and society_id is null;
