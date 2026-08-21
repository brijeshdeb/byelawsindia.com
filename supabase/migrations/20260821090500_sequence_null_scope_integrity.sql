-- PostgreSQL UNIQUE treats NULL values as distinct. Number sequences are often
-- society-wide (wing_code NULL), so enforce one row per effective scope and
-- make allocation safe for concurrent callers.

update public.document_number_sequences
set wing_code=null
where wing_code is not null and trim(wing_code)='';

with ranked as (
  select id,
    row_number() over (
      partition by society_id,sequence_type,year,coalesce(wing_code,'')
      order by last_sequence desc,created_at desc,id
    ) as position
  from public.document_number_sequences
)
delete from public.document_number_sequences sequence
using ranked
where sequence.id=ranked.id and ranked.position>1;

create unique index if not exists document_number_sequences_effective_scope_idx
  on public.document_number_sequences(society_id,sequence_type,year,coalesce(wing_code,''));

create or replace function public.get_next_sequence(
  p_society_id uuid,
  p_sequence_type text,
  p_year integer,
  p_wing_code text default null
) returns integer
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  v_next integer;
  v_wing_code text:=nullif(trim(p_wing_code),'');
begin
  if p_society_id is null or nullif(trim(p_sequence_type),'') is null or p_year not between 2000 and 2200 then
    raise exception 'invalid_sequence_scope';
  end if;

  insert into public.document_number_sequences(society_id,sequence_type,year,wing_code,last_sequence)
  values(p_society_id,upper(trim(p_sequence_type)),p_year,v_wing_code,0)
  on conflict do nothing;

  update public.document_number_sequences
  set last_sequence=last_sequence+1
  where society_id=p_society_id
    and sequence_type=upper(trim(p_sequence_type))
    and year=p_year
    and wing_code is not distinct from v_wing_code
  returning last_sequence into strict v_next;

  return v_next;
end;
$$;

revoke all on function public.get_next_sequence(uuid,text,integer,text) from public,anon;
grant execute on function public.get_next_sequence(uuid,text,integer,text) to authenticated,service_role;
