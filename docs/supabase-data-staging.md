# Supabase Data Staging

PowerPicks now has the first real data layer for source-linked competitions and OpenPowerlifting import trials.

## Remote Project

- Project: `Gasty2's Project`
- Project ref: `cqtbgnlszroihmdrobrg`
- Region: `eu-west-1`
- Applied migrations:
  - `20260609092328_powerpicks_data_staging`
  - `20260609092517_harden_powerpicks_staging_access`

## Schemas

- `powerpicks_ingest`: private staging schema for source registry, import batches, and raw OpenPowerlifting rows.
- `public.official_competitions`: public read-only competition registry for app-facing source-linked events.
- `public.official_source_links`: public read-only links attached to official competitions.

The private staging tables are RLS-enabled with service-role-only policies. The public tables are RLS-enabled with `SELECT` policies for `anon` and `authenticated`, and no write policies for users.

## Seeded Source Links

- OpenPowerlifting bulk CSV: `https://openpowerlifting.gitlab.io/opl-csv/bulk-csv.html`
- OpenIPF bulk CSV: `https://openpowerlifting.gitlab.io/opl-csv/bulk-csv.html`
- IPF calendar: `https://www.powerlifting.sport/championships/calendar`
- IPF 2026 invitation PDF: `https://www.powerlifting.sport/fileadmin/ipf/data/championships/informations/2026/classic-powerlifting/lithuania/2026_Invitation_IPF_World_Classic_Open_Powerlifting_Championships__Lithuania-05.pdf`
- Goodlift men's nomination listing: `https://goodlift.info/onenomination.php?cid=1171`
- Goodlift women's nomination listing: `https://goodlift.info/onenomination.php?cid=1170`
- LiftingCast live data entrypoint: `https://liftingcast.com/`
- Eurovision Sport powerlifting livestream hub: `https://eurovisionsport.com/en/explore/sports/powerlifting`
- IPF YouTube video/replay channel: `https://www.youtube.com/@theIPF`

## Import Rules

- Historical trials can use OpenPowerlifting and OpenIPF bulk CSV snapshots.
- Official upcoming competitions should be seeded from IPF calendar/source links and reviewed before app display.
- Goodlift nominations are the athlete-entry source for individual lifter markets.
- LiftingCast should be used for live result fields when the event feed is available.
- Referee-call markets such as depth or soft lockout need timestamped official livestream or replay review and manual settlement notes.
- Trial markets remain free-to-play prediction markets using fantasy points and stake points only. No money, crypto, paid points, or prizes.

## Next Build Step

The server-side import worker is now scaffolded as `scripts/import-openpowerlifting.mjs`.

Dry-run against the checked-in fixture:

```bash
npm run import:opl -- --dry-run --csv scripts/fixtures/openpowerlifting-sample.csv
```

Limited OpenIPF import after setting `DATABASE_URL` in `.env.local`:

```bash
npm run import:opl -- --source openipf --limit 5000
```

The worker:

1. Creates a `powerpicks_ingest.import_batches` row.
2. Downloads or reads an OpenPowerlifting/OpenIPF CSV snapshot.
3. Parses rows according to the OpenPowerlifting bulk CSV format.
4. Inserts raw rows into `opl_meets_raw` and `opl_entries_raw`.
5. Upserts normalized lifters, meets, result rows, attempts, and 9/9 trial outcomes.
6. Marks the batch `succeeded` or `failed` with row counts and source metadata.

Use `--dry-run` first. The full OpenIPF feed is large, so default imports are capped at 10,000 matched rows unless `--all` is supplied.
