-- Complete member registration fields, normalized joint members, atomic member
-- creation, and strict society-level member-application authorization.

update public.approval_workflow_steps
set name='Society Admin final registration', permission_code='application.approve.final'
where workflow_id=(select id from public.approval_workflows where workflow_key='MEMBER_APPLICATION_3_LEVEL' and society_id is null order by version desc limit 1)
  and step_order=3;

alter table public.members
  add column if not exists father_spouse_name text,
  add column if not exists date_of_birth date,
  add column if not exists pan text,
  add column if not exists identity_type text,
  add column if not exists identity_number_masked text,
  add column if not exists identity_number_hash text,
  add column if not exists correspondence_address text,
  add column if not exists permanent_address text,
  add column if not exists ownership_type text,
  add column if not exists ownership_document_number text,
  add column if not exists ownership_date date,
  add column if not exists share_certificate_number text,
  add column if not exists shares_held numeric(12,3);

alter table public.members
  drop constraint if exists members_pan_check,
  add constraint members_pan_check check(pan is null or pan~'^[A-Z]{5}[0-9]{4}[A-Z]$'),
  drop constraint if exists members_identity_type_check,
  add constraint members_identity_type_check check(identity_type is null or identity_type in ('AADHAAR','PASSPORT','VOTER_ID','DRIVING_LICENCE','OTHER')),
  drop constraint if exists members_identity_mask_check,
  add constraint members_identity_mask_check check(identity_number_masked is null or identity_number_masked~'^[*X-]*[A-Z0-9]{4}$'),
  drop constraint if exists members_identity_hash_check,
  add constraint members_identity_hash_check check(identity_number_hash is null or identity_number_hash~'^[a-f0-9]{64}$'),
  drop constraint if exists members_ownership_type_check,
  add constraint members_ownership_type_check check(ownership_type is null or ownership_type in ('SOLE','JOINT','ASSOCIATE','TENANT','OTHER')),
  drop constraint if exists members_shares_held_check,
  add constraint members_shares_held_check check(shares_held is null or shares_held>=0);

create unique index if not exists members_identity_hash_unique_idx
  on public.members(society_id,identity_number_hash)
  where identity_number_hash is not null;
create index if not exists members_pan_idx on public.members(society_id,pan) where pan is not null;

alter table public.member_applications
  add column if not exists father_spouse_name text,
  add column if not exists date_of_birth date,
  add column if not exists pan text,
  add column if not exists identity_type text,
  add column if not exists identity_number_masked text,
  add column if not exists identity_number_hash text,
  add column if not exists correspondence_address text,
  add column if not exists permanent_address text,
  add column if not exists ownership_type text,
  add column if not exists ownership_document_number text,
  add column if not exists ownership_date date,
  add column if not exists share_certificate_number text,
  add column if not exists shares_held numeric(12,3),
  add column if not exists joint_member_details jsonb not null default '[]'::jsonb;

alter table public.member_applications
  drop constraint if exists member_applications_pan_check,
  add constraint member_applications_pan_check check(pan is null or pan~'^[A-Z]{5}[0-9]{4}[A-Z]$'),
  drop constraint if exists member_applications_identity_type_check,
  add constraint member_applications_identity_type_check check(identity_type is null or identity_type in ('AADHAAR','PASSPORT','VOTER_ID','DRIVING_LICENCE','OTHER')),
  drop constraint if exists member_applications_joint_details_check,
  add constraint member_applications_joint_details_check check(jsonb_typeof(joint_member_details)='array');

create table public.joint_members(
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references public.societies(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  full_name text not null,
  father_spouse_name text,
  relationship text,
  date_of_birth date,
  email text,
  phone text,
  pan text,
  identity_type text,
  identity_number_masked text,
  identity_number_hash text,
  ownership_share numeric(5,2),
  position integer not null default 1,
  status text not null default 'ACTIVE',
  effective_from date not null default current_date,
  effective_until date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint joint_members_position_unique unique(member_id,position),
  constraint joint_members_position_check check(position>0),
  constraint joint_members_status_check check(status in ('ACTIVE','INACTIVE','CEASED')),
  constraint joint_members_share_check check(ownership_share is null or ownership_share between 0 and 100),
  constraint joint_members_pan_check check(pan is null or pan~'^[A-Z]{5}[0-9]{4}[A-Z]$'),
  constraint joint_members_identity_type_check check(identity_type is null or identity_type in ('AADHAAR','PASSPORT','VOTER_ID','DRIVING_LICENCE','OTHER')),
  constraint joint_members_identity_hash_check check(identity_number_hash is null or identity_number_hash~'^[a-f0-9]{64}$')
);
create index joint_members_society_idx on public.joint_members(society_id,status);
create index joint_members_member_idx on public.joint_members(member_id,position);
create unique index joint_members_identity_hash_unique_idx
  on public.joint_members(society_id,identity_number_hash)
  where identity_number_hash is not null;
create trigger trg_joint_members_updated_at before update on public.joint_members
  for each row execute procedure public.set_updated_at();

alter table public.joint_members enable row level security;
revoke all on public.joint_members from anon,authenticated;
grant select,insert,update on public.joint_members to authenticated;
grant all on public.joint_members to service_role;
create policy "joint_members_read" on public.joint_members for select to authenticated
using(public.can_access_society(society_id) and not public.is_vendor_user(society_id));
create policy "joint_members_insert" on public.joint_members for insert to authenticated
with check(public.has_permission(society_id,'member.create') and not public.is_platform_admin());
create policy "joint_members_update" on public.joint_members for update to authenticated
using(public.has_permission(society_id,'member.update') and not public.is_platform_admin())
with check(public.has_permission(society_id,'member.update') and not public.is_platform_admin());

create or replace function public.register_member_atomic(
  p_society_id uuid,
  p_member jsonb,
  p_joint_members jsonb,
  p_actor_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_member_id uuid;
  v_member_number text;
  v_sequence integer;
  v_unit_id uuid;
  v_wing_id uuid;
  v_pan text;
  v_identity_hash text;
  v_joint_count integer;
begin
  if auth.uid() is null or auth.uid()<>p_actor_user_id or public.is_platform_admin()
     or not public.has_permission(p_society_id,'member.create') then
    raise exception 'member_registration_access_denied';
  end if;
  if jsonb_typeof(p_member)<>'object' or nullif(trim(p_member->>'fullName'),'') is null then
    raise exception 'member_full_name_required';
  end if;
  if jsonb_typeof(coalesce(p_joint_members,'[]'::jsonb))<>'array' then
    raise exception 'joint_members_must_be_array';
  end if;
  v_unit_id:=nullif(p_member->>'unitId','')::uuid;
  if v_unit_id is not null then
    select wing_id into v_wing_id from public.units where id=v_unit_id and society_id=p_society_id;
    if v_wing_id is null then raise exception 'member_unit_not_in_society'; end if;
    if not public.can_access_wing(p_society_id,v_wing_id) then raise exception 'member_unit_wing_access_denied'; end if;
  end if;
  v_pan:=nullif(upper(regexp_replace(p_member->>'pan','[[:space:]]','','g')),'');
  if v_pan is not null and v_pan!~'^[A-Z]{5}[0-9]{4}[A-Z]$' then raise exception 'invalid_member_pan'; end if;
  v_identity_hash:=nullif(lower(p_member->>'identityNumberHash'),'');
  if v_identity_hash is not null and v_identity_hash!~'^[a-f0-9]{64}$' then raise exception 'invalid_identity_hash'; end if;
  if exists(
    select 1 from jsonb_to_recordset(coalesce(p_joint_members,'[]'::jsonb)) as j(
      "fullName" text,"ownershipShare" numeric,pan text,"identityNumberHash" text
    ) where nullif(trim(j."fullName"),'') is null
       or j."ownershipShare"<0 or j."ownershipShare">100
       or (nullif(j.pan,'') is not null and upper(regexp_replace(j.pan,'[[:space:]]','','g'))!~'^[A-Z]{5}[0-9]{4}[A-Z]$')
       or (nullif(j."identityNumberHash",'') is not null and lower(j."identityNumberHash")!~'^[a-f0-9]{64}$')
  ) then raise exception 'invalid_joint_member_details'; end if;
  if coalesce((select sum(j."ownershipShare") from jsonb_to_recordset(coalesce(p_joint_members,'[]'::jsonb)) as j("ownershipShare" numeric)),0)>100 then
    raise exception 'joint_member_shares_exceed_100';
  end if;

  v_sequence:=public.get_next_sequence(p_society_id,'MEMBER',extract(year from current_date)::integer,null);
  v_member_number:='MBR-'||extract(year from current_date)::integer||'-'||lpad(v_sequence::text,3,'0');
  insert into public.members(
    society_id,unit_id,member_number,full_name,father_spouse_name,email,phone,date_of_birth,pan,
    identity_type,identity_number_masked,identity_number_hash,correspondence_address,permanent_address,
    address,ownership_type,ownership_document_number,ownership_date,share_certificate_number,shares_held,
    member_type,status,effective_from,occupation,age_at_admission,entrance_fee_paid_at,
    nominee_name_address,nomination_date,notes,created_by
  ) values (
    p_society_id,v_unit_id,v_member_number,trim(p_member->>'fullName'),nullif(trim(p_member->>'fatherSpouseName'),''),
    nullif(lower(trim(p_member->>'email')),''),nullif(trim(p_member->>'phone'),''),nullif(p_member->>'dateOfBirth','')::date,v_pan,
    nullif(p_member->>'identityType',''),nullif(p_member->>'identityNumberMasked',''),v_identity_hash,
    nullif(trim(p_member->>'correspondenceAddress'),''),nullif(trim(p_member->>'permanentAddress'),''),
    coalesce(nullif(trim(p_member->>'correspondenceAddress'),''),nullif(trim(p_member->>'permanentAddress'),'')),
    nullif(p_member->>'ownershipType',''),nullif(trim(p_member->>'ownershipDocumentNumber'),''),
    nullif(p_member->>'ownershipDate','')::date,nullif(trim(p_member->>'shareCertificateNumber'),''),
    nullif(p_member->>'sharesHeld','')::numeric,coalesce(nullif(p_member->>'memberType',''),'OWNER'),'ACTIVE',
    coalesce(nullif(p_member->>'effectiveFrom','')::date,current_date),nullif(trim(p_member->>'occupation'),''),
    nullif(p_member->>'ageAtAdmission','')::smallint,nullif(p_member->>'entranceFeePaidAt','')::date,
    nullif(trim(p_member->>'nomineeNameAddress'),''),nullif(p_member->>'nominationDate','')::date,
    nullif(trim(p_member->>'notes'),''),p_actor_user_id
  ) returning id into v_member_id;

  insert into public.joint_members(
    society_id,member_id,full_name,father_spouse_name,relationship,date_of_birth,email,phone,pan,
    identity_type,identity_number_masked,identity_number_hash,ownership_share,position,created_by
  )
  select p_society_id,v_member_id,trim(j."fullName"),nullif(trim(j."fatherSpouseName"),''),
    nullif(trim(j.relationship),''),nullif(j."dateOfBirth",'')::date,nullif(lower(trim(j.email)),''),
    nullif(trim(j.phone),''),nullif(upper(regexp_replace(j.pan,'[[:space:]]','','g')),''),
    nullif(j."identityType",''),nullif(j."identityNumberMasked",''),nullif(lower(j."identityNumberHash"),''),
    j."ownershipShare",row_number() over(),p_actor_user_id
  from jsonb_to_recordset(coalesce(p_joint_members,'[]'::jsonb)) as j(
    "fullName" text,"fatherSpouseName" text,relationship text,"dateOfBirth" text,email text,phone text,
    pan text,"identityType" text,"identityNumberMasked" text,"identityNumberHash" text,"ownershipShare" numeric
  );
  get diagnostics v_joint_count=row_count;
  insert into public.audit_logs(society_id,actor_user_id,action,entity_type,entity_id,new_values,metadata)
  values(p_society_id,p_actor_user_id,'MEMBER_REGISTERED','member',v_member_id::text,
    jsonb_build_object('member_number',v_member_number,'member_type',coalesce(nullif(p_member->>'memberType',''),'OWNER'),
      'unit_id',v_unit_id,'joint_member_count',v_joint_count),
    jsonb_build_object('identity_type',nullif(p_member->>'identityType',''),'has_identity_hash',v_identity_hash is not null));
  return jsonb_build_object('id',v_member_id,'memberNumber',v_member_number);
end;
$$;

create or replace function public.application_actor_has_stage_role(
  p_society_id uuid,
  p_actor_user_id uuid,
  p_permission_code text
) returns boolean
language sql
security definer
stable
set search_path=public,pg_temp
as $$
  select exists(
    select 1 from public.user_access_assignments uaa
    join public.roles r on r.id=uaa.role_id
    join public.role_permissions rp on rp.role_id=r.id
    join public.permissions p on p.id=rp.permission_id and p.code=p_permission_code
    where uaa.user_id=p_actor_user_id and uaa.society_id=p_society_id and uaa.is_active
      and (uaa.valid_from is null or uaa.valid_from<=now())
      and (uaa.valid_until is null or uaa.valid_until>now())
      and ((p_permission_code='application.approve.level1' and r.name='Application Officer')
        or (p_permission_code='application.approve.level2' and r.name='Application Authority')
        or (p_permission_code='application.approve.final' and r.name='Society Admin' and uaa.wing_id is null))
  );
$$;

create or replace function public.decide_member_application(
  p_application_id uuid,p_decision text,p_comments text,p_actor_user_id uuid
) returns text
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_app public.member_applications%rowtype; v_instance public.approval_instances%rowtype;
  v_step public.approval_workflow_steps%rowtype; v_next_step integer; v_new_status text;
  v_member_id uuid; v_member_number text; v_seq integer; v_joint_count integer;
begin
  select * into v_app from public.member_applications where id=p_application_id for update;
  if not found then raise exception 'application_not_found'; end if;
  select * into v_instance from public.approval_instances where entity_type='MEMBER_APPLICATION' and entity_id=p_application_id and status='PENDING' for update;
  if not found then raise exception 'approval_instance_not_found'; end if;
  select * into v_step from public.approval_workflow_steps where workflow_id=v_instance.workflow_id and step_order=v_instance.current_step_order;
  if not found then raise exception 'approval_step_not_found'; end if;
  if auth.uid() is null or auth.uid()<>p_actor_user_id or public.is_platform_admin()
     or not public.application_actor_has_stage_role(v_app.society_id,p_actor_user_id,v_step.permission_code) then
    raise exception 'approval_access_denied';
  end if;
  if p_actor_user_id=v_instance.submitted_by then raise exception 'application_self_approval_denied'; end if;
  if exists(select 1 from public.approval_decisions where instance_id=v_instance.id and decided_by=p_actor_user_id) then
    raise exception 'distinct_application_approver_required';
  end if;
  if p_decision not in ('APPROVED','REJECTED','RETURNED') then raise exception 'invalid_approval_decision'; end if;
  if p_decision in ('REJECTED','RETURNED') and nullif(trim(p_comments),'') is null then
    raise exception 'approval_comments_required';
  end if;
  if p_decision='APPROVED' and v_step.step_order=1 and exists(
    select 1 from public.application_checklist_items where application_id=p_application_id and is_required and status not in ('VERIFIED','NOT_APPLICABLE')
  ) then raise exception 'required_checklist_incomplete'; end if;
  insert into public.approval_decisions(instance_id,workflow_step_id,decision,comments,decided_by)
  values(v_instance.id,v_step.id,p_decision,nullif(trim(p_comments),''),p_actor_user_id);
  if p_decision='REJECTED' then
    v_new_status:='REJECTED';
    update public.approval_instances set status='REJECTED',completed_at=now() where id=v_instance.id;
  elsif p_decision='RETURNED' then
    v_new_status:='CORRECTION_REQUIRED';
  else
    select min(step_order) into v_next_step from public.approval_workflow_steps where workflow_id=v_instance.workflow_id and step_order>v_step.step_order;
    if v_next_step is null then
      v_new_status:='APPROVED';
      update public.approval_instances set status='APPROVED',completed_at=now() where id=v_instance.id;
      if v_app.application_type='MEMBERSHIP' and not (v_app.metadata ? 'approved_member_id') then
        v_seq:=public.get_next_sequence(v_app.society_id,'MEMBER',extract(year from current_date)::integer,null);
        v_member_number:='MBR-'||extract(year from current_date)::integer||'-'||lpad(v_seq::text,3,'0');
        insert into public.members(
          society_id,unit_id,member_number,full_name,father_spouse_name,email,phone,date_of_birth,pan,
          identity_type,identity_number_masked,identity_number_hash,correspondence_address,permanent_address,address,
          ownership_type,ownership_document_number,ownership_date,share_certificate_number,shares_held,
          member_type,status,effective_from,created_by
        ) values (
          v_app.society_id,v_app.unit_id,v_member_number,v_app.applicant_name,v_app.father_spouse_name,
          v_app.applicant_email,v_app.applicant_phone,v_app.date_of_birth,v_app.pan,v_app.identity_type,
          v_app.identity_number_masked,v_app.identity_number_hash,v_app.correspondence_address,v_app.permanent_address,
          coalesce(v_app.correspondence_address,v_app.permanent_address),v_app.ownership_type,
          v_app.ownership_document_number,v_app.ownership_date,v_app.share_certificate_number,v_app.shares_held,
          'OWNER','ACTIVE',current_date,p_actor_user_id
        ) returning id into v_member_id;
        insert into public.joint_members(
          society_id,member_id,full_name,father_spouse_name,relationship,date_of_birth,email,phone,pan,
          identity_type,identity_number_masked,identity_number_hash,ownership_share,position,created_by
        )
        select v_app.society_id,v_member_id,trim(j."fullName"),nullif(trim(j."fatherSpouseName"),''),
          nullif(trim(j.relationship),''),nullif(j."dateOfBirth",'')::date,nullif(lower(trim(j.email)),''),
          nullif(trim(j.phone),''),nullif(upper(regexp_replace(j.pan,'[[:space:]]','','g')),''),
          nullif(j."identityType",''),nullif(j."identityNumberMasked",''),nullif(lower(j."identityNumberHash"),''),
          j."ownershipShare",row_number() over(),p_actor_user_id
        from jsonb_to_recordset(v_app.joint_member_details) as j(
          "fullName" text,"fatherSpouseName" text,relationship text,"dateOfBirth" text,email text,phone text,
          pan text,"identityType" text,"identityNumberMasked" text,"identityNumberHash" text,"ownershipShare" numeric
        );
        get diagnostics v_joint_count=row_count;
        update public.member_applications set metadata=metadata||jsonb_build_object(
          'approved_member_id',v_member_id,'member_number',v_member_number,'joint_member_count',v_joint_count
        ) where id=v_app.id;
      end if;
    else
      v_new_status:=case v_step.step_order when 1 then 'LEVEL1_APPROVED' when 2 then 'LEVEL2_APPROVED' else 'UNDER_REVIEW' end;
      update public.approval_instances set current_step_order=v_next_step where id=v_instance.id;
    end if;
  end if;
  update public.member_applications set status=v_new_status,updated_at=now() where id=p_application_id;
  insert into public.application_status_history(society_id,application_id,from_status,to_status,comments,changed_by,metadata)
  values(v_app.society_id,p_application_id,v_app.status,v_new_status,nullif(trim(p_comments),''),p_actor_user_id,
    jsonb_build_object('step',v_step.step_order,'decision',p_decision));
  if v_app.created_by is not null then
    insert into public.notifications(society_id,user_id,notification_type,title,message,entity_type,entity_id,action_url)
    values(v_app.society_id,v_app.created_by,'APPLICATION_STATUS','Application '||v_app.application_number||' updated',
      'Status is now '||v_new_status||coalesce('. '||nullif(trim(p_comments),''),'.'),
      'member_application',v_app.id,'/applications/'||v_app.id);
  end if;
  insert into public.audit_logs(society_id,actor_user_id,action,entity_type,entity_id,old_values,new_values,metadata)
  values(v_app.society_id,p_actor_user_id,case when p_decision='REJECTED' then 'APPLICATION_REJECTED' when p_decision='RETURNED' then 'APPLICATION_CORRECTION_REQUESTED' else 'APPLICATION_APPROVED' end,
    'member_application',p_application_id::text,jsonb_build_object('status',v_app.status),jsonb_build_object('status',v_new_status),
    jsonb_build_object('step',v_step.step_order,'comments',p_comments));
  return v_new_status;
end;
$$;

revoke all on function public.register_member_atomic(uuid,jsonb,jsonb,uuid) from public,anon;
revoke all on function public.application_actor_has_stage_role(uuid,uuid,text) from public,anon;
revoke all on function public.decide_member_application(uuid,text,text,uuid) from public,anon;
grant execute on function public.register_member_atomic(uuid,jsonb,jsonb,uuid) to authenticated,service_role;
grant execute on function public.application_actor_has_stage_role(uuid,uuid,text) to authenticated,service_role;
grant execute on function public.decide_member_application(uuid,text,text,uuid) to authenticated,service_role;
