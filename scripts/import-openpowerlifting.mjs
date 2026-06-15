#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { spawn } from "node:child_process";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import pg from "pg";

const { Client } = pg;

const SOURCE_CONFIG = {
  openipf: {
    dataSourceSlug: "openipf-bulk-csv",
    importKind: "openipf_bulk_csv",
    zipUrl: "https://openpowerlifting.gitlab.io/opl-csv/files/openipf-latest.zip",
  },
  openpowerlifting: {
    dataSourceSlug: "openpowerlifting-bulk-csv",
    importKind: "openpowerlifting_bulk_csv",
    zipUrl: "https://openpowerlifting.gitlab.io/opl-csv/files/openpowerlifting-latest.zip",
  },
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (process.env[key]) continue;
    const rawValue = rest.join("=").trim();
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), ".env"));

function parseArgs(argv) {
  const options = {
    source: process.env.OPENPOWERLIFTING_SOURCE || "openipf",
    cacheDir: process.env.OPENPOWERLIFTING_CACHE_DIR || path.resolve(".cache", "openpowerlifting"),
    batchSize: Number(process.env.OPENPOWERLIFTING_BATCH_SIZE || 500),
    limit: Number(process.env.OPENPOWERLIFTING_LIMIT || 10000),
    dryRun: false,
    all: false,
    refresh: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;

    const [flag, inlineValue] = token.slice(2).split("=", 2);
    const nextValue = inlineValue ?? argv[index + 1];
    const consumeValue = inlineValue === undefined && nextValue && !nextValue.startsWith("--");

    switch (flag) {
      case "all":
      case "refresh":
        options[flag.replace("-", "")] = true;
        break;
      case "dry-run":
        options.dryRun = true;
        break;
      case "help":
        options.help = true;
        break;
      case "source":
      case "csv":
      case "zip":
      case "download-url":
      case "cache-dir":
      case "since-date":
      case "federation":
      case "parent-federation":
      case "meet-name-contains":
        options[camelCase(flag)] = nextValue;
        if (consumeValue) index += 1;
        break;
      case "limit":
      case "batch-size":
        options[camelCase(flag)] = Number(nextValue);
        if (consumeValue) index += 1;
        break;
      default:
        throw new Error(`Unknown option: --${flag}`);
    }
  }

  if (options.all) options.limit = null;
  if (!SOURCE_CONFIG[options.source]) {
    throw new Error(`Unknown source "${options.source}". Use openipf or openpowerlifting.`);
  }
  if (!Number.isInteger(options.batchSize) || options.batchSize < 1 || options.batchSize > 2000) {
    throw new Error("--batch-size must be an integer from 1 to 2000.");
  }
  if (options.limit !== null && (!Number.isInteger(options.limit) || options.limit < 1)) {
    throw new Error("--limit must be a positive integer, or use --all.");
  }

  return options;
}

function camelCase(flag) {
  return flag.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function printHelp() {
  console.log(`OpenPowerlifting importer

Usage:
  npm run import:opl -- --dry-run --csv scripts/fixtures/openpowerlifting-sample.csv
  npm run import:opl -- --source openipf --limit 5000
  npm run import:opl -- --source openipf --since-date 2025-01-01 --parent-federation IPF

Options:
  --dry-run                 Parse and summarize without writing to Supabase.
  --source                  openipf (default) or openpowerlifting.
  --csv                     Use an already-extracted CSV file.
  --zip                     Use an already-downloaded zip file.
  --download-url            Override the OpenPowerlifting zip URL.
  --limit                   Max matched rows to import. Default: 10000.
  --all                     Import every matched row.
  --batch-size              Rows per database batch. Default: 500.
  --since-date              Keep meets on or after YYYY-MM-DD.
  --federation              Keep exact Federation value.
  --parent-federation       Keep exact ParentFederation value.
  --meet-name-contains      Case-insensitive meet name filter.
  --refresh                 Re-download or re-extract source files.
`);
}

async function resolveCsvPath(options) {
  if (options.csv) {
    return path.resolve(options.csv);
  }

  await fsp.mkdir(options.cacheDir, { recursive: true });

  const source = SOURCE_CONFIG[options.source];
  const zipPath = options.zip
    ? path.resolve(options.zip)
    : path.join(options.cacheDir, `${options.source}-latest.zip`);
  const zipUrl = options.downloadUrl || source.zipUrl;

  if (!options.zip && (options.refresh || !fs.existsSync(zipPath))) {
    await downloadFile(zipUrl, zipPath);
  }

  const extractDir = path.join(options.cacheDir, `${options.source}-latest`);
  if (options.refresh && fs.existsSync(extractDir)) {
    await fsp.rm(extractDir, { recursive: true, force: true });
  }
  await fsp.mkdir(extractDir, { recursive: true });

  const existingCsv = await findLargestCsv(extractDir);
  if (existingCsv && !options.refresh) return existingCsv;

  await extractZip(zipPath, extractDir);
  const csvPath = await findLargestCsv(extractDir);
  if (!csvPath) {
    throw new Error(`No CSV file found after extracting ${zipPath}`);
  }

  return csvPath;
}

async function downloadFile(url, destination) {
  console.log(`Downloading ${url}`);
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Download failed with status ${response.status}`);
  }
  await fsp.mkdir(path.dirname(destination), { recursive: true });
  await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(destination));
}

async function extractZip(zipPath, extractDir) {
  console.log(`Extracting ${zipPath}`);
  if (process.platform === "win32") {
    await runCommand("powershell.exe", [
      "-NoProfile",
      "-Command",
      "Expand-Archive -LiteralPath $args[0] -DestinationPath $args[1] -Force",
      zipPath,
      extractDir,
    ]);
    return;
  }

  await runCommand("unzip", ["-o", zipPath, "-d", extractDir]);
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

async function findLargestCsv(directory) {
  const matches = [];

  async function walk(current) {
    if (!fs.existsSync(current)) return;
    const entries = await fsp.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(next);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".csv")) {
        const stats = await fsp.stat(next);
        matches.push({ path: next, size: stats.size });
      }
    }
  }

  await walk(directory);
  matches.sort((a, b) => b.size - a.size);
  return matches[0]?.path;
}

function splitSimpleCsv(line) {
  const cleanLine = line.replace(/\r$/, "");
  if (cleanLine.includes('"')) {
    throw new Error("Quoted CSV values are not supported by this importer.");
  }
  return cleanLine.split(",");
}

async function importCsv(csvPath, options) {
  const stats = {
    source: options.source,
    csvPath,
    dryRun: options.dryRun,
    scannedRows: 0,
    matchedRows: 0,
    importedRows: 0,
    skippedRows: 0,
    uniqueMeetKeys: new Set(),
    uniqueLifterNames: new Set(),
    nineForNineOutcomes: 0,
  };

  const client = options.dryRun ? null : await connectDatabase();
  let importBatchId = null;

  try {
    if (client) {
      importBatchId = await createImportBatch(client, options, csvPath);
    }

    const stream = fs.createReadStream(csvPath, { encoding: "utf8" });
    const lines = readline.createInterface({ input: stream, crlfDelay: Infinity });
    let headers = null;
    let buffer = [];

    for await (const line of lines) {
      if (!headers) {
        headers = splitSimpleCsv(line);
        continue;
      }

      stats.scannedRows += 1;
      const raw = rowFromLine(headers, line);

      if (!passesFilters(raw, options)) {
        stats.skippedRows += 1;
        continue;
      }

      const mapped = mapOpenPowerliftingRow(raw, {
        source: options.source,
        entryIndex: stats.scannedRows,
        line,
      });
      stats.matchedRows += 1;
      stats.uniqueMeetKeys.add(mapped.meet.meet_key);
      stats.uniqueLifterNames.add(mapped.lifter.opl_name);
      stats.nineForNineOutcomes += mapped.trialOutcome ? 1 : 0;

      buffer.push(mapped);
      if (buffer.length >= options.batchSize) {
        if (client) {
          await flushRows(client, importBatchId, buffer);
          stats.importedRows += buffer.length;
        }
        buffer = [];
      }

      if (options.limit !== null && stats.matchedRows >= options.limit) break;
    }

    if (buffer.length && client) {
      await flushRows(client, importBatchId, buffer);
      stats.importedRows += buffer.length;
    }

    if (client) {
      await completeImportBatch(client, importBatchId, "succeeded", stats);
    }

    return serializeStats(stats);
  } catch (error) {
    if (client && importBatchId) {
      await completeImportBatch(client, importBatchId, "failed", stats, error);
    }
    throw error;
  } finally {
    await client?.end();
  }
}

function rowFromLine(headers, line) {
  const values = splitSimpleCsv(line);
  if (values.length !== headers.length) {
    throw new Error(`CSV row has ${values.length} fields but expected ${headers.length}.`);
  }

  return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
}

function passesFilters(row, options) {
  if (options.sinceDate && row.Date < options.sinceDate) return false;
  if (options.federation && row.Federation !== options.federation) return false;
  if (options.parentFederation && row.ParentFederation !== options.parentFederation) return false;
  if (
    options.meetNameContains &&
    !row.MeetName.toLowerCase().includes(options.meetNameContains.toLowerCase())
  ) {
    return false;
  }
  return true;
}

function mapOpenPowerliftingRow(row, context) {
  const meetKey = makeMeetKey(row);
  const entryHash = sha256(`${context.source}|${context.entryIndex}|${JSON.stringify(row)}`);
  const displayName = nullableText(row.Name)?.replace(/\s+#\d+$/, "") || row.Name;
  const attempts = buildAttempts(row);
  const nineForNine = buildNineForNineOutcome(row, attempts, entryHash, meetKey, context);

  return {
    lifter: {
      opl_name: row.Name,
      display_name: displayName,
      sex: nullableText(row.Sex),
      country: nullableText(row.Country),
      state: nullableText(row.State),
      first_seen_date: nullableText(row.Date),
      last_seen_date: nullableText(row.Date),
      metadata: {},
    },
    meet: {
      meet_key: meetKey,
      federation: row.Federation,
      parent_federation: nullableText(row.ParentFederation),
      date: row.Date,
      meet_country: row.MeetCountry,
      meet_state: nullableText(row.MeetState),
      meet_town: nullableText(row.MeetTown),
      meet_name: row.MeetName,
      sanctioned: nullableText(row.Sanctioned),
      source_dataset: context.source,
      metadata: {},
    },
    rawMeet: {
      meet_key: meetKey,
      federation: nullableText(row.Federation),
      parent_federation: nullableText(row.ParentFederation),
      date: nullableText(row.Date),
      meet_country: nullableText(row.MeetCountry),
      meet_state: nullableText(row.MeetState),
      meet_town: nullableText(row.MeetTown),
      meet_name: nullableText(row.MeetName),
      sanctioned: nullableText(row.Sanctioned),
      source_path: context.source,
      raw_row: row,
    },
    rawEntry: {
      meet_key: meetKey,
      entry_index: context.entryIndex,
      lifter_name: nullableText(row.Name),
      sex: nullableText(row.Sex),
      equipment: nullableText(row.Equipment),
      age: nullableNumber(row.Age),
      age_class: nullableText(row.AgeClass),
      division: nullableText(row.Division),
      bodyweight_kg: nullableNumber(row.BodyweightKg),
      weight_class_kg: nullableText(row.WeightClassKg),
      squat1_kg: nullableNumber(row.Squat1Kg),
      squat2_kg: nullableNumber(row.Squat2Kg),
      squat3_kg: nullableNumber(row.Squat3Kg),
      best3_squat_kg: nullableNumber(row.Best3SquatKg),
      bench1_kg: nullableNumber(row.Bench1Kg),
      bench2_kg: nullableNumber(row.Bench2Kg),
      bench3_kg: nullableNumber(row.Bench3Kg),
      best3_bench_kg: nullableNumber(row.Best3BenchKg),
      deadlift1_kg: nullableNumber(row.Deadlift1Kg),
      deadlift2_kg: nullableNumber(row.Deadlift2Kg),
      deadlift3_kg: nullableNumber(row.Deadlift3Kg),
      best3_deadlift_kg: nullableNumber(row.Best3DeadliftKg),
      total_kg: nullableNumber(row.TotalKg),
      place: nullableText(row.Place),
      dots: nullableNumber(row.Dots),
      goodlift: nullableNumber(row.Goodlift),
      tested: nullableText(row.Tested),
      country: nullableText(row.Country),
      raw_row: row,
    },
    result: {
      entry_hash: entryHash,
      meet_key: meetKey,
      entry_index: context.entryIndex,
      event: nullableText(row.Event),
      equipment: nullableText(row.Equipment),
      age: nullableNumber(row.Age),
      age_class: nullableText(row.AgeClass),
      birth_year_class: nullableText(row.BirthYearClass),
      division: nullableText(row.Division),
      bodyweight_kg: nullableNumber(row.BodyweightKg),
      weight_class_kg: nullableText(row.WeightClassKg),
      tested: nullableText(row.Tested),
      country: nullableText(row.Country),
      state: nullableText(row.State),
      squat1_kg: nullableNumber(row.Squat1Kg),
      squat2_kg: nullableNumber(row.Squat2Kg),
      squat3_kg: nullableNumber(row.Squat3Kg),
      squat4_kg: nullableNumber(row.Squat4Kg),
      best3_squat_kg: nullableNumber(row.Best3SquatKg),
      bench1_kg: nullableNumber(row.Bench1Kg),
      bench2_kg: nullableNumber(row.Bench2Kg),
      bench3_kg: nullableNumber(row.Bench3Kg),
      bench4_kg: nullableNumber(row.Bench4Kg),
      best3_bench_kg: nullableNumber(row.Best3BenchKg),
      deadlift1_kg: nullableNumber(row.Deadlift1Kg),
      deadlift2_kg: nullableNumber(row.Deadlift2Kg),
      deadlift3_kg: nullableNumber(row.Deadlift3Kg),
      deadlift4_kg: nullableNumber(row.Deadlift4Kg),
      best3_deadlift_kg: nullableNumber(row.Best3DeadliftKg),
      total_kg: nullableNumber(row.TotalKg),
      place: nullableText(row.Place),
      dots: nullableNumber(row.Dots),
      goodlift: nullableNumber(row.Goodlift),
      raw_row: row,
    },
    attempts,
    trialOutcome: nineForNine,
  };
}

function buildAttempts(row) {
  return [
    attempt(row.Squat1Kg, "squat", 1, true),
    attempt(row.Squat2Kg, "squat", 2, true),
    attempt(row.Squat3Kg, "squat", 3, true),
    attempt(row.Squat4Kg, "squat", 4, false),
    attempt(row.Bench1Kg, "bench", 1, true),
    attempt(row.Bench2Kg, "bench", 2, true),
    attempt(row.Bench3Kg, "bench", 3, true),
    attempt(row.Bench4Kg, "bench", 4, false),
    attempt(row.Deadlift1Kg, "deadlift", 1, true),
    attempt(row.Deadlift2Kg, "deadlift", 2, true),
    attempt(row.Deadlift3Kg, "deadlift", 3, true),
    attempt(row.Deadlift4Kg, "deadlift", 4, false),
  ].filter(Boolean);
}

function attempt(rawWeight, lift, attemptNumber, countsTowardTotal) {
  const value = nullableNumber(rawWeight);
  if (value === null || value === 0) return null;

  return {
    lift,
    attempt_number: attemptNumber,
    weight_kg: Math.abs(value),
    success: value > 0,
    counts_toward_total: countsTowardTotal,
  };
}

function buildNineForNineOutcome(row, attempts, entryHash, meetKey, context) {
  if (row.Event !== "SBD") return null;
  const competitionAttempts = attempts.filter((item) => item.counts_toward_total);
  if (competitionAttempts.length !== 9) return null;

  const successfulAttempts = competitionAttempts.filter((item) => item.success).length;
  return {
    outcome_key: sha256(`successful_attempt_sweep|${entryHash}`),
    market_kind: "successful_attempt_sweep",
    subject_label: `${row.Name} 9/9`,
    line_value: 9,
    outcome: successfulAttempts === 9,
    meet_key: meetKey,
    evidence: {
      entryHash,
      source: context.source,
      successfulAttempts,
      knownAttempts: competitionAttempts.length,
      totalKg: nullableNumber(row.TotalKg),
      place: nullableText(row.Place),
    },
  };
}

function nullableText(value) {
  return value === undefined || value === null || value === "" ? null : value;
}

function nullableNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function makeMeetKey(row) {
  return [row.Federation, row.Date, row.MeetCountry, row.MeetName]
    .map((part) => String(part || "").trim().toLowerCase().replace(/\s+/g, "-"))
    .join("|");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function connectDatabase() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required unless --dry-run is used.");
  }

  const client = new Client({
    connectionString,
    ssl: process.env.PGSSLMODE === "disable" ? undefined : { rejectUnauthorized: false },
  });
  await client.connect();
  return client;
}

async function createImportBatch(client, options, csvPath) {
  const source = SOURCE_CONFIG[options.source];
  const result = await client.query(
    `insert into powerpicks_ingest.import_batches (
      data_source_slug,
      import_kind,
      status,
      source_url,
      metadata
    )
    values ($1, $2, 'running', $3, $4::jsonb)
    returning id`,
    [
      source.dataSourceSlug,
      source.importKind,
      options.downloadUrl || source.zipUrl,
      JSON.stringify({
        csvPath,
        limit: options.limit,
        filters: activeFilters(options),
        host: os.hostname(),
      }),
    ],
  );
  return result.rows[0].id;
}

async function completeImportBatch(client, batchId, status, stats, error) {
  await client.query(
    `update powerpicks_ingest.import_batches
     set status = $2,
         finished_at = now(),
         row_count = $3,
         error_message = $4,
         metadata = metadata || $5::jsonb
     where id = $1`,
    [
      batchId,
      status,
      stats.importedRows,
      error ? error.message : null,
      JSON.stringify({ finalStats: serializeStats(stats) }),
    ],
  );
}

function activeFilters(options) {
  return {
    sinceDate: options.sinceDate || null,
    federation: options.federation || null,
    parentFederation: options.parentFederation || null,
    meetNameContains: options.meetNameContains || null,
  };
}

async function flushRows(client, importBatchId, rows) {
  await client.query("begin");
  try {
    const lifters = dedupe(rows.map((row) => row.lifter), "opl_name");
    const meets = dedupe(rows.map((row) => row.meet), "meet_key");
    const rawMeets = dedupe(rows.map((row) => row.rawMeet), "meet_key");

    const lifterIds = await upsertLifters(client, lifters);
    await upsertMeets(client, importBatchId, meets);
    await insertRawMeets(client, importBatchId, rawMeets);
    await insertRawEntries(client, importBatchId, rows.map((row) => row.rawEntry));

    const results = rows.map((row) => ({
      ...row.result,
      lifter_id: lifterIds.get(row.lifter.opl_name),
    }));
    const resultIds = await insertResults(client, importBatchId, results);

    const attempts = [];
    const outcomes = [];
    for (const row of rows) {
      const resultId = resultIds.get(row.result.entry_hash);
      if (!resultId) continue;

      attempts.push(...row.attempts.map((attemptRow) => ({ ...attemptRow, result_id: resultId })));
      if (row.trialOutcome) {
        outcomes.push({
          ...row.trialOutcome,
          import_batch_id: importBatchId,
          result_id: resultId,
        });
      }
    }

    await insertAttempts(client, attempts);
    await insertTrialOutcomes(client, outcomes);
    await refreshCounts(client, [...lifterIds.values()], meets.map((meet) => meet.meet_key));
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

function dedupe(rows, key) {
  return [...new Map(rows.map((row) => [row[key], row])).values()];
}

async function upsertLifters(client, rows) {
  if (!rows.length) return new Map();

  await client.query(
    `with incoming as (
      select * from jsonb_to_recordset($1::jsonb) as x(
        opl_name text,
        display_name text,
        sex text,
        country text,
        state text,
        first_seen_date date,
        last_seen_date date,
        metadata jsonb
      )
    )
    insert into powerpicks_ingest.opl_lifters (
      opl_name,
      display_name,
      sex,
      country,
      state,
      first_seen_date,
      last_seen_date,
      metadata
    )
    select opl_name, display_name, sex, country, state, first_seen_date, last_seen_date, metadata
    from incoming
    on conflict (opl_name) do update set
      display_name = excluded.display_name,
      sex = coalesce(excluded.sex, powerpicks_ingest.opl_lifters.sex),
      country = coalesce(excluded.country, powerpicks_ingest.opl_lifters.country),
      state = coalesce(excluded.state, powerpicks_ingest.opl_lifters.state),
      first_seen_date = case
        when powerpicks_ingest.opl_lifters.first_seen_date is null then excluded.first_seen_date
        when excluded.first_seen_date is null then powerpicks_ingest.opl_lifters.first_seen_date
        else least(powerpicks_ingest.opl_lifters.first_seen_date, excluded.first_seen_date)
      end,
      last_seen_date = case
        when powerpicks_ingest.opl_lifters.last_seen_date is null then excluded.last_seen_date
        when excluded.last_seen_date is null then powerpicks_ingest.opl_lifters.last_seen_date
        else greatest(powerpicks_ingest.opl_lifters.last_seen_date, excluded.last_seen_date)
      end`,
    [JSON.stringify(rows)],
  );

  const result = await client.query(
    `select id, opl_name
     from powerpicks_ingest.opl_lifters
     where opl_name = any($1::text[])`,
    [rows.map((row) => row.opl_name)],
  );
  return new Map(result.rows.map((row) => [row.opl_name, row.id]));
}

async function upsertMeets(client, importBatchId, rows) {
  if (!rows.length) return;

  await client.query(
    `with incoming as (
      select * from jsonb_to_recordset($1::jsonb) as x(
        meet_key text,
        federation text,
        parent_federation text,
        date date,
        meet_country text,
        meet_state text,
        meet_town text,
        meet_name text,
        sanctioned text,
        source_dataset text,
        metadata jsonb
      )
    )
    insert into powerpicks_ingest.opl_meets (
      meet_key,
      first_import_batch_id,
      last_import_batch_id,
      federation,
      parent_federation,
      date,
      meet_country,
      meet_state,
      meet_town,
      meet_name,
      sanctioned,
      source_dataset,
      metadata
    )
    select
      meet_key,
      $2::uuid,
      $2::uuid,
      federation,
      parent_federation,
      date,
      meet_country,
      meet_state,
      meet_town,
      meet_name,
      sanctioned,
      source_dataset,
      metadata
    from incoming
    on conflict (meet_key) do update set
      last_import_batch_id = excluded.last_import_batch_id,
      federation = excluded.federation,
      parent_federation = excluded.parent_federation,
      date = excluded.date,
      meet_country = excluded.meet_country,
      meet_state = excluded.meet_state,
      meet_town = excluded.meet_town,
      meet_name = excluded.meet_name,
      sanctioned = excluded.sanctioned,
      source_dataset = excluded.source_dataset`,
    [JSON.stringify(rows), importBatchId],
  );
}

async function insertRawMeets(client, importBatchId, rows) {
  if (!rows.length) return;

  await client.query(
    `with incoming as (
      select * from jsonb_to_recordset($1::jsonb) as x(
        meet_key text,
        federation text,
        parent_federation text,
        date date,
        meet_country text,
        meet_state text,
        meet_town text,
        meet_name text,
        sanctioned text,
        source_path text,
        raw_row jsonb
      )
    )
    insert into powerpicks_ingest.opl_meets_raw (
      import_batch_id,
      meet_key,
      federation,
      parent_federation,
      date,
      meet_country,
      meet_state,
      meet_town,
      meet_name,
      sanctioned,
      source_path,
      raw_row
    )
    select
      $2::uuid,
      meet_key,
      federation,
      parent_federation,
      date,
      meet_country,
      meet_state,
      meet_town,
      meet_name,
      sanctioned,
      source_path,
      raw_row
    from incoming
    on conflict (import_batch_id, meet_key) do nothing`,
    [JSON.stringify(rows), importBatchId],
  );
}

async function insertRawEntries(client, importBatchId, rows) {
  if (!rows.length) return;

  await client.query(
    `with incoming as (
      select * from jsonb_to_recordset($1::jsonb) as x(
        meet_key text,
        entry_index integer,
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
        raw_row jsonb
      )
    )
    insert into powerpicks_ingest.opl_entries_raw (
      import_batch_id,
      meet_key,
      entry_index,
      lifter_name,
      sex,
      equipment,
      age,
      age_class,
      division,
      bodyweight_kg,
      weight_class_kg,
      squat1_kg,
      squat2_kg,
      squat3_kg,
      best3_squat_kg,
      bench1_kg,
      bench2_kg,
      bench3_kg,
      best3_bench_kg,
      deadlift1_kg,
      deadlift2_kg,
      deadlift3_kg,
      best3_deadlift_kg,
      total_kg,
      place,
      dots,
      goodlift,
      tested,
      country,
      raw_row
    )
    select
      $2::uuid,
      meet_key,
      entry_index,
      lifter_name,
      sex,
      equipment,
      age,
      age_class,
      division,
      bodyweight_kg,
      weight_class_kg,
      squat1_kg,
      squat2_kg,
      squat3_kg,
      best3_squat_kg,
      bench1_kg,
      bench2_kg,
      bench3_kg,
      best3_bench_kg,
      deadlift1_kg,
      deadlift2_kg,
      deadlift3_kg,
      best3_deadlift_kg,
      total_kg,
      place,
      dots,
      goodlift,
      tested,
      country,
      raw_row
    from incoming
    on conflict (import_batch_id, meet_key, entry_index) do nothing`,
    [JSON.stringify(rows), importBatchId],
  );
}

async function insertResults(client, importBatchId, rows) {
  if (!rows.length) return new Map();

  await client.query(
    `with incoming as (
      select * from jsonb_to_recordset($1::jsonb) as x(
        entry_hash text,
        meet_key text,
        lifter_id uuid,
        entry_index integer,
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
        raw_row jsonb
      )
    )
    insert into powerpicks_ingest.opl_results (
      entry_hash,
      import_batch_id,
      meet_key,
      lifter_id,
      entry_index,
      event,
      equipment,
      age,
      age_class,
      birth_year_class,
      division,
      bodyweight_kg,
      weight_class_kg,
      tested,
      country,
      state,
      squat1_kg,
      squat2_kg,
      squat3_kg,
      squat4_kg,
      best3_squat_kg,
      bench1_kg,
      bench2_kg,
      bench3_kg,
      bench4_kg,
      best3_bench_kg,
      deadlift1_kg,
      deadlift2_kg,
      deadlift3_kg,
      deadlift4_kg,
      best3_deadlift_kg,
      total_kg,
      place,
      dots,
      goodlift,
      raw_row
    )
    select
      entry_hash,
      $2::uuid,
      meet_key,
      lifter_id,
      entry_index,
      event,
      equipment,
      age,
      age_class,
      birth_year_class,
      division,
      bodyweight_kg,
      weight_class_kg,
      tested,
      country,
      state,
      squat1_kg,
      squat2_kg,
      squat3_kg,
      squat4_kg,
      best3_squat_kg,
      bench1_kg,
      bench2_kg,
      bench3_kg,
      bench4_kg,
      best3_bench_kg,
      deadlift1_kg,
      deadlift2_kg,
      deadlift3_kg,
      deadlift4_kg,
      best3_deadlift_kg,
      total_kg,
      place,
      dots,
      goodlift,
      raw_row
    from incoming
    on conflict (entry_hash) do nothing`,
    [JSON.stringify(rows), importBatchId],
  );

  const result = await client.query(
    `select id, entry_hash
     from powerpicks_ingest.opl_results
     where entry_hash = any($1::text[])`,
    [rows.map((row) => row.entry_hash)],
  );
  return new Map(result.rows.map((row) => [row.entry_hash, row.id]));
}

async function insertAttempts(client, rows) {
  if (!rows.length) return;

  await client.query(
    `with incoming as (
      select * from jsonb_to_recordset($1::jsonb) as x(
        result_id uuid,
        lift text,
        attempt_number integer,
        weight_kg numeric,
        success boolean,
        counts_toward_total boolean
      )
    )
    insert into powerpicks_ingest.opl_attempts (
      result_id,
      lift,
      attempt_number,
      weight_kg,
      success,
      counts_toward_total
    )
    select result_id, lift, attempt_number, weight_kg, success, counts_toward_total
    from incoming
    on conflict (result_id, lift, attempt_number) do update set
      weight_kg = excluded.weight_kg,
      success = excluded.success,
      counts_toward_total = excluded.counts_toward_total`,
    [JSON.stringify(rows)],
  );
}

async function insertTrialOutcomes(client, rows) {
  if (!rows.length) return;

  await client.query(
    `with incoming as (
      select * from jsonb_to_recordset($1::jsonb) as x(
        outcome_key text,
        import_batch_id uuid,
        result_id uuid,
        meet_key text,
        market_kind text,
        subject_label text,
        line_value numeric,
        outcome boolean,
        evidence jsonb
      )
    )
    insert into powerpicks_ingest.opl_market_trial_outcomes (
      outcome_key,
      import_batch_id,
      result_id,
      meet_key,
      market_kind,
      subject_label,
      line_value,
      outcome,
      evidence
    )
    select
      outcome_key,
      import_batch_id,
      result_id,
      meet_key,
      market_kind,
      subject_label,
      line_value,
      outcome,
      evidence
    from incoming
    on conflict (outcome_key) do update set
      import_batch_id = excluded.import_batch_id,
      result_id = excluded.result_id,
      meet_key = excluded.meet_key,
      outcome = excluded.outcome,
      evidence = excluded.evidence`,
    [JSON.stringify(rows)],
  );
}

async function refreshCounts(client, lifterIds, meetKeys) {
  if (lifterIds.length) {
    await client.query(
      `update powerpicks_ingest.opl_lifters lifters
       set result_count = counts.result_count
       from (
         select lifter_id, count(*)::integer as result_count
         from powerpicks_ingest.opl_results
         where lifter_id = any($1::uuid[])
         group by lifter_id
       ) counts
       where lifters.id = counts.lifter_id`,
      [lifterIds],
    );
  }

  if (meetKeys.length) {
    await client.query(
      `update powerpicks_ingest.opl_meets meets
       set result_count = counts.result_count
       from (
         select meet_key, count(*)::integer as result_count
         from powerpicks_ingest.opl_results
         where meet_key = any($1::text[])
         group by meet_key
       ) counts
       where meets.meet_key = counts.meet_key`,
      [meetKeys],
    );
  }
}

function serializeStats(stats) {
  return {
    source: stats.source,
    csvPath: stats.csvPath,
    dryRun: stats.dryRun,
    scannedRows: stats.scannedRows,
    matchedRows: stats.matchedRows,
    importedRows: stats.importedRows,
    skippedRows: stats.skippedRows,
    uniqueMeetCount: stats.uniqueMeetKeys.size,
    uniqueLifterCount: stats.uniqueLifterNames.size,
    nineForNineOutcomes: stats.nineForNineOutcomes,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const csvPath = await resolveCsvPath(options);
  const stats = await importCsv(csvPath, options);
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
