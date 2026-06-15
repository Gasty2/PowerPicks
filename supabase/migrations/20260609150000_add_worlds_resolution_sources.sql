create table if not exists public.market_resolution_sources (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.official_competitions(id) on delete cascade,
  source_role text not null check (source_role in ('nominations', 'live_results', 'video_review', 'official_results', 'manual_settlement')),
  label text not null,
  url text not null,
  automation_level text not null check (automation_level in ('manual', 'semi_automated', 'api_candidate', 'link_only')),
  settlement_use text not null,
  requires_admin_review boolean not null default true,
  created_at timestamptz not null default now(),
  unique (competition_id, source_role, url)
);

create index if not exists market_resolution_sources_competition_idx on public.market_resolution_sources(competition_id);
create index if not exists market_resolution_sources_role_idx on public.market_resolution_sources(source_role);

alter table public.market_resolution_sources enable row level security;

revoke all on table public.market_resolution_sources from anon, authenticated;
grant select on table public.market_resolution_sources to anon, authenticated;
grant all privileges on table public.market_resolution_sources to service_role;

drop policy if exists "Public can read market resolution sources" on public.market_resolution_sources;
create policy "Public can read market resolution sources"
on public.market_resolution_sources
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
    'goodlift-nominations-men',
    'Goodlift Men''s Nominations',
    'nomination',
    'official',
    'https://goodlift.info/onenomination.php?cid=1171',
    null,
    'Use as athlete-entry source for men''s Worlds markets after manual review.',
    false,
    'Names/classes for athlete-specific markets should come from this event nomination source, not invented placeholder lifters.'
  ),
  (
    'goodlift-nominations-women',
    'Goodlift Women''s Nominations',
    'nomination',
    'official',
    'https://goodlift.info/onenomination.php?cid=1170',
    null,
    'Use as athlete-entry source for women''s Worlds markets after manual review.',
    false,
    'Names/classes for athlete-specific markets should come from this event nomination source, not invented placeholder lifters.'
  ),
  (
    'liftingcast-live',
    'LiftingCast Live Data',
    'live_results',
    'partner',
    'https://liftingcast.com/',
    null,
    'Use only for live result fields exposed for the event, with official IPF results as final authority.',
    false,
    'Candidate source for attempts, totals, ranks, and result milestones when an event feed exists.'
  ),
  (
    'ipf-youtube-livestream',
    'IPF YouTube Livestream',
    'live_results',
    'official',
    'https://www.youtube.com/@theIPF',
    null,
    'Manual timestamp review source for referee-call markets such as depth or soft lockout.',
    false,
    'Do not auto-settle referee-call markets from video without admin review.'
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

update public.official_competitions
set
  name = 'IPF 2026 World Classic Open Powerlifting Championships',
  start_date = date '2026-06-13',
  end_date = date '2026-06-21',
  source_notes = 'Official IPF and Goodlift sources list the championship window as 13-21 June 2026. Athlete-specific markets must be sourced from Goodlift nominations, live result markets from LiftingCast where available, and referee-call markets from manual livestream review.'
where slug = 'ipf-world-classic-open-2026';

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
      'goodlift-nominations-men',
      'nomination',
      'Goodlift men''s nomination listing',
      'https://goodlift.info/onenomination.php?cid=1171',
      false,
      'manual_review',
      'Athlete-entry source for men''s individual lifter markets.'
    ),
    (
      'goodlift-nominations-women',
      'nomination',
      'Goodlift women''s nomination listing',
      'https://goodlift.info/onenomination.php?cid=1170',
      false,
      'manual_review',
      'Athlete-entry source for women''s individual lifter markets.'
    ),
    (
      'liftingcast-live',
      'live',
      'LiftingCast live data',
      'https://liftingcast.com/',
      false,
      'api_allowed',
      'Use for live result fields only if the Worlds feed is available and terms permit integration.'
    ),
    (
      'ipf-youtube-livestream',
      'other',
      'IPF YouTube livestream',
      'https://www.youtube.com/@theIPF',
      false,
      'manual_review',
      'Timestamped manual review source for referee-call markets such as depth or soft lockout.'
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

with target_competition as (
  select id from public.official_competitions where slug = 'ipf-world-classic-open-2026'
)
insert into public.market_resolution_sources (
  competition_id,
  source_role,
  label,
  url,
  automation_level,
  settlement_use,
  requires_admin_review
)
select
  target_competition.id,
  source.source_role,
  source.label,
  source.url,
  source.automation_level,
  source.settlement_use,
  source.requires_admin_review
from target_competition
cross join (
  values
    (
      'nominations',
      'Goodlift nominations',
      'https://goodlift.info/onenomination.php?cid=1171',
      'semi_automated',
      'Confirms athlete entry before individual lifter markets can be approved.',
      true
    ),
    (
      'live_results',
      'LiftingCast live result feed',
      'https://liftingcast.com/',
      'api_candidate',
      'Validates exposed live result milestones such as attempts, totals, ranks, and records.',
      true
    ),
    (
      'video_review',
      'IPF YouTube livestream',
      'https://www.youtube.com/@theIPF',
      'manual',
      'Validates referee-call markets with timestamped manual review notes.',
      true
    )
) as source(source_role, label, url, automation_level, settlement_use, requires_admin_review)
on conflict (competition_id, source_role, url) do update set
  label = excluded.label,
  automation_level = excluded.automation_level,
  settlement_use = excluded.settlement_use,
  requires_admin_review = excluded.requires_admin_review;
