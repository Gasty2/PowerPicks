create schema if not exists powerpicks_ingest;

create extension if not exists pgcrypto with schema extensions;

create or replace function powerpicks_ingest.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists powerpicks_ingest.data_sources (
  slug text primary key,
  name text not null,
  source_kind text not null check (source_kind in ('bulk_csv', 'official_calendar', 'official_invitation', 'live_results', 'nomination', 'results_archive', 'api', 'manual')),
  trust_tier text not null check (trust_tier in ('official', 'community', 'partner', 'internal')),
  base_url text not null,
  license_note text,
  terms_note text,
  automated_ingestion_allowed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists powerpicks_ingest.import_batches (
  id uuid primary key default gen_random_uuid(),
  data_source_slug text not null references powerpicks_ingest.data_sources(slug),
  import_kind text not null check (import_kind in ('openpowerlifting_bulk_csv', 'openipf_bulk_csv', 'official_calendar_snapshot', 'official_invitation_snapshot', 'goodlift_nomination_snapshot', 'manual_seed')),
  status text not null default 'pending' check (status in ('pending', 'running', 'succeeded', 'failed', 'voided')),
  source_url text not null,
  source_revision text,
  source_updated_at timestamptz,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  row_count integer check (row_count is null or row_count >= 0),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists powerpicks_ingest.opl_meets_raw (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null references powerpicks_ingest.import_batches(id) on delete cascade,
  meet_key text not null,
  federation text,
  parent_federation text,
  date date,
  meet_country text,
  meet_state text,
  meet_town text,
  meet_name text,
  sanctioned text,
  source_path text,
  raw_row jsonb not null,
  created_at timestamptz not null default now(),
  unique (import_batch_id, meet_key)
);

create table if not exists powerpicks_ingest.opl_entries_raw (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid not null references powerpicks_ingest.import_batches(id) on delete cascade,
  meet_key text not null,
  entry_index integer not null,
  lifter_name text,
  sex text,
  equipment text,
  age numeric,
  age_class text,
  division text,
  bodyweight_kg numeric,
  weight_class_kg text,
  squat1_kg numeric,
  squat2_kg numeric,
  squat3_kg numeric,
  best3_squat_kg numeric,
  bench1_kg numeric,
  bench2_kg numeric,
  bench3_kg numeric,
  best3_bench_kg numeric,
  deadlift1_kg numeric,
  deadlift2_kg numeric,
  deadlift3_kg numeric,
  best3_deadlift_kg numeric,
  total_kg numeric,
  place text,
  dots numeric,
  goodlift numeric,
  tested text,
  country text,
  raw_row jsonb not null,
  created_at timestamptz not null default now(),
  unique (import_batch_id, meet_key, entry_index)
);

create table if not exists public.official_competitions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  federation text not null,
  parent_federation text,
  competition_type text not null default 'powerlifting' check (competition_type in ('powerlifting', 'bench_press', 'deadlift', 'other')),
  equipment text not null default 'classic' check (equipment in ('classic', 'equipped', 'single_ply', 'multi_ply', 'raw', 'unknown')),
  division text,
  location_city text,
  location_region text,
  location_country text not null,
  start_date date not null,
  end_date date,
  status text not null default 'upcoming' check (status in ('upcoming', 'live', 'complete', 'archived', 'cancelled')),
  official_source_url text not null,
  live_source_url text,
  results_source_url text,
  source_confidence text not null default 'official' check (source_confidence in ('official', 'linked', 'community', 'manual')),
  source_notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint official_competitions_date_order check (end_date is null or end_date >= start_date)
);

create table if not exists public.official_source_links (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.official_competitions(id) on delete cascade,
  source_slug text not null,
  source_kind text not null check (source_kind in ('calendar', 'invitation', 'nomination', 'live', 'results', 'bulk_csv', 'rules', 'other')),
  label text not null,
  url text not null,
  automated_ingestion_allowed boolean not null default false,
  extraction_policy text not null default 'link_only' check (extraction_policy in ('link_only', 'manual_review', 'scheduled_import', 'api_allowed')),
  last_checked_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  unique (competition_id, url)
);

create index if not exists import_batches_data_source_idx on powerpicks_ingest.import_batches(data_source_slug);
create index if not exists opl_meets_raw_meet_key_idx on powerpicks_ingest.opl_meets_raw(meet_key);
create index if not exists opl_entries_raw_meet_key_idx on powerpicks_ingest.opl_entries_raw(meet_key);
create index if not exists opl_entries_raw_lifter_name_idx on powerpicks_ingest.opl_entries_raw(lifter_name);
create index if not exists official_competitions_dates_idx on public.official_competitions(start_date, end_date);
create index if not exists official_competitions_status_idx on public.official_competitions(status);
create index if not exists official_source_links_competition_idx on public.official_source_links(competition_id);

alter table powerpicks_ingest.data_sources enable row level security;
alter table powerpicks_ingest.import_batches enable row level security;
alter table powerpicks_ingest.opl_meets_raw enable row level security;
alter table powerpicks_ingest.opl_entries_raw enable row level security;
alter table public.official_competitions enable row level security;
alter table public.official_source_links enable row level security;

drop trigger if exists set_data_sources_updated_at on powerpicks_ingest.data_sources;
create trigger set_data_sources_updated_at
before update on powerpicks_ingest.data_sources
for each row execute function powerpicks_ingest.set_updated_at();

drop trigger if exists set_import_batches_updated_at on powerpicks_ingest.import_batches;
create trigger set_import_batches_updated_at
before update on powerpicks_ingest.import_batches
for each row execute function powerpicks_ingest.set_updated_at();

drop trigger if exists set_official_competitions_updated_at on public.official_competitions;
create trigger set_official_competitions_updated_at
before update on public.official_competitions
for each row execute function powerpicks_ingest.set_updated_at();

revoke all on schema powerpicks_ingest from public;
revoke all on all tables in schema powerpicks_ingest from public, anon, authenticated;
grant usage on schema powerpicks_ingest to service_role;
grant all privileges on all tables in schema powerpicks_ingest to service_role;
grant all privileges on all sequences in schema powerpicks_ingest to service_role;
grant execute on function powerpicks_ingest.set_updated_at() to service_role;

revoke all on table public.official_competitions from anon, authenticated;
revoke all on table public.official_source_links from anon, authenticated;
grant select on table public.official_competitions to anon, authenticated;
grant select on table public.official_source_links to anon, authenticated;
grant all privileges on table public.official_competitions to service_role;
grant all privileges on table public.official_source_links to service_role;

drop policy if exists "Public can read official competitions" on public.official_competitions;
create policy "Public can read official competitions"
on public.official_competitions
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read official source links" on public.official_source_links;
create policy "Public can read official source links"
on public.official_source_links
for select
to anon, authenticated
using (true);

insert into powerpicks_ingest.data_sources (
  slug,
  name,
  source_kind,
  trust_tier,
  base_url,
  license_note,
  terms_note,
  automated_ingestion_allowed,
  notes
)
values
  (
    'openpowerlifting-bulk-csv',
    'OpenPowerlifting Bulk CSV',
    'bulk_csv',
    'community',
    'https://openpowerlifting.gitlab.io/opl-csv/bulk-csv.html',
    'Use OpenPowerlifting data under its published project terms and attribution requirements.',
    'Nightly historical results feed; not a live scoring source.',
    true,
    'Primary retrospective trial dataset for historical prediction market backtesting.'
  ),
  (
    'openipf-bulk-csv',
    'OpenPowerlifting OpenIPF Bulk CSV',
    'bulk_csv',
    'community',
    'https://openpowerlifting.gitlab.io/opl-csv/bulk-csv.html',
    'Use OpenPowerlifting data under its published project terms and attribution requirements.',
    'IPF-affiliate subset of the OpenPowerlifting bulk CSV feed.',
    true,
    'Useful for IPF-specific trials before importing the full OpenPowerlifting corpus.'
  ),
  (
    'ipf-calendar',
    'IPF Championship Calendar',
    'official_calendar',
    'official',
    'https://www.powerlifting.sport/championships/calendar',
    null,
    'Official schedule source; capture links and metadata for manual review before automation.',
    false,
    'Upcoming competition source of truth.'
  ),
  (
    'ipf-invitation-pdf',
    'IPF Official Invitation PDF',
    'official_invitation',
    'official',
    'https://www.powerlifting.sport/fileadmin/ipf/data/championships/informations/2026/classic-powerlifting/lithuania/2026_Invitation_IPF_World_Classic_Open_Powerlifting_Championships__Lithuania-05.pdf',
    null,
    'Official PDF; retain as source link and parse only reviewed fields.',
    false,
    'Confirms host city, dates, and federation invitation details for the 2026 World Classic Open.'
  ),
  (
    'goodlift-nominations',
    'Goodlift Nominations and Live Listings',
    'nomination',
    'official',
    'https://goodlift.info/onenomination.php?cid=1171',
    null,
    'Link-only until an explicit permission/API path is confirmed for automated extraction.',
    false,
    'Official-adjacent IPF nominations/live scoring link for user-facing source attribution.'
  )
on conflict (slug) do update set
  name = excluded.name,
  source_kind = excluded.source_kind,
  trust_tier = excluded.trust_tier,
  base_url = excluded.base_url,
  license_note = excluded.license_note,
  terms_note = excluded.terms_note,
  automated_ingestion_allowed = excluded.automated_ingestion_allowed,
  notes = excluded.notes;

insert into public.official_competitions (
  slug,
  name,
  federation,
  parent_federation,
  competition_type,
  equipment,
  division,
  location_city,
  location_country,
  start_date,
  end_date,
  status,
  official_source_url,
  live_source_url,
  source_confidence,
  source_notes,
  metadata
)
values (
  'ipf-world-classic-open-2026',
  'IPF 2026 World Classic Open Powerlifting Championships',
  'IPF',
  'IPF',
  'powerlifting',
  'classic',
  'Open',
  'Druskininkai',
  'Lithuania',
  date '2026-06-13',
  date '2026-06-21',
  'upcoming',
  'https://www.powerlifting.sport/fileadmin/ipf/data/championships/informations/2026/classic-powerlifting/lithuania/2026_Invitation_IPF_World_Classic_Open_Powerlifting_Championships__Lithuania-05.pdf',
  'https://goodlift.info/onenomination.php?cid=1171',
  'official',
  'Seeded from official IPF invitation and Goodlift nomination listing checked on 2026-06-09. No real-money or prize mechanics are represented by these source records.',
  '{"trialMarketIdeas":["total threshold","successful attempt sweep","world record attempt","team points milestone"],"freeToPlayOnly":true}'::jsonb
)
on conflict (slug) do update set
  name = excluded.name,
  federation = excluded.federation,
  parent_federation = excluded.parent_federation,
  competition_type = excluded.competition_type,
  equipment = excluded.equipment,
  division = excluded.division,
  location_city = excluded.location_city,
  location_country = excluded.location_country,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  status = excluded.status,
  official_source_url = excluded.official_source_url,
  live_source_url = excluded.live_source_url,
  source_confidence = excluded.source_confidence,
  source_notes = excluded.source_notes,
  metadata = excluded.metadata;

with target_competition as (
  select id from public.official_competitions where slug = 'ipf-world-classic-open-2026'
)
insert into public.official_source_links (
  competition_id,
  source_slug,
  source_kind,
  label,
  url,
  automated_ingestion_allowed,
  extraction_policy,
  last_checked_at,
  notes
)
select
  target_competition.id,
  source_link.source_slug,
  source_link.source_kind,
  source_link.label,
  source_link.url,
  source_link.automated_ingestion_allowed,
  source_link.extraction_policy,
  now(),
  source_link.notes
from target_competition
cross join (
  values
    (
      'ipf-invitation-pdf',
      'invitation',
      'Official invitation PDF',
      'https://www.powerlifting.sport/fileadmin/ipf/data/championships/informations/2026/classic-powerlifting/lithuania/2026_Invitation_IPF_World_Classic_Open_Powerlifting_Championships__Lithuania-05.pdf',
      false,
      'manual_review',
      'Confirms event title, city, and June 2026 dates.'
    ),
    (
      'ipf-calendar',
      'calendar',
      'IPF calendar',
      'https://www.powerlifting.sport/championships/calendar',
      false,
      'manual_review',
      'Official calendar source for upcoming championship status.'
    ),
    (
      'goodlift-nominations',
      'nomination',
      'Goodlift nomination listing',
      'https://goodlift.info/onenomination.php?cid=1171',
      false,
      'link_only',
      'Use as a linked source until automated extraction permission/API is confirmed.'
    ),
    (
      'openipf-bulk-csv',
      'bulk_csv',
      'OpenIPF historical bulk CSV',
      'https://openpowerlifting.gitlab.io/opl-csv/bulk-csv.html',
      true,
      'scheduled_import',
      'Historical IPF-affiliate results feed for trials and backtesting.'
    )
) as source_link(source_slug, source_kind, label, url, automated_ingestion_allowed, extraction_policy, notes)
on conflict (competition_id, url) do update set
  source_slug = excluded.source_slug,
  source_kind = excluded.source_kind,
  label = excluded.label,
  automated_ingestion_allowed = excluded.automated_ingestion_allowed,
  extraction_policy = excluded.extraction_policy,
  last_checked_at = excluded.last_checked_at,
  notes = excluded.notes;
