-- Prevent metadata rows from referencing missing or foreign-owned private objects.

create or replace function public.enforce_society_document_storage_integrity()
returns trigger
language plpgsql
security definer
set search_path = public, storage, pg_temp
as $$
begin
  if new.storage_path is null then return new; end if;

  if not exists (
    select 1
    from storage.objects object
    where object.bucket_id = 'society-documents'
      and object.name = new.storage_path
      and (
        auth.uid() is null
        or object.owner_id = auth.uid()::text
      )
  ) then
    raise exception 'document_storage_object_missing_or_not_owned';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_society_document_storage_integrity()
from public, anon, authenticated;

drop trigger if exists trg_society_document_storage_integrity
on public.society_documents;
create trigger trg_society_document_storage_integrity
before insert or update of storage_path on public.society_documents
for each row execute function public.enforce_society_document_storage_integrity();
