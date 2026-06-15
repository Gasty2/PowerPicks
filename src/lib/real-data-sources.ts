export type DataSource = {
  name: string;
  role: string;
  status: string;
  url: string;
  note: string;
};

export type TrialCompetition = {
  name: string;
  date: string;
  location: string;
  federation: string;
  source: string;
  sourceUrl: string;
  trialUse: string;
};

export type StagingTable = {
  name: string;
  schema: string;
  access: string;
  purpose: string;
};

export type ResolutionWorkflow = {
  marketType: string;
  primarySource: string;
  validation: string;
  automation: string;
};

export const dataSources: DataSource[] = [
  {
    name: "OpenPowerlifting bulk CSV",
    role: "Historical results",
    status: "Best first training dataset",
    url: "https://openpowerlifting.gitlab.io/opl-csv/bulk-csv.html",
    note: "Nightly public CSV exports for previous meets, lifter histories, totals, and trend trials.",
  },
  {
    name: "IPF invitation and calendar",
    role: "Official event window",
    status: "Official schedule source",
    url: "https://www.powerlifting.sport/championships/calendar",
    note: "Official source for the Worlds event window, federation, host city, and review metadata.",
  },
  {
    name: "Goodlift nominations",
    role: "Athlete entry source",
    status: "Manual review before markets",
    url: "https://goodlift.info/onenomination.php?cid=1171",
    note: "Use nominations to choose the individual athletes and classes that users can stake points on.",
  },
  {
    name: "LiftingCast",
    role: "Live result data",
    status: "Link/API candidate",
    url: "https://liftingcast.com/",
    note: "Use only for live result fields that LiftingCast exposes for the event, with official results as the final check.",
  },
  {
    name: "Eurovision Sport powerlifting",
    role: "Official livestream hub",
    status: "Manual validation",
    url: "https://eurovisionsport.com/en/explore/sports/powerlifting",
    note: "Use the official watch page for timestamped referee-call review when event streams are available.",
  },
  {
    name: "IPF YouTube livestream",
    role: "Manual video evidence",
    status: "Manual validation",
    url: "https://www.youtube.com/@theIPF",
    note: "Use if IPF mirrors the stream or publishes replay clips for depth, soft lockout, and similar referee-call markets.",
  },
];

export const trialCompetitions: TrialCompetition[] = [
  {
    name: "IPF 2026 World Classic Open Powerlifting Championships",
    date: "13-21 June 2026",
    location: "Druskininkai, Lithuania",
    federation: "IPF",
    source: "IPF invitation / Goodlift nominations",
    sourceUrl:
      "https://www.powerlifting.sport/fileadmin/ipf/data/championships/informations/2026/classic-powerlifting/lithuania/2026_Invitation_IPF_World_Classic_Open_Powerlifting_Championships__Lithuania-05.pdf",
    trialUse: "The only upcoming competition currently shown in the app.",
  },
];

export const ingestionSteps = [
  "Import historical OpenPowerlifting CSV snapshots into Supabase staging tables.",
  "Use Goodlift nominations to create athlete-specific market candidates for Worlds.",
  "Attach LiftingCast links for live result fields when an event feed is available.",
  "Queue referee-call markets for manual official livestream or YouTube replay review with timestamp evidence.",
  "Settle markets only after source evidence is attached and reviewed.",
];

export const resolutionWorkflows: ResolutionWorkflow[] = [
  {
    marketType: "Athlete nomination markets",
    primarySource: "Goodlift nominations",
    validation: "Admin verifies lifter, class, team, and final nomination status before market approval.",
    automation: "Semi-automated import candidate; no user-facing market until reviewed.",
  },
  {
    marketType: "Live result milestones",
    primarySource: "LiftingCast or official live result feed",
    validation: "Final result is reconciled with official IPF results before settlement.",
    automation: "Automatable only for exposed result fields such as attempts, totals, ranks, or records.",
  },
  {
    marketType: "Referee-call markets",
    primarySource: "Official livestream or IPF YouTube replay",
    validation: "Manual review records session, lifter, attempt, timestamp, call category, and reviewer notes.",
    automation: "Manual-first; computer vision can assist later but must not settle markets alone.",
  },
];

export const stagingTables: StagingTable[] = [
  {
    name: "data_sources",
    schema: "powerpicks_ingest",
    access: "service role only",
    purpose: "Registry for OPL, IPF, Goodlift, and other reviewed source links.",
  },
  {
    name: "import_batches",
    schema: "powerpicks_ingest",
    access: "service role only",
    purpose: "Tracks snapshot imports, row counts, revisions, and failure metadata.",
  },
  {
    name: "opl_meets_raw",
    schema: "powerpicks_ingest",
    access: "service role only",
    purpose: "Raw meet-level rows from OpenPowerlifting CSV snapshots.",
  },
  {
    name: "opl_entries_raw",
    schema: "powerpicks_ingest",
    access: "service role only",
    purpose: "Raw lifter and attempt rows for historical market simulations.",
  },
  {
    name: "official_competitions",
    schema: "public",
    access: "public read only",
    purpose: "Source-linked upcoming and reviewed competitions for the app.",
  },
  {
    name: "official_source_links",
    schema: "public",
    access: "public read only",
    purpose: "Official calendar, invitation, nomination, live, video, and CSV links attached to competitions.",
  },
];
