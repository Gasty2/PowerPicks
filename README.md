# PowerPicks

PowerPicks is a free-to-play fantasy prediction platform for powerlifting competitions.

This first pass is a placeholder Next.js App Router scaffold with source-gated UI data and Supabase staging tables for competition trials. It does not include Supabase auth, user staking logic, settlement logic, payments, crypto, or reward flows.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run import:opl -- --dry-run --csv scripts/fixtures/openpowerlifting-sample.csv
```

## Routes

- `/`
- `/login`
- `/signup`
- `/dashboard`
- `/competitions`
- `/competitions/[competitionId]`
- `/markets/[marketId]`
- `/data-trials`
- `/leaderboard`
- `/profile`
- `/admin`

## Real Data Direction

Historical trials should start with OpenPowerlifting public CSV exports or an approved API wrapper. Upcoming IPF events should be seeded from official calendar/source links. Live scoresheet pages should be linked unless there is explicit permission or a documented API for automated ingestion.

## Supabase Staging

Remote migrations have been applied to the Supabase project `cqtbgnlszroihmdrobrg` and mirrored in `supabase/migrations`.

- `powerpicks_ingest`: private source registry, import batches, and raw OpenPowerlifting staging tables.
- `public.official_competitions`: read-only app-facing official competition rows.
- `public.official_source_links`: read-only app-facing source links.
- `powerpicks_ingest.opl_lifters`, `opl_meets`, `opl_results`, `opl_attempts`: normalized historical import tables.

See `docs/supabase-data-staging.md` for import rules and next steps.

To let the app read the public source registry, create `.env.local` from `.env.example` with your Supabase project URL and publishable key. Do not put service-role keys in any `NEXT_PUBLIC_` variable.
