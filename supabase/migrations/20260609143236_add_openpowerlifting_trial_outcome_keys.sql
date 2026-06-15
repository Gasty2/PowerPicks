alter table powerpicks_ingest.opl_market_trial_outcomes
add column if not exists outcome_key text;

create unique index if not exists opl_market_trial_outcomes_outcome_key_idx
on powerpicks_ingest.opl_market_trial_outcomes(outcome_key)
where outcome_key is not null;
