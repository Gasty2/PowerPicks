create table if not exists powerpicks_ingest.opl_lifters (
  id uuid primary key default gen_random_uuid(),
  opl_name text not null unique,
  display_name text not null,
  sex text check (sex is null or sex in ('M', 'F', 'Mx')),
  country text,
  state text,
  first_seen_date date,
  last_seen_date date,
  result_count integer not null default 0 check (result_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists powerpicks_ingest.opl_meets (
  meet_key text primary key,
  first_import_batch_id uuid references powerpicks_ingest.import_batches(id) on delete set null,
  last_import_batch_id uuid references powerpicks_ingest.import_batches(id) on delete set null,
  federation text not null,
  parent_federation text,
  date date not null,
  meet_country text not null,
  meet_state text,
  meet_town text,
  meet_name text not null,
  sanctioned text,
  source_dataset text not null check (source_dataset in ('openpowerlifting', 'openipf')),
  result_count integer not null default 0 check (result_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists powerpicks_ingest.opl_results (
  id uuid primary key default gen_random_uuid(),
  entry_hash text not null unique,
  import_batch_id uuid not null references powerpicks_ingest.import_batches(id) on delete cascade,
  meet_key text not null references powerpicks_ingest.opl_meets(meet_key) on delete cascade,
  lifter_id uuid not null references powerpicks_ingest.opl_lifters(id) on delete cascade,
  entry_index integer not null check (entry_index >= 0),
  event text,
  equipment text,
  age numeric,
  age_class text,
  birth_year_class text,
  division text,
  bodyweight_kg numeric,
  weight_class_kg text,
  tested text,
  country text,
  state text,
  squat1_kg numeric,
  squat2_kg numeric,
  squat3_kg numeric,
  squat4_kg numeric,
  best3_squat_kg numeric,
  bench1_kg numeric,
  bench2_kg numeric,
  bench3_kg numeric,
  bench4_kg numeric,
  best3_bench_kg numeric,
  deadlift1_kg numeric,
  deadlift2_kg numeric,
  deadlift3_kg numeric,
  deadlift4_kg numeric,
  best3_deadlift_kg numeric,
  total_kg numeric,
  place text,
  dots numeric,
  goodlift numeric,
  raw_row jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists powerpicks_ingest.opl_attempts (
  id uuid primary key default gen_random_uuid(),
  result_id uuid not null references powerpicks_ingest.opl_results(id) on delete cascade,
  lift text not null check (lift in ('squat', 'bench', 'deadlift')),
  attempt_number integer not null check (attempt_number between 1 and 4),
  weight_kg numeric not null,
  success boolean not null,
  counts_toward_total boolean not null default true,
  created_at timestamptz not null default now(),
  unique (result_id, lift, attempt_number)
);

create table if not exists powerpicks_ingest.opl_market_trial_outcomes (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid references powerpicks_ingest.import_batches(id) on delete set null,
  result_id uuid references powerpicks_ingest.opl_results(id) on delete cascade,
  meet_key text references powerpicks_ingest.opl_meets(meet_key) on delete cascade,
  market_kind text not null check (market_kind in ('total_over', 'successful_attempt_sweep', 'best_lift_over', 'placing_top_n')),
  subject_label text not null,
  line_value numeric,
  outcome boolean,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists opl_lifters_display_name_idx on powerpicks_ingest.opl_lifters(display_name);
create index if not exists opl_lifters_country_idx on powerpicks_ingest.opl_lifters(country);
create index if not exists opl_meets_date_idx on powerpicks_ingest.opl_meets(date);
create index if not exists opl_meets_federation_idx on powerpicks_ingest.opl_meets(federation);
create index if not exists opl_meets_parent_federation_idx on powerpicks_ingest.opl_meets(parent_federation);
create index if not exists opl_results_import_batch_idx on powerpicks_ingest.opl_results(import_batch_id);
create index if not exists opl_results_meet_key_idx on powerpicks_ingest.opl_results(meet_key);
create index if not exists opl_results_lifter_id_idx on powerpicks_ingest.opl_results(lifter_id);
create index if not exists opl_results_total_idx on powerpicks_ingest.opl_results(total_kg);
create index if not exists opl_attempts_result_id_idx on powerpicks_ingest.opl_attempts(result_id);
create index if not exists opl_market_trial_outcomes_kind_idx on powerpicks_ingest.opl_market_trial_outcomes(market_kind);
create index if not exists opl_market_trial_outcomes_meet_key_idx on powerpicks_ingest.opl_market_trial_outcomes(meet_key);

alter table powerpicks_ingest.opl_lifters enable row level security;
alter table powerpicks_ingest.opl_meets enable row level security;
alter table powerpicks_ingest.opl_results enable row level security;
alter table powerpicks_ingest.opl_attempts enable row level security;
alter table powerpicks_ingest.opl_market_trial_outcomes enable row level security;

drop trigger if exists set_opl_lifters_updated_at on powerpicks_ingest.opl_lifters;
create trigger set_opl_lifters_updated_at
before update on powerpicks_ingest.opl_lifters
for each row execute function powerpicks_ingest.set_updated_at();

drop trigger if exists set_opl_meets_updated_at on powerpicks_ingest.opl_meets;
create trigger set_opl_meets_updated_at
before update on powerpicks_ingest.opl_meets
for each row execute function powerpicks_ingest.set_updated_at();

grant all privileges on table powerpicks_ingest.opl_lifters to service_role;
grant all privileges on table powerpicks_ingest.opl_meets to service_role;
grant all privileges on table powerpicks_ingest.opl_results to service_role;
grant all privileges on table powerpicks_ingest.opl_attempts to service_role;
grant all privileges on table powerpicks_ingest.opl_market_trial_outcomes to service_role;

drop policy if exists "Service role can manage OPL lifters" on powerpicks_ingest.opl_lifters;
create policy "Service role can manage OPL lifters"
on powerpicks_ingest.opl_lifters
for all
to service_role
using (true)
with check (true);

drop policy if exists "Service role can manage OPL meets" on powerpicks_ingest.opl_meets;
create policy "Service role can manage OPL meets"
on powerpicks_ingest.opl_meets
for all
to service_role
using (true)
with check (true);

drop policy if exists "Service role can manage OPL results" on powerpicks_ingest.opl_results;
create policy "Service role can manage OPL results"
on powerpicks_ingest.opl_results
for all
to service_role
using (true)
with check (true);

drop policy if exists "Service role can manage OPL attempts" on powerpicks_ingest.opl_attempts;
create policy "Service role can manage OPL attempts"
on powerpicks_ingest.opl_attempts
for all
to service_role
using (true)
with check (true);

drop policy if exists "Service role can manage OPL market trial outcomes" on powerpicks_ingest.opl_market_trial_outcomes;
create policy "Service role can manage OPL market trial outcomes"
on powerpicks_ingest.opl_market_trial_outcomes
for all
to service_role
using (true)
with check (true);
