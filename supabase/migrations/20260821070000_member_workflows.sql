-- Statutory member workflow: configurable checklists, status history,
-- three-stage approvals, nominations and associate membership.

alter table public.member_applications drop constraint if exists member_applications_type_check;
alter table public.member_applications add constraint member_applications_type_check check (
  application_type in ('MEMBERSHIP','NOC_SALE','NOC_RENOVATION','PARKING','NOMINATION','ASSOCIATE_MEMBERSHIP','OTHER')
);
alter table public.member_applications drop constraint if exists member_applications_status_check;
alter table public.member_applications add constraint member_applications_status_check check (
  status in ('DRAFT','SUBMITTED','UNDER_REVIEW','CORRECTION_REQUIRED','RESUBMITTED','LEVEL1_APPROVED','LEVEL2_APPROVED','APPROVED','REJECTED','WITHDRAWN')
);

create table public.application_checklist_items (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  application_id uuid not null references public.member_applications(id) on delete cascade,
  item_code text not null,
  label text not null,
  is_required boolean not null default true,
  status text not null default 'PENDING',
  document_id uuid references public.society_documents(id) on delete set null,
  remarks text,
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint application_checklist_status_check check(status in ('PENDING','UPLOADED','VERIFIED','REJECTED','NOT_APPLICABLE')),
  constraint application_checklist_unique unique(application_id,item_code)
);

create index application_checklist_society_idx on public.application_checklist_items(society_id,application_id,sort_order);
create index application_checklist_document_idx on public.application_checklist_items(document_id);
create index application_checklist_verified_by_idx on public.application_checklist_items(verified_by);
create trigger trg_application_checklist_updated_at before update on public.application_checklist_items for each row execute procedure public.set_updated_at();

create table public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  application_id uuid not null references public.member_applications(id) on delete cascade,
  from_status text,
  to_status text not null,
  comments text,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index application_status_history_application_idx on public.application_status_history(application_id,changed_at);
create index application_status_history_society_idx on public.application_status_history(society_id,changed_at desc);
create index application_status_history_changed_by_idx on public.application_status_history(changed_by);

create table public.nominations (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  nomination_number text not null,
  status text not null default 'SUBMITTED',
  effective_from date,
  revoked_at timestamptz,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nominations_number_unique unique(society_id,nomination_number),
  constraint nominations_status_check check(status in ('DRAFT','SUBMITTED','UNDER_REVIEW','CORRECTION_REQUIRED','APPROVED','REJECTED','REVOKED'))
);
create index nominations_society_status_idx on public.nominations(society_id,status,created_at desc);
create index nominations_member_id_idx on public.nominations(member_id);
create index nominations_unit_id_idx on public.nominations(unit_id);
create index nominations_created_by_idx on public.nominations(created_by);
create trigger trg_nominations_updated_at before update on public.nominations for each row execute procedure public.set_updated_at();

create table public.nominees (
  id uuid primary key default gen_random_uuid(),
  nomination_id uuid not null references public.nominations(id) on delete cascade,
  full_name text not null,
  relationship text,
  date_of_birth date,
  address text,
  phone text,
  email text,
  share_percentage numeric(5,2) not null,
  is_minor boolean not null default false,
  guardian_name text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint nominees_share_check check(share_percentage > 0 and share_percentage <= 100),
  constraint nominees_minor_guardian_check check(not is_minor or nullif(trim(guardian_name),'') is not null)
);
create index nominees_nomination_id_idx on public.nominees(nomination_id,sort_order);

create table public.associate_memberships (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  primary_member_id uuid not null references public.members(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  application_number text not null,
  applicant_name text not null,
  applicant_email text,
  applicant_phone text,
  relationship text,
  consent_received boolean not null default false,
  entrance_fee_amount numeric(12,2) not null default 0,
  fee_paid_at timestamptz,
  status text not null default 'SUBMITTED',
  approved_member_id uuid references public.members(id) on delete set null,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint associate_memberships_number_unique unique(society_id,application_number),
  constraint associate_memberships_fee_check check(entrance_fee_amount >= 0),
  constraint associate_memberships_status_check check(status in ('DRAFT','SUBMITTED','UNDER_REVIEW','CORRECTION_REQUIRED','APPROVED','REJECTED','WITHDRAWN'))
);
create index associate_memberships_society_status_idx on public.associate_memberships(society_id,status,created_at desc);
create index associate_memberships_primary_member_idx on public.associate_memberships(primary_member_id);
create index associate_memberships_unit_id_idx on public.associate_memberships(unit_id);
create index associate_memberships_approved_member_idx on public.associate_memberships(approved_member_id);
create index associate_memberships_created_by_idx on public.associate_memberships(created_by);
create trigger trg_associate_memberships_updated_at before update on public.associate_memberships for each row execute procedure public.set_updated_at();

alter table public.application_checklist_items enable row level security;
alter table public.application_status_history enable row level security;
alter table public.nominations enable row level security;
alter table public.nominees enable row level security;
alter table public.associate_memberships enable row level security;

create policy "application_checklist_select" on public.application_checklist_items for select to authenticated using((select public.can_access_society(society_id)));
create policy "application_checklist_insert" on public.application_checklist_items for insert to authenticated with check((select public.has_permission(society_id,'application.create')) or (select public.has_permission(society_id,'application.verify')));
create policy "application_checklist_update" on public.application_checklist_items for update to authenticated using((select public.has_permission(society_id,'application.verify'))) with check((select public.has_permission(society_id,'application.verify')));
create policy "application_history_select" on public.application_status_history for select to authenticated using((select public.can_access_society(society_id)));

create policy "nominations_select" on public.nominations for select to authenticated using((select public.has_permission(society_id,'nomination.read')) or (select public.has_permission(society_id,'nomination.manage')));
create policy "nominations_insert" on public.nominations for insert to authenticated with check((select public.has_permission(society_id,'nomination.manage')));
create policy "nominations_update" on public.nominations for update to authenticated using((select public.has_permission(society_id,'nomination.manage'))) with check((select public.has_permission(society_id,'nomination.manage')));
create policy "nominees_select" on public.nominees for select to authenticated using(exists(select 1 from public.nominations n where n.id=nomination_id and ((select public.has_permission(n.society_id,'nomination.read')) or (select public.has_permission(n.society_id,'nomination.manage')))));
create policy "nominees_manage" on public.nominees for all to authenticated using(exists(select 1 from public.nominations n where n.id=nomination_id and (select public.has_permission(n.society_id,'nomination.manage')))) with check(exists(select 1 from public.nominations n where n.id=nomination_id and (select public.has_permission(n.society_id,'nomination.manage'))));

create policy "associate_memberships_select" on public.associate_memberships for select to authenticated using((select public.has_permission(society_id,'associate_member.read')) or (select public.has_permission(society_id,'associate_member.manage')));
create policy "associate_memberships_insert" on public.associate_memberships for insert to authenticated with check((select public.has_permission(society_id,'associate_member.manage')));
create policy "associate_memberships_update" on public.associate_memberships for update to authenticated using((select public.has_permission(society_id,'associate_member.manage'))) with check((select public.has_permission(society_id,'associate_member.manage')));

grant select,insert,update on public.application_checklist_items to authenticated;
grant select on public.application_status_history to authenticated;
grant select,insert,update on public.nominations to authenticated;
grant select,insert,update,delete on public.nominees to authenticated;
grant select,insert,update on public.associate_memberships to authenticated;
grant all on public.application_checklist_items,public.application_status_history,public.nominations,public.nominees,public.associate_memberships to service_role;

insert into public.master_data_items(category,code,label,sort_order) values
 ('MEMBER_DOCUMENT_TYPE','APPLICATION_FORM','Signed membership application',10),
 ('MEMBER_DOCUMENT_TYPE','PHOTO_ID','Government photo identity proof',20),
 ('MEMBER_DOCUMENT_TYPE','ADDRESS_PROOF','Address proof',30),
 ('MEMBER_DOCUMENT_TYPE','OWNERSHIP_PROOF','Agreement / ownership proof',40),
 ('MEMBER_DOCUMENT_TYPE','PHOTOGRAPH','Recent photograph',50),
 ('MEMBER_DOCUMENT_TYPE','NOMINATION_FORM','Signed nomination form',60),
 ('MEMBER_DOCUMENT_TYPE','PRIMARY_MEMBER_CONSENT','Primary member consent',70),
 ('MEMBER_DOCUMENT_TYPE','FEE_RECEIPT','Entrance fee receipt',80)
on conflict do nothing;

insert into public.approval_workflows(workflow_key,name,entity_type,description,version,is_active)
values ('MEMBER_APPLICATION_3_LEVEL','Three-Level Member Application Approval','MEMBER_APPLICATION','Administrative scrutiny, authority approval and final registration.',1,true)
on conflict(society_id,workflow_key,version) do nothing;

insert into public.approval_workflow_steps(workflow_id,step_order,name,permission_code,min_approvals,sla_hours)
select w.id,v.step_order,v.name,v.permission_code,1,48 from public.approval_workflows w cross join (values
 (1,'Authority 1 scrutiny','application.approve.level1'),
 (2,'Authority 2 approval','application.approve.level2'),
 (3,'Final authority registration','application.approve.final')
) as v(step_order,name,permission_code)
where w.workflow_key='MEMBER_APPLICATION_3_LEVEL' and w.society_id is null
on conflict(workflow_id,step_order) do nothing;

alter table public.approval_decisions drop constraint if exists approval_decisions_actor_unique;
create index if not exists approval_decisions_actor_history_idx on public.approval_decisions(instance_id,workflow_step_id,decided_by,decided_at);

create or replace function public.initialize_member_application(p_application_id uuid,p_actor_user_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_app public.member_applications%rowtype; v_workflow_id uuid; v_instance_id uuid;
begin
  select * into v_app from public.member_applications where id=p_application_id for update;
  if not found then raise exception 'application_not_found'; end if;
  if auth.uid() is null or auth.uid()<>p_actor_user_id or not public.has_permission(v_app.society_id,'application.create') then raise exception 'application_access_denied'; end if;
  select id into v_workflow_id from public.approval_workflows
    where workflow_key='MEMBER_APPLICATION_3_LEVEL' and is_active and (society_id=v_app.society_id or society_id is null)
    order by (society_id is not null) desc,version desc limit 1;
  if v_workflow_id is null then raise exception 'approval_workflow_not_configured'; end if;
  insert into public.application_checklist_items(society_id,application_id,item_code,label,is_required,sort_order)
  select v_app.society_id,v_app.id,m.code,m.label,true,m.sort_order from public.master_data_items m
  where m.category='MEMBER_DOCUMENT_TYPE' and m.is_active and (m.society_id=v_app.society_id or m.society_id is null)
    and case v_app.application_type
      when 'MEMBERSHIP' then m.code in ('APPLICATION_FORM','PHOTO_ID','ADDRESS_PROOF','OWNERSHIP_PROOF','PHOTOGRAPH','NOMINATION_FORM')
      when 'NOMINATION' then m.code in ('NOMINATION_FORM','PHOTO_ID')
      when 'ASSOCIATE_MEMBERSHIP' then m.code in ('APPLICATION_FORM','PHOTO_ID','ADDRESS_PROOF','PRIMARY_MEMBER_CONSENT','FEE_RECEIPT')
      else m.code in ('APPLICATION_FORM','PHOTO_ID') end
  on conflict(application_id,item_code) do nothing;
  insert into public.approval_instances(society_id,workflow_id,entity_type,entity_id,status,current_step_order,submitted_by)
  values(v_app.society_id,v_workflow_id,'MEMBER_APPLICATION',v_app.id,'PENDING',1,p_actor_user_id)
  on conflict(workflow_id,entity_type,entity_id) do update set status='PENDING',current_step_order=1,submitted_by=excluded.submitted_by,submitted_at=now(),completed_at=null
  returning id into v_instance_id;
  insert into public.application_status_history(society_id,application_id,from_status,to_status,comments,changed_by)
  values(v_app.society_id,v_app.id,null,v_app.status,'Application submitted and approval workflow started',p_actor_user_id);
  return v_instance_id;
end; $$;

create or replace function public.review_application_checklist_item(
  p_item_id uuid,p_status text,p_remarks text,p_actor_user_id uuid
) returns void language plpgsql security definer set search_path=public as $$
declare v_item public.application_checklist_items%rowtype;
begin
  select * into v_item from public.application_checklist_items where id=p_item_id for update;
  if not found then raise exception 'checklist_item_not_found'; end if;
  if auth.uid() is null or auth.uid()<>p_actor_user_id or not public.has_permission(v_item.society_id,'application.verify') then raise exception 'application_access_denied'; end if;
  if p_status not in ('PENDING','UPLOADED','VERIFIED','REJECTED','NOT_APPLICABLE') then raise exception 'invalid_checklist_status'; end if;
  update public.application_checklist_items set status=p_status,remarks=nullif(trim(p_remarks),''),verified_by=case when p_status in ('VERIFIED','REJECTED') then p_actor_user_id else null end,verified_at=case when p_status in ('VERIFIED','REJECTED') then now() else null end where id=p_item_id;
end; $$;

create or replace function public.decide_member_application(
  p_application_id uuid,p_decision text,p_comments text,p_actor_user_id uuid
) returns text language plpgsql security definer set search_path=public as $$
declare
  v_app public.member_applications%rowtype; v_instance public.approval_instances%rowtype;
  v_step public.approval_workflow_steps%rowtype; v_next_step integer; v_new_status text;
  v_member_id uuid; v_member_number text; v_seq integer;
begin
  select * into v_app from public.member_applications where id=p_application_id for update;
  if not found then raise exception 'application_not_found'; end if;
  select * into v_instance from public.approval_instances where entity_type='MEMBER_APPLICATION' and entity_id=p_application_id and status='PENDING' for update;
  if not found then raise exception 'approval_instance_not_found'; end if;
  select * into v_step from public.approval_workflow_steps where workflow_id=v_instance.workflow_id and step_order=v_instance.current_step_order;
  if not found then raise exception 'approval_step_not_found'; end if;
  if auth.uid() is null or auth.uid()<>p_actor_user_id or not public.has_permission(v_app.society_id,v_step.permission_code) then raise exception 'approval_access_denied'; end if;
  if p_decision not in ('APPROVED','REJECTED','RETURNED') then raise exception 'invalid_approval_decision'; end if;
  if p_decision='APPROVED' and v_step.step_order=1 and exists(select 1 from public.application_checklist_items where application_id=p_application_id and is_required and status not in ('VERIFIED','NOT_APPLICABLE')) then raise exception 'required_checklist_incomplete'; end if;
  insert into public.approval_decisions(instance_id,workflow_step_id,decision,comments,decided_by) values(v_instance.id,v_step.id,p_decision,nullif(trim(p_comments),''),p_actor_user_id);
  if p_decision='REJECTED' then
    v_new_status:='REJECTED'; update public.approval_instances set status='REJECTED',completed_at=now() where id=v_instance.id;
  elsif p_decision='RETURNED' then
    v_new_status:='CORRECTION_REQUIRED';
  else
    select min(step_order) into v_next_step from public.approval_workflow_steps where workflow_id=v_instance.workflow_id and step_order>v_step.step_order;
    if v_next_step is null then
      v_new_status:='APPROVED'; update public.approval_instances set status='APPROVED',completed_at=now() where id=v_instance.id;
      if v_app.application_type='MEMBERSHIP' and not (v_app.metadata ? 'approved_member_id') then
        v_seq:=public.get_next_sequence(v_app.society_id,'MEMBER',extract(year from current_date)::integer,null);
        v_member_number:='MBR-'||extract(year from current_date)::integer||'-'||lpad(v_seq::text,3,'0');
        insert into public.members(society_id,unit_id,member_number,full_name,email,phone,member_type,status,effective_from,created_by)
        values(v_app.society_id,v_app.unit_id,v_member_number,v_app.applicant_name,v_app.applicant_email,v_app.applicant_phone,'OWNER','ACTIVE',current_date,p_actor_user_id)
        returning id into v_member_id;
        update public.member_applications set metadata=metadata||jsonb_build_object('approved_member_id',v_member_id,'member_number',v_member_number) where id=v_app.id;
      end if;
    else
      v_new_status:=case v_step.step_order when 1 then 'LEVEL1_APPROVED' when 2 then 'LEVEL2_APPROVED' else 'UNDER_REVIEW' end;
      update public.approval_instances set current_step_order=v_next_step where id=v_instance.id;
    end if;
  end if;
  update public.member_applications set status=v_new_status,updated_at=now() where id=p_application_id;
  insert into public.application_status_history(society_id,application_id,from_status,to_status,comments,changed_by,metadata)
  values(v_app.society_id,p_application_id,v_app.status,v_new_status,nullif(trim(p_comments),''),p_actor_user_id,jsonb_build_object('step',v_step.step_order,'decision',p_decision));
  if v_app.created_by is not null then insert into public.notifications(society_id,user_id,notification_type,title,message,entity_type,entity_id,action_url)
    values(v_app.society_id,v_app.created_by,'APPLICATION_STATUS','Application '||v_app.application_number||' updated','Status is now '||v_new_status||coalesce('. '||nullif(trim(p_comments),''),'.'),'member_application',v_app.id,'/applications/'||v_app.id); end if;
  insert into public.audit_logs(society_id,actor_user_id,action,entity_type,entity_id,old_values,new_values,metadata)
  values(v_app.society_id,p_actor_user_id,case when p_decision='REJECTED' then 'APPLICATION_REJECTED' when p_decision='RETURNED' then 'APPLICATION_CORRECTION_REQUESTED' else 'APPLICATION_APPROVED' end,'member_application',p_application_id::text,jsonb_build_object('status',v_app.status),jsonb_build_object('status',v_new_status),jsonb_build_object('step',v_step.step_order,'comments',p_comments));
  return v_new_status;
end; $$;

create or replace function public.resubmit_member_application(p_application_id uuid,p_comments text,p_actor_user_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_app public.member_applications%rowtype;
begin
  select * into v_app from public.member_applications where id=p_application_id for update;
  if not found then raise exception 'application_not_found'; end if;
  if auth.uid() is null or auth.uid()<>p_actor_user_id or v_app.created_by<>p_actor_user_id then raise exception 'application_access_denied'; end if;
  if v_app.status<>'CORRECTION_REQUIRED' then raise exception 'application_not_returned'; end if;
  update public.member_applications set status='RESUBMITTED',updated_at=now() where id=p_application_id;
  insert into public.application_status_history(society_id,application_id,from_status,to_status,comments,changed_by) values(v_app.society_id,p_application_id,v_app.status,'RESUBMITTED',nullif(trim(p_comments),''),p_actor_user_id);
end; $$;

revoke all on function public.initialize_member_application(uuid,uuid) from public,anon;
revoke all on function public.review_application_checklist_item(uuid,text,text,uuid) from public,anon;
revoke all on function public.decide_member_application(uuid,text,text,uuid) from public,anon;
revoke all on function public.resubmit_member_application(uuid,text,uuid) from public,anon;
grant execute on function public.initialize_member_application(uuid,uuid) to authenticated;
grant execute on function public.review_application_checklist_item(uuid,text,text,uuid) to authenticated;
grant execute on function public.decide_member_application(uuid,text,text,uuid) to authenticated;
grant execute on function public.resubmit_member_application(uuid,text,uuid) to authenticated;
