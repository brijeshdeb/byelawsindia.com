-- Private tenant-scoped object storage for society and vendor documents.

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('society-documents','society-documents',false,20971520,
  array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','image/png','image/jpeg'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create or replace function public.storage_path_uuid(p_path text,p_position integer)
returns uuid language plpgsql immutable set search_path=public,pg_temp as $$
begin return nullif(split_part(p_path,'/',p_position),'')::uuid;
exception when invalid_text_representation then return null;
end;
$$;
revoke all on function public.storage_path_uuid(text,integer) from public,anon;
grant execute on function public.storage_path_uuid(text,integer) to authenticated;

drop policy if exists "society_documents_storage_read" on storage.objects;
drop policy if exists "society_documents_storage_insert" on storage.objects;
drop policy if exists "society_documents_storage_update" on storage.objects;
drop policy if exists "society_documents_storage_delete" on storage.objects;

create policy "society_documents_storage_read" on storage.objects for select to authenticated using(
  bucket_id='society-documents'
  and public.can_access_society(public.storage_path_uuid(name,1))
  and (
    not public.is_vendor_user(public.storage_path_uuid(name,1))
    or (
      split_part(name,'/',2)='vendors'
      and public.can_access_vendor(public.storage_path_uuid(name,1),public.storage_path_uuid(name,3))
    )
  )
);

create policy "society_documents_storage_insert" on storage.objects for insert to authenticated with check(
  bucket_id='society-documents'
  and (
    public.has_permission(public.storage_path_uuid(name,1),'document.upload')
    or (
      split_part(name,'/',2)='vendors'
      and public.can_access_vendor(public.storage_path_uuid(name,1),public.storage_path_uuid(name,3))
      and public.has_permission(public.storage_path_uuid(name,1),'vendor.portal')
    )
  )
);

create policy "society_documents_storage_update" on storage.objects for update to authenticated using(
  bucket_id='society-documents' and public.has_permission(public.storage_path_uuid(name,1),'document.verify')
) with check(
  bucket_id='society-documents' and public.has_permission(public.storage_path_uuid(name,1),'document.verify')
);

create policy "society_documents_storage_delete" on storage.objects for delete to authenticated using(
  bucket_id='society-documents' and public.has_permission(public.storage_path_uuid(name,1),'document.verify')
);
