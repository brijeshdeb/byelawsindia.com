-- Preserve existing demo applications while attaching the new checklist,
-- history and approval workflow records.
insert into public.application_checklist_items(society_id,application_id,item_code,label,is_required,status,sort_order)
select a.society_id,a.id,m.code,m.label,true,
  case when a.status='APPROVED' then 'VERIFIED' else 'PENDING' end,m.sort_order
from public.member_applications a join public.master_data_items m
  on m.category='MEMBER_DOCUMENT_TYPE' and m.society_id is null and m.is_active
where case a.application_type
  when 'MEMBERSHIP' then m.code in ('APPLICATION_FORM','PHOTO_ID','ADDRESS_PROOF','OWNERSHIP_PROOF','PHOTOGRAPH','NOMINATION_FORM')
  else m.code in ('APPLICATION_FORM','PHOTO_ID') end
on conflict(application_id,item_code) do nothing;

insert into public.approval_instances(society_id,workflow_id,entity_type,entity_id,status,current_step_order,submitted_by,submitted_at,completed_at)
select a.society_id,w.id,'MEMBER_APPLICATION',a.id,
  case when a.status='APPROVED' then 'APPROVED' when a.status='REJECTED' then 'REJECTED' when a.status='WITHDRAWN' then 'CANCELLED' else 'PENDING' end,
  case when a.status='APPROVED' then 3 else 1 end,a.created_by,coalesce(a.submitted_at,a.created_at),
  case when a.status in ('APPROVED','REJECTED','WITHDRAWN') then a.updated_at else null end
from public.member_applications a cross join lateral (
 select id from public.approval_workflows where workflow_key='MEMBER_APPLICATION_3_LEVEL' and society_id is null and is_active order by version desc limit 1
) w
on conflict(workflow_id,entity_type,entity_id) do nothing;

insert into public.application_status_history(society_id,application_id,from_status,to_status,comments,changed_by,changed_at,metadata)
select a.society_id,a.id,null,a.status,'Existing application attached to the configurable workflow.',a.created_by,coalesce(a.submitted_at,a.created_at),'{"backfilled":true}'::jsonb
from public.member_applications a
where not exists(select 1 from public.application_status_history h where h.application_id=a.id);
