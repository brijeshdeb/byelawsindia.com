-- Atomic member-application document attachment and checklist replacement flow.

create or replace function public.attach_application_document(
  p_checklist_item_id uuid,
  p_storage_path text,
  p_file_name text,
  p_file_size_bytes bigint,
  p_mime_type text,
  p_checksum_sha256 text,
  p_actor_user_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_item public.application_checklist_items%rowtype;
  v_application public.member_applications%rowtype;
  v_previous public.society_documents%rowtype;
  v_wing_id uuid;
  v_document_id uuid;
  v_document_number text;
  v_version integer := 1;
  v_sequence integer;
begin
  if auth.uid() is null or auth.uid() <> p_actor_user_id then
    raise exception 'application_document_access_denied';
  end if;

  select * into v_item
  from public.application_checklist_items
  where id = p_checklist_item_id
  for update;
  if not found then raise exception 'checklist_item_not_found'; end if;

  select * into v_application
  from public.member_applications
  where id = v_item.application_id and society_id = v_item.society_id;
  if not found then raise exception 'application_not_found'; end if;

  select u.wing_id into v_wing_id
  from public.units u
  where u.id = v_application.unit_id and u.society_id = v_application.society_id;

  if not public.has_permission(v_application.society_id, 'document.upload', v_wing_id)
     or not public.can_access_wing(v_application.society_id, v_wing_id) then
    raise exception 'application_document_access_denied';
  end if;

  if v_application.status in ('APPROVED', 'REJECTED', 'WITHDRAWN') then
    raise exception 'application_document_upload_closed';
  end if;

  if p_storage_path not like
     v_application.society_id::text || '/applications/' || v_application.id::text || '/' || v_item.id::text || '/%' then
    raise exception 'invalid_application_storage_path';
  end if;
  if p_file_size_bytes <= 0 or p_file_size_bytes > 20971520 then
    raise exception 'invalid_application_file_size';
  end if;
  if p_mime_type not in (
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg'
  ) then
    raise exception 'invalid_application_file_type';
  end if;
  if p_checksum_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_application_checksum';
  end if;

  if v_item.document_id is not null then
    select * into v_previous
    from public.society_documents
    where id = v_item.document_id and society_id = v_application.society_id
    for update;
  end if;

  if v_previous.id is not null then
    v_document_number := v_previous.document_number;
    v_version := v_previous.version + 1;
    update public.society_documents
    set status = 'REPLACED', is_verified = false
    where id = v_previous.id;
  else
    v_sequence := public.get_next_sequence(
      v_application.society_id,
      'APPLICATION_DOCUMENT',
      extract(year from current_date)::integer,
      null
    );
    v_document_number := 'ADOC-' || extract(year from current_date)::integer || '-' || lpad(v_sequence::text, 4, '0');
  end if;

  insert into public.society_documents (
    society_id, title, category, description, file_name, file_size_bytes,
    mime_type, storage_path, metadata, uploaded_by, document_number, status,
    version, wing_id, replaces_document_id, classification, checksum_sha256
  ) values (
    v_application.society_id,
    v_item.label || ' - ' || v_application.application_number,
    'LEGAL',
    'Application checklist evidence for ' || v_application.application_number,
    nullif(trim(p_file_name), ''),
    p_file_size_bytes,
    p_mime_type,
    p_storage_path,
    jsonb_build_object(
      'application_id', v_application.id,
      'checklist_item_id', v_item.id,
      'checklist_item_code', v_item.item_code
    ),
    p_actor_user_id,
    v_document_number,
    'UPLOADED',
    v_version,
    v_wing_id,
    v_previous.id,
    'CONFIDENTIAL',
    p_checksum_sha256
  ) returning id into v_document_id;

  update public.application_checklist_items
  set document_id = v_document_id,
      status = 'UPLOADED',
      remarks = case
        when v_previous.id is null then 'Signed/supporting document uploaded.'
        else 'Replacement document uploaded; verification required.'
      end,
      verified_by = null,
      verified_at = null
  where id = v_item.id;

  insert into public.audit_logs (
    society_id, wing_id, actor_user_id, action, entity_type, entity_id,
    new_values, metadata
  ) values (
    v_application.society_id,
    v_wing_id,
    p_actor_user_id,
    'APPLICATION_DOCUMENT_UPLOADED',
    'society_document',
    v_document_id::text,
    jsonb_build_object(
      'applicationId', v_application.id,
      'checklistItemId', v_item.id,
      'documentNumber', v_document_number,
      'version', v_version
    ),
    jsonb_build_object('replacesDocumentId', v_previous.id)
  );

  return v_document_id;
end;
$$;

revoke all on function public.attach_application_document(uuid,text,text,bigint,text,text,uuid)
from public, anon;
grant execute on function public.attach_application_document(uuid,text,text,bigint,text,text,uuid)
to authenticated;

create or replace function public.review_application_checklist_item(
  p_item_id uuid,
  p_status text,
  p_remarks text,
  p_actor_user_id uuid
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_item public.application_checklist_items%rowtype;
  v_document public.society_documents%rowtype;
begin
  select * into v_item
  from public.application_checklist_items
  where id = p_item_id
  for update;
  if not found then raise exception 'checklist_item_not_found'; end if;
  if auth.uid() is null
     or auth.uid() <> p_actor_user_id
     or not public.has_permission(v_item.society_id, 'application.verify') then
    raise exception 'application_access_denied';
  end if;
  if p_status not in ('PENDING', 'UPLOADED', 'VERIFIED', 'REJECTED', 'NOT_APPLICABLE') then
    raise exception 'invalid_checklist_status';
  end if;
  if p_status = 'NOT_APPLICABLE' and v_item.is_required then
    raise exception 'required_item_cannot_be_not_applicable';
  end if;
  if p_status in ('VERIFIED', 'REJECTED') then
    if v_item.document_id is null then raise exception 'checklist_document_required'; end if;
    select * into v_document
    from public.society_documents
    where id = v_item.document_id and society_id = v_item.society_id
    for update;
    if not found or v_document.status in ('REPLACED', 'ARCHIVED', 'EXPIRED') then
      raise exception 'checklist_document_unavailable';
    end if;
    update public.society_documents
    set status = case when p_status = 'VERIFIED' then 'VERIFIED' else 'REJECTED' end,
        is_verified = p_status = 'VERIFIED',
        verified_by = case when p_status = 'VERIFIED' then p_actor_user_id else null end,
        verified_at = case when p_status = 'VERIFIED' then now() else null end,
        rejection_reason = case when p_status = 'REJECTED' then nullif(trim(p_remarks), '') else null end
    where id = v_document.id;
  end if;
  if p_status = 'REJECTED' and nullif(trim(p_remarks), '') is null then
    raise exception 'rejection_reason_required';
  end if;

  update public.application_checklist_items
  set status = p_status,
      remarks = nullif(trim(p_remarks), ''),
      verified_by = case when p_status in ('VERIFIED', 'REJECTED') then p_actor_user_id else null end,
      verified_at = case when p_status in ('VERIFIED', 'REJECTED') then now() else null end
  where id = p_item_id;

  insert into public.audit_logs (
    society_id, actor_user_id, action, entity_type, entity_id, old_values, new_values
  ) values (
    v_item.society_id,
    p_actor_user_id,
    case
      when p_status = 'VERIFIED' then 'DOCUMENT_VERIFIED'
      when p_status = 'REJECTED' then 'DOCUMENT_REJECTED'
      else 'APPLICATION_CHECKLIST_UPDATED'
    end,
    'application_checklist_item',
    v_item.id::text,
    jsonb_build_object('status', v_item.status),
    jsonb_build_object('status', p_status, 'documentId', v_item.document_id, 'remarks', nullif(trim(p_remarks), ''))
  );
end;
$$;

revoke all on function public.review_application_checklist_item(uuid,text,text,uuid)
from public, anon;
grant execute on function public.review_application_checklist_item(uuid,text,text,uuid)
to authenticated;

drop policy if exists "society_documents_storage_insert" on storage.objects;
create policy "society_documents_storage_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'society-documents'
  and (
    (
      public.has_permission(public.storage_path_uuid(name, 1), 'document.upload')
      and split_part(name, '/', 2) <> 'vendors'
    )
    or (
      split_part(name, '/', 2) = 'vendors'
      and public.can_access_vendor(public.storage_path_uuid(name, 1), public.storage_path_uuid(name, 3))
      and public.has_permission(public.storage_path_uuid(name, 1), 'vendor.portal')
    )
  )
);

drop policy if exists "society_documents_storage_delete" on storage.objects;
create policy "society_documents_storage_delete"
on storage.objects for delete to authenticated
using (
  bucket_id = 'society-documents'
  and public.can_access_society(public.storage_path_uuid(name, 1))
  and (
    public.has_permission(public.storage_path_uuid(name, 1), 'document.verify')
    or owner_id = (select auth.uid())::text
  )
);
