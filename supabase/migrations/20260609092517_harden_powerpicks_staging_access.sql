drop policy if exists "Service role can manage data sources" on powerpicks_ingest.data_sources;
create policy "Service role can manage data sources"
on powerpicks_ingest.data_sources
for all
to service_role
using (true)
with check (true);

drop policy if exists "Service role can manage import batches" on powerpicks_ingest.import_batches;
create policy "Service role can manage import batches"
on powerpicks_ingest.import_batches
for all
to service_role
using (true)
with check (true);

drop policy if exists "Service role can manage OPL meets raw" on powerpicks_ingest.opl_meets_raw;
create policy "Service role can manage OPL meets raw"
on powerpicks_ingest.opl_meets_raw
for all
to service_role
using (true)
with check (true);

drop policy if exists "Service role can manage OPL entries raw" on powerpicks_ingest.opl_entries_raw;
create policy "Service role can manage OPL entries raw"
on powerpicks_ingest.opl_entries_raw
for all
to service_role
using (true)
with check (true);

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;
