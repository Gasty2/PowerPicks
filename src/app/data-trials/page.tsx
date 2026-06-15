import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import {
  dataSources,
  ingestionSteps,
  resolutionWorkflows,
  stagingTables,
  trialCompetitions,
} from "@/lib/real-data-sources";
import { getOfficialCompetitionSnapshot } from "@/lib/supabase-public-data";

export const dynamic = "force-dynamic";

export default async function DataTrialsPage() {
  const officialCompetition = await getOfficialCompetitionSnapshot("ipf-world-classic-open-2026");

  return (
    <section className="page-section">
      <div className="section-inner">
        <PageHeader
          eyebrow="Data trials"
          title="Real powerlifting sources"
          description="A staged path for previous results, upcoming competitions, and live-source links before automated ingestion goes near production."
        />

        <div className="stats-grid">
          <StatCard label="Historical source" value="OPL" detail="Nightly CSV snapshots" />
          <StatCard label="Upcoming target" value="Worlds" detail="IPF Classic Open only" />
          <StatCard label="Validation" value="Manual" detail="Required for referee calls" />
        </div>

        <section className="page-section">
          <div className="section-heading">
            <p className="eyebrow">Source registry</p>
            <h2>What PowerPicks can safely connect to</h2>
            <p>
              Historical trials should start with public OpenPowerlifting data. Live meet
              data should come from Goodlift nominations, LiftingCast feeds where available,
              and manual livestream review for referee-call markets.
            </p>
          </div>
          <div className="grid-2">
            {dataSources.map((source) => (
              <article className="item-card source-card" key={source.name}>
                <div className="card-heading">
                  <div>
                    <p className="eyebrow">{source.role}</p>
                    <h2>{source.name}</h2>
                  </div>
                  <span className="source-status">{source.status}</span>
                </div>
                <p>{source.note}</p>
                <a className="text-link" href={source.url} target="_blank" rel="noreferrer">
                  Open source
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="page-section">
          <div className="section-heading">
            <p className="eyebrow">Competition scope</p>
            <h2>Single upcoming meet target</h2>
            <p>
              For now, PowerPicks should show only the IPF World Classic Open
              Powerlifting Championships in Druskininkai.
            </p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Competition</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Source</th>
                  <th>Trial use</th>
                </tr>
              </thead>
              <tbody>
                {trialCompetitions.map((competition) => (
                  <tr key={competition.name}>
                    <td>
                      {competition.name}
                      <br />
                      <span className="eyebrow">{competition.federation}</span>
                    </td>
                    <td>{competition.date}</td>
                    <td>{competition.location}</td>
                    <td>
                      <a className="text-link" href={competition.sourceUrl} target="_blank" rel="noreferrer">
                        {competition.source}
                      </a>
                    </td>
                    <td>{competition.trialUse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="page-section">
          <div className="section-heading">
            <p className="eyebrow">Resolution workflow</p>
            <h2>How market evidence should be validated</h2>
            <p>
              Athlete names should come from Goodlift nominations. Live result markets
              should use LiftingCast or official live feeds. Referee-call markets need
              manual timestamp review from the official livestream.
            </p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Market type</th>
                  <th>Primary source</th>
                  <th>Validation</th>
                  <th>Automation</th>
                </tr>
              </thead>
              <tbody>
                {resolutionWorkflows.map((workflow) => (
                  <tr key={workflow.marketType}>
                    <td>{workflow.marketType}</td>
                    <td>{workflow.primarySource}</td>
                    <td>{workflow.validation}</td>
                    <td>{workflow.automation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="page-section">
          <div className="section-heading">
            <p className="eyebrow">Supabase staging</p>
            <h2>Tables now ready for imports</h2>
            <p>
              The raw import tables are private and service-role only. The app-facing
              official competition tables are public read-only with RLS policies.
            </p>
          </div>
          <div className="grid-2">
            <article className="item-card">
              <p className="eyebrow">Live database check</p>
              {officialCompetition.state === "connected" ? (
                <>
                  <h2>{officialCompetition.competition.name}</h2>
                  <p>
                    {officialCompetition.competition.status} from {officialCompetition.competition.start_date} to{" "}
                    {officialCompetition.competition.end_date} in {officialCompetition.competition.location_city},{" "}
                    {officialCompetition.competition.location_country}.
                  </p>
                </>
              ) : (
                <>
                  <h2>
                    {officialCompetition.state === "missing-env" ? "Waiting for Supabase env" : "REST check unavailable"}
                  </h2>
                  <p>{officialCompetition.message}</p>
                </>
              )}
            </article>
            <article className="item-card">
              <p className="eyebrow">Source links</p>
              <h2>
                {officialCompetition.state === "connected"
                  ? `${officialCompetition.competition.official_source_links?.length ?? 0} reviewed links`
                  : "Pending REST check"}
              </h2>
              <p>
                Official rows stay read-only to the app. Import workers will use service-role access server-side only.
              </p>
            </article>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Table</th>
                  <th>Schema</th>
                  <th>Access</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                {stagingTables.map((table) => (
                  <tr key={`${table.schema}.${table.name}`}>
                    <td>{table.name}</td>
                    <td>{table.schema}</td>
                    <td>{table.access}</td>
                    <td>{table.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <p className="eyebrow">Ingestion path</p>
            <h2>Supabase-ready staging sequence</h2>
          </div>
          <ol className="step-list">
            {ingestionSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <Link className="button-secondary" href="/competitions/ipf-world-classic-open-2026">
            View 2026 trial competition
          </Link>
        </section>
      </div>
    </section>
  );
}
