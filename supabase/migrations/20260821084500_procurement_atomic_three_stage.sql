-- Atomic procurement transactions and a society-scoped three-stage vendor
-- selection workflow. Platform administrators deliberately cannot participate
-- in operational procurement decisions.

insert into public.permissions(code,name,description,module) values
  ('vendor_selection.approve.level1','Vendor Selection Authority 1','Perform first-stage vendor selection approval','procurement'),
  ('vendor_selection.approve.level2','Vendor Selection Authority 2','Perform second-stage vendor selection approval','procurement'),
  ('vendor_selection.approve.final','Vendor Selection Final Approval','Perform final society-level vendor selection approval','procurement')
on conflict(code) do update set
  name=excluded.name,
  description=excluded.description,
  module=excluded.module;

insert into public.roles(name,description,is_system_role) values
  ('Procurement Authority 2','Second-stage society procurement committee authority',true)
on conflict(name) do update set
  description=excluded.description,
  is_system_role=true;

insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where (r.name='Procurement Authority' and p.code='vendor_selection.approve.level1')
   or (r.name='Procurement Authority 2' and p.code in (
        'rfq.read','quotation.read','quotation.compare','vendor.read',
        'vendor_selection.approve.level2','report.view','report.procurement'
      ))
   or (r.name='Society Admin' and p.code='vendor_selection.approve.final')
on conflict(role_id,permission_id) do nothing;

insert into public.approval_workflows(
  workflow_key,name,entity_type,description,version,is_active
) values (
  'VENDOR_SELECTION_3_LEVEL',
  'Three-Level Vendor Selection Approval',
  'VENDOR_SELECTION',
  'Procurement Authority 1, Procurement Authority 2, and final same-society Society Admin approval.',
  1,
  true
)
on conflict(society_id,workflow_key,version) do update set
  name=excluded.name,
  entity_type=excluded.entity_type,
  description=excluded.description,
  is_active=true;

insert into public.approval_workflow_steps(
  workflow_id,step_order,name,permission_code,min_approvals,rejection_ends_workflow,sla_hours
)
select w.id,v.step_order,v.name,v.permission_code,1,true,48
from public.approval_workflows w
cross join (values
  (1,'Procurement Authority 1','vendor_selection.approve.level1'),
  (2,'Procurement Authority 2','vendor_selection.approve.level2'),
  (3,'Society Admin final approval','vendor_selection.approve.final')
) as v(step_order,name,permission_code)
where w.workflow_key='VENDOR_SELECTION_3_LEVEL' and w.society_id is null
on conflict(workflow_id,step_order) do update set
  name=excluded.name,
  permission_code=excluded.permission_code,
  min_approvals=excluded.min_approvals,
  rejection_ends_workflow=excluded.rejection_ends_workflow,
  sla_hours=excluded.sla_hours;

create or replace function public.publish_rfq_atomic(
  p_rfq_id uuid,
  p_vendor_ids uuid[],
  p_actor_user_id uuid
) returns integer
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_rfq public.rfqs%rowtype;
  v_vendor_ids uuid[];
  v_vendor_count integer;
begin
  if auth.uid() is null or auth.uid()<>p_actor_user_id or public.is_platform_admin()
     or not public.has_permission((select society_id from public.rfqs where id=p_rfq_id),'rfq.publish') then
    raise exception 'rfq_publish_access_denied';
  end if;

  select * into v_rfq from public.rfqs where id=p_rfq_id for update;
  if not found then raise exception 'rfq_not_found'; end if;
  if v_rfq.status<>'DRAFT' then raise exception 'rfq_not_draft'; end if;
  if v_rfq.submission_deadline is null or v_rfq.submission_deadline<=now() then
    raise exception 'rfq_deadline_must_be_future';
  end if;

  select coalesce(array_agg(distinct x),array[]::uuid[]) into v_vendor_ids
  from unnest(coalesce(p_vendor_ids,array[]::uuid[])) x where x is not null;
  if cardinality(v_vendor_ids)=0 then raise exception 'rfq_vendor_required'; end if;

  select count(*) into v_vendor_count from public.vendors
  where society_id=v_rfq.society_id and status='ACTIVE' and id=any(v_vendor_ids);
  if v_vendor_count<>cardinality(v_vendor_ids) then
    raise exception 'rfq_vendors_must_be_active_in_society';
  end if;

  insert into public.rfq_invitations(
    society_id,rfq_id,vendor_id,status,invited_at,invited_by
  )
  select v_rfq.society_id,v_rfq.id,x,'INVITED',now(),p_actor_user_id
  from unnest(v_vendor_ids) x
  on conflict(rfq_id,vendor_id) do update set
    status='INVITED',invited_at=now(),invited_by=excluded.invited_by,
    responded_at=null,decline_reason=null;

  update public.rfqs set status='PUBLISHED' where id=v_rfq.id;

  insert into public.notifications(
    society_id,user_id,notification_type,title,message,entity_type,entity_id,action_url
  )
  select distinct v_rfq.society_id,vu.user_id,'RFQ_INVITATION',
    'Invitation: '||v_rfq.rfq_number,v_rfq.title,'rfq',v_rfq.id,
    '/vendor/rfqs/'||v_rfq.id
  from public.vendor_users vu
  where vu.society_id=v_rfq.society_id and vu.vendor_id=any(v_vendor_ids) and vu.is_active;

  insert into public.audit_logs(
    society_id,actor_user_id,action,entity_type,entity_id,old_values,new_values,metadata
  ) values (
    v_rfq.society_id,p_actor_user_id,'RFQ_INVITATIONS_SENT','rfq',v_rfq.id::text,
    jsonb_build_object('status',v_rfq.status),
    jsonb_build_object('status','PUBLISHED','vendor_ids',to_jsonb(v_vendor_ids)),
    jsonb_build_object('invited_count',cardinality(v_vendor_ids))
  );
  return cardinality(v_vendor_ids);
end;
$$;

create or replace function public.submit_vendor_quotation_atomic(
  p_rfq_id uuid,
  p_invitation_id uuid,
  p_items jsonb,
  p_validity_days integer,
  p_delivery_days integer,
  p_payment_terms text,
  p_warranty_terms text,
  p_terms text,
  p_actor_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_invitation public.rfq_invitations%rowtype;
  v_rfq public.rfqs%rowtype;
  v_vendor_id uuid;
  v_quote_id uuid;
  v_number text;
  v_sequence integer;
  v_subtotal numeric(14,2);
  v_tax numeric(14,2);
begin
  if auth.uid() is null or auth.uid()<>p_actor_user_id or public.is_platform_admin() then
    raise exception 'quotation_access_denied';
  end if;
  select vu.vendor_id into v_vendor_id from public.vendor_users vu
  where vu.society_id=(select society_id from public.rfqs where id=p_rfq_id)
    and vu.user_id=p_actor_user_id and vu.is_active limit 1;
  if v_vendor_id is null then raise exception 'vendor_profile_not_linked'; end if;

  select * into v_invitation from public.rfq_invitations
  where id=p_invitation_id and rfq_id=p_rfq_id and vendor_id=v_vendor_id for update;
  if not found then raise exception 'rfq_invitation_not_found'; end if;
  select * into v_rfq from public.rfqs where id=p_rfq_id for update;
  if v_rfq.status<>'PUBLISHED' or v_rfq.submission_deadline is null
     or v_rfq.submission_deadline<=now() then raise exception 'quotation_submission_closed'; end if;
  if not public.has_permission(v_rfq.society_id,'quotation.submit') then
    raise exception 'quotation_access_denied';
  end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then
    raise exception 'quotation_line_required';
  end if;
  if exists(
    select 1 from jsonb_to_recordset(p_items) as i(
      description text,quantity numeric,unit text,"unitRate" numeric,"taxRate" numeric,notes text
    ) where nullif(trim(i.description),'') is null or i.quantity<=0 or i."unitRate"<0
       or i."taxRate"<0 or i."taxRate">100
  ) then raise exception 'invalid_quotation_line'; end if;

  select round(sum(i.quantity*i."unitRate"),2),
         round(sum(i.quantity*i."unitRate"*i."taxRate"/100),2)
    into v_subtotal,v_tax
  from jsonb_to_recordset(p_items) as i(
    description text,quantity numeric,unit text,"unitRate" numeric,"taxRate" numeric,notes text
  );

  v_sequence:=public.get_next_sequence(v_rfq.society_id,'QUOTATION',extract(year from current_date)::integer,null);
  v_number:='QTN-'||extract(year from current_date)::integer||'-'||lpad(v_sequence::text,3,'0');
  insert into public.quotations(
    society_id,rfq_id,vendor_id,invitation_id,quotation_number,status,
    subtotal,tax_amount,total_amount,validity_days,delivery_days,payment_terms,
    warranty_terms,terms,submitted_at,submitted_by
  ) values (
    v_rfq.society_id,v_rfq.id,v_vendor_id,v_invitation.id,v_number,'SUBMITTED',
    v_subtotal,v_tax,v_subtotal+v_tax,p_validity_days,p_delivery_days,
    nullif(trim(p_payment_terms),''),nullif(trim(p_warranty_terms),''),
    nullif(trim(p_terms),''),now(),p_actor_user_id
  ) returning id into v_quote_id;

  insert into public.quotation_items(
    quotation_id,line_number,description,quantity,unit,unit_rate,tax_rate,notes
  )
  select v_quote_id,row_number() over(),trim(i.description),i.quantity,
    coalesce(nullif(trim(i.unit),''),'LOT'),i."unitRate",i."taxRate",nullif(trim(i.notes),'')
  from jsonb_to_recordset(p_items) as i(
    description text,quantity numeric,unit text,"unitRate" numeric,"taxRate" numeric,notes text
  );

  update public.rfq_invitations set status='ACCEPTED',responded_at=now(),decline_reason=null
  where id=v_invitation.id;

  insert into public.notifications(
    society_id,user_id,notification_type,title,message,entity_type,entity_id,action_url
  )
  select distinct v_rfq.society_id,uaa.user_id,'QUOTATION_SUBMITTED',
    'Quotation received: '||v_number,v_rfq.title,'quotation',v_quote_id,
    '/procurement/rfqs/'||v_rfq.id
  from public.user_access_assignments uaa
  join public.role_permissions rp on rp.role_id=uaa.role_id
  join public.permissions p on p.id=rp.permission_id and p.code='quotation.read'
  join public.profiles pr on pr.id=uaa.user_id and pr.is_active and not pr.is_platform_admin
  where uaa.society_id=v_rfq.society_id and uaa.is_active
    and uaa.wing_id is null
    and (uaa.valid_from is null or uaa.valid_from<=now())
    and (uaa.valid_until is null or uaa.valid_until>now());

  insert into public.audit_logs(
    society_id,actor_user_id,action,entity_type,entity_id,new_values
  ) values (
    v_rfq.society_id,p_actor_user_id,'QUOTATION_SUBMITTED','quotation',v_quote_id::text,
    jsonb_build_object('quotation_number',v_number,'rfq_id',v_rfq.id,
      'subtotal',v_subtotal,'tax_amount',v_tax,'total_amount',v_subtotal+v_tax)
  );
  return jsonb_build_object('id',v_quote_id,'quotationNumber',v_number);
end;
$$;

create or replace function public.evaluate_quotation_atomic(
  p_quotation_id uuid,
  p_technical_score numeric,
  p_commercial_score numeric,
  p_experience_score numeric,
  p_recommendation text,
  p_remarks text,
  p_actor_user_id uuid
) returns numeric
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_quote public.quotations%rowtype;
  v_total numeric(6,2);
begin
  select * into v_quote from public.quotations where id=p_quotation_id for update;
  if not found then raise exception 'quotation_not_found'; end if;
  if auth.uid() is null or auth.uid()<>p_actor_user_id or public.is_platform_admin()
     or not public.has_permission(v_quote.society_id,'quotation.evaluate') then
    raise exception 'quotation_evaluation_access_denied';
  end if;
  if v_quote.status not in ('SUBMITTED','UNDER_EVALUATION') then
    raise exception 'quotation_not_evaluable';
  end if;
  if p_technical_score not between 0 and 100
     or p_commercial_score not between 0 and 100
     or p_experience_score not between 0 and 100 then raise exception 'invalid_quotation_score'; end if;
  v_total:=round(p_technical_score*.4+p_commercial_score*.4+p_experience_score*.2,2);
  insert into public.quotation_evaluations(
    society_id,quotation_id,evaluator_id,technical_score,commercial_score,
    experience_score,total_score,recommendation,remarks,evaluated_at
  ) values (
    v_quote.society_id,v_quote.id,p_actor_user_id,p_technical_score,p_commercial_score,
    p_experience_score,v_total,nullif(trim(p_recommendation),''),nullif(trim(p_remarks),''),now()
  ) on conflict(quotation_id,evaluator_id) do update set
    technical_score=excluded.technical_score,commercial_score=excluded.commercial_score,
    experience_score=excluded.experience_score,total_score=excluded.total_score,
    recommendation=excluded.recommendation,remarks=excluded.remarks,evaluated_at=now();
  update public.quotations set status='UNDER_EVALUATION' where id=v_quote.id;
  update public.rfqs set status='EVALUATION' where id=v_quote.rfq_id and status='PUBLISHED';
  insert into public.audit_logs(
    society_id,actor_user_id,action,entity_type,entity_id,new_values
  ) values (
    v_quote.society_id,p_actor_user_id,'QUOTATION_EVALUATED','quotation',v_quote.id::text,
    jsonb_build_object('technical_score',p_technical_score,'commercial_score',p_commercial_score,
      'experience_score',p_experience_score,'total_score',v_total)
  );
  return v_total;
end;
$$;

create or replace function public.recommend_vendor_selection_atomic(
  p_rfq_id uuid,
  p_quotation_id uuid,
  p_vendor_id uuid,
  p_justification text,
  p_actor_user_id uuid
) returns uuid
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_quote public.quotations%rowtype;
  v_rfq public.rfqs%rowtype;
  v_workflow_id uuid;
  v_instance_id uuid;
  v_selection_id uuid;
  v_first_step integer;
  v_permission text;
begin
  select * into v_rfq from public.rfqs where id=p_rfq_id for update;
  if not found then raise exception 'rfq_not_found'; end if;
  if auth.uid() is null or auth.uid()<>p_actor_user_id or public.is_platform_admin()
     or not public.has_permission(v_rfq.society_id,'vendor_selection.recommend') then
    raise exception 'vendor_recommendation_access_denied';
  end if;
  if nullif(trim(p_justification),'') is null then raise exception 'selection_justification_required'; end if;
  select * into v_quote from public.quotations
  where id=p_quotation_id and rfq_id=p_rfq_id and vendor_id=p_vendor_id
    and society_id=v_rfq.society_id and status in ('SUBMITTED','UNDER_EVALUATION') for update;
  if not found then raise exception 'eligible_quotation_not_found'; end if;
  if not exists(select 1 from public.quotation_evaluations where quotation_id=v_quote.id) then
    raise exception 'quotation_must_be_evaluated';
  end if;

  select id into v_workflow_id from public.approval_workflows
  where workflow_key='VENDOR_SELECTION_3_LEVEL' and entity_type='VENDOR_SELECTION'
    and is_active and (society_id=v_rfq.society_id or society_id is null)
  order by (society_id is not null) desc,version desc limit 1;
  if v_workflow_id is null then raise exception 'vendor_selection_workflow_not_configured'; end if;
  select min(step_order) into v_first_step from public.approval_workflow_steps where workflow_id=v_workflow_id;
  if v_first_step is null then raise exception 'vendor_selection_workflow_has_no_steps'; end if;

  insert into public.vendor_selections(
    society_id,rfq_id,quotation_id,vendor_id,status,justification,recommended_by,recommended_at
  ) values (
    v_rfq.society_id,v_rfq.id,v_quote.id,p_vendor_id,'RECOMMENDED',trim(p_justification),p_actor_user_id,now()
  ) returning id into v_selection_id;
  insert into public.approval_instances(
    society_id,workflow_id,entity_type,entity_id,status,current_step_order,submitted_by,submitted_at,
    metadata
  ) values (
    v_rfq.society_id,v_workflow_id,'VENDOR_SELECTION',v_selection_id,'PENDING',v_first_step,
    p_actor_user_id,now(),jsonb_build_object('rfq_id',v_rfq.id,'quotation_id',v_quote.id,'vendor_id',p_vendor_id)
  ) returning id into v_instance_id;

  select permission_code into v_permission from public.approval_workflow_steps
  where workflow_id=v_workflow_id and step_order=v_first_step;
  insert into public.notifications(
    society_id,user_id,notification_type,title,message,entity_type,entity_id,action_url
  )
  select distinct v_rfq.society_id,uaa.user_id,'VENDOR_SELECTION_APPROVAL',
    'Vendor selection approval required',v_rfq.rfq_number||' · '||v_rfq.title,
    'vendor_selection',v_selection_id,'/procurement/rfqs/'||v_rfq.id
  from public.user_access_assignments uaa
  join public.role_permissions rp on rp.role_id=uaa.role_id
  join public.permissions p on p.id=rp.permission_id and p.code=v_permission
  join public.profiles pr on pr.id=uaa.user_id and pr.is_active and not pr.is_platform_admin
  where uaa.society_id=v_rfq.society_id and uaa.is_active and uaa.wing_id is null
    and uaa.user_id<>p_actor_user_id
    and (uaa.valid_from is null or uaa.valid_from<=now())
    and (uaa.valid_until is null or uaa.valid_until>now());

  insert into public.audit_logs(
    society_id,actor_user_id,action,entity_type,entity_id,new_values,metadata
  ) values (
    v_rfq.society_id,p_actor_user_id,'VENDOR_SELECTION_RECOMMENDED','vendor_selection',v_selection_id::text,
    jsonb_build_object('status','RECOMMENDED','rfq_id',v_rfq.id,'quotation_id',v_quote.id,
      'vendor_id',p_vendor_id,'current_step',v_first_step),
    jsonb_build_object('approval_instance_id',v_instance_id)
  );
  return v_selection_id;
end;
$$;

create or replace function public.decide_vendor_selection_stage(
  p_selection_id uuid,
  p_decision text,
  p_comments text,
  p_actor_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_selection public.vendor_selections%rowtype;
  v_instance public.approval_instances%rowtype;
  v_step public.approval_workflow_steps%rowtype;
  v_next_step integer;
  v_next_permission text;
  v_rfq public.rfqs%rowtype;
  v_quote public.quotations%rowtype;
  v_vendor_name text;
  v_work_order_id uuid;
  v_work_order_number text;
  v_sequence integer;
  v_is_society_admin boolean;
begin
  select * into v_selection from public.vendor_selections where id=p_selection_id for update;
  if not found then raise exception 'vendor_selection_not_found'; end if;
  select * into v_instance from public.approval_instances
  where entity_type='VENDOR_SELECTION' and entity_id=p_selection_id and status='PENDING' for update;
  if not found then raise exception 'vendor_selection_approval_not_pending'; end if;
  select * into v_step from public.approval_workflow_steps
  where workflow_id=v_instance.workflow_id and step_order=v_instance.current_step_order;
  if not found then raise exception 'vendor_selection_approval_step_not_found'; end if;

  if auth.uid() is null or auth.uid()<>p_actor_user_id or public.is_platform_admin()
     or not public.has_permission(v_selection.society_id,v_step.permission_code) then
    raise exception 'vendor_selection_approval_access_denied';
  end if;
  if p_actor_user_id=v_selection.recommended_by then raise exception 'vendor_selection_self_approval_denied'; end if;
  if exists(select 1 from public.approval_decisions where instance_id=v_instance.id and decided_by=p_actor_user_id) then
    raise exception 'vendor_selection_distinct_approver_required';
  end if;
  if p_decision not in ('APPROVED','REJECTED') then raise exception 'invalid_vendor_selection_decision'; end if;
  if p_decision='REJECTED' and nullif(trim(p_comments),'') is null then
    raise exception 'vendor_selection_rejection_reason_required';
  end if;

  select exists(
    select 1 from public.user_access_assignments uaa
    join public.roles r on r.id=uaa.role_id and r.name='Society Admin'
    where uaa.user_id=p_actor_user_id and uaa.society_id=v_selection.society_id
      and uaa.wing_id is null and uaa.is_active
      and (uaa.valid_from is null or uaa.valid_from<=now())
      and (uaa.valid_until is null or uaa.valid_until>now())
  ) into v_is_society_admin;
  if v_step.permission_code='vendor_selection.approve.final' and not v_is_society_admin then
    raise exception 'final_vendor_selection_requires_society_admin';
  end if;

  insert into public.approval_decisions(
    instance_id,workflow_step_id,decision,comments,decided_by,metadata
  ) values (
    v_instance.id,v_step.id,p_decision,nullif(trim(p_comments),''),p_actor_user_id,
    jsonb_build_object('step_order',v_step.step_order,'permission_code',v_step.permission_code)
  );

  if p_decision='REJECTED' then
    update public.approval_instances set status='REJECTED',completed_at=now() where id=v_instance.id;
    update public.vendor_selections set status='REJECTED',decided_by=p_actor_user_id,
      decided_at=now(),decision_comments=trim(p_comments) where id=v_selection.id;
    insert into public.audit_logs(
      society_id,actor_user_id,action,entity_type,entity_id,old_values,new_values,metadata
    ) values (
      v_selection.society_id,p_actor_user_id,'VENDOR_SELECTION_REJECTED','vendor_selection',v_selection.id::text,
      jsonb_build_object('status',v_selection.status),jsonb_build_object('status','REJECTED'),
      jsonb_build_object('step',v_step.step_order,'comments',p_comments)
    );
    if v_selection.recommended_by is not null then
      insert into public.notifications(
        society_id,user_id,notification_type,title,message,entity_type,entity_id,action_url
      ) values (
        v_selection.society_id,v_selection.recommended_by,'VENDOR_SELECTION_REJECTED',
        'Vendor selection rejected','Rejected at '||v_step.name||': '||trim(p_comments),
        'vendor_selection',v_selection.id,'/procurement/rfqs/'||v_selection.rfq_id
      );
    end if;
    return jsonb_build_object('status','REJECTED','step',v_step.step_order);
  end if;

  select min(step_order) into v_next_step from public.approval_workflow_steps
  where workflow_id=v_instance.workflow_id and step_order>v_step.step_order;
  if v_next_step is not null then
    update public.approval_instances set current_step_order=v_next_step where id=v_instance.id;
    select permission_code into v_next_permission from public.approval_workflow_steps
    where workflow_id=v_instance.workflow_id and step_order=v_next_step;
    insert into public.notifications(
      society_id,user_id,notification_type,title,message,entity_type,entity_id,action_url
    )
    select distinct v_selection.society_id,uaa.user_id,'VENDOR_SELECTION_APPROVAL',
      'Vendor selection approval required','Approval stage '||v_next_step||' is ready.',
      'vendor_selection',v_selection.id,'/procurement/rfqs/'||v_selection.rfq_id
    from public.user_access_assignments uaa
    join public.role_permissions rp on rp.role_id=uaa.role_id
    join public.permissions p on p.id=rp.permission_id and p.code=v_next_permission
    join public.profiles pr on pr.id=uaa.user_id and pr.is_active and not pr.is_platform_admin
    where uaa.society_id=v_selection.society_id and uaa.is_active and uaa.wing_id is null
      and uaa.user_id<>p_actor_user_id
      and (uaa.valid_from is null or uaa.valid_from<=now())
      and (uaa.valid_until is null or uaa.valid_until>now());
    insert into public.audit_logs(
      society_id,actor_user_id,action,entity_type,entity_id,new_values,metadata
    ) values (
      v_selection.society_id,p_actor_user_id,'VENDOR_SELECTION_STAGE_APPROVED','vendor_selection',v_selection.id::text,
      jsonb_build_object('status','RECOMMENDED','current_step',v_next_step),
      jsonb_build_object('completed_step',v_step.step_order,'comments',p_comments)
    );
    return jsonb_build_object('status','PENDING','completedStep',v_step.step_order,'currentStep',v_next_step);
  end if;

  if not v_is_society_admin then raise exception 'final_vendor_selection_requires_society_admin'; end if;
  select * into v_rfq from public.rfqs where id=v_selection.rfq_id for update;
  select * into v_quote from public.quotations where id=v_selection.quotation_id for update;
  select name into v_vendor_name from public.vendors
  where id=v_selection.vendor_id and society_id=v_selection.society_id;
  if v_rfq.status not in ('PUBLISHED','EVALUATION') or v_quote.status not in ('SUBMITTED','UNDER_EVALUATION') then
    raise exception 'vendor_selection_source_state_changed';
  end if;

  v_sequence:=public.get_next_sequence(v_selection.society_id,'WORK_ORDER',extract(year from current_date)::integer,null);
  v_work_order_number:='WO-'||extract(year from current_date)::integer||'-'||lpad(v_sequence::text,3,'0');
  insert into public.procurement_work_orders(
    society_id,work_order_number,title,vendor_id,rfq_id,amount,status,description,created_by,
    metadata
  ) values (
    v_selection.society_id,v_work_order_number,v_rfq.title,v_selection.vendor_id,v_rfq.id,
    v_quote.total_amount,'ISSUED',v_rfq.description,p_actor_user_id,
    jsonb_build_object('selection_id',v_selection.id,'quotation_id',v_quote.id)
  ) returning id into v_work_order_id;

  update public.vendor_selections set status='APPROVED',decided_by=p_actor_user_id,
    decided_at=now(),decision_comments=nullif(trim(p_comments),'') where id=v_selection.id;
  update public.approval_instances set status='APPROVED',completed_at=now() where id=v_instance.id;
  update public.quotations set status=case when id=v_quote.id then 'SELECTED' else 'REJECTED' end
  where rfq_id=v_rfq.id and status in ('SUBMITTED','UNDER_EVALUATION');
  update public.rfqs set status='AWARDED',awarded_vendor=v_vendor_name where id=v_rfq.id;

  insert into public.notifications(
    society_id,user_id,notification_type,title,message,entity_type,entity_id,action_url
  )
  select distinct v_selection.society_id,vu.user_id,'WORK_ORDER_ISSUED',
    'Work order issued: '||v_work_order_number,v_rfq.title,'procurement_work_order',v_work_order_id,
    '/vendor'
  from public.vendor_users vu
  where vu.society_id=v_selection.society_id and vu.vendor_id=v_selection.vendor_id and vu.is_active;
  insert into public.audit_logs(
    society_id,actor_user_id,action,entity_type,entity_id,old_values,new_values,metadata
  ) values (
    v_selection.society_id,p_actor_user_id,'VENDOR_SELECTED','vendor_selection',v_selection.id::text,
    jsonb_build_object('status',v_selection.status),jsonb_build_object('status','APPROVED',
      'work_order_id',v_work_order_id,'work_order_number',v_work_order_number),
    jsonb_build_object('final_step',v_step.step_order,'comments',p_comments)
  );
  return jsonb_build_object('status','APPROVED','completedStep',v_step.step_order,
    'workOrderId',v_work_order_id,'workOrderNumber',v_work_order_number);
end;
$$;

-- Force callers through the transactional functions. Read access remains
-- governed by RLS; direct operational mutations are removed from clients.
revoke insert,update,delete on public.vendor_selections from authenticated;
revoke insert,update,delete on public.approval_instances from authenticated;
revoke insert,update,delete on public.approval_decisions from authenticated;

revoke all on function public.publish_rfq_atomic(uuid,uuid[],uuid) from public,anon;
revoke all on function public.submit_vendor_quotation_atomic(uuid,uuid,jsonb,integer,integer,text,text,text,uuid) from public,anon;
revoke all on function public.evaluate_quotation_atomic(uuid,numeric,numeric,numeric,text,text,uuid) from public,anon;
revoke all on function public.recommend_vendor_selection_atomic(uuid,uuid,uuid,text,uuid) from public,anon;
revoke all on function public.decide_vendor_selection_stage(uuid,text,text,uuid) from public,anon;
grant execute on function public.publish_rfq_atomic(uuid,uuid[],uuid) to authenticated;
grant execute on function public.submit_vendor_quotation_atomic(uuid,uuid,jsonb,integer,integer,text,text,text,uuid) to authenticated;
grant execute on function public.evaluate_quotation_atomic(uuid,numeric,numeric,numeric,text,text,uuid) to authenticated;
grant execute on function public.recommend_vendor_selection_atomic(uuid,uuid,uuid,text,uuid) to authenticated;
grant execute on function public.decide_vendor_selection_stage(uuid,text,text,uuid) to authenticated;
grant execute on function public.publish_rfq_atomic(uuid,uuid[],uuid) to service_role;
grant execute on function public.submit_vendor_quotation_atomic(uuid,uuid,jsonb,integer,integer,text,text,text,uuid) to service_role;
grant execute on function public.evaluate_quotation_atomic(uuid,numeric,numeric,numeric,text,text,uuid) to service_role;
grant execute on function public.recommend_vendor_selection_atomic(uuid,uuid,uuid,text,uuid) to service_role;
grant execute on function public.decide_vendor_selection_stage(uuid,text,text,uuid) to service_role;
