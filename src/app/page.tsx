import Link from "next/link";
import { CompetitionCard } from "@/components/competition-card";
import { MarketCard } from "@/components/market-card";
import { PlatformVisual } from "@/components/platform-visual";
import { PolicyNote } from "@/components/policy-note";
import { competitions, getCompetitionMarkets, markets } from "@/lib/mock-data";

export default function LandingPage() {
  const featuredCompetitions = competitions;
  const featuredMarkets = markets.slice(0, 2);

  return (
    <>
      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">Free-to-play fantasy powerlifting</p>
            <h1>PowerPicks</h1>
            <p>
              Follow the platform, read the attempts, and stake points on Yes/No prediction
              markets built around real powerlifting competition storylines.
            </p>
            <div className="hero-actions">
              <Link className="button-primary" href="/competitions">
                Browse competitions
              </Link>
              <Link className="button-secondary" href="/signup">
                Create account
              </Link>
            </div>
            <div className="policy-strip" aria-label="Fantasy points rules">
              <span>No cash value</span>
              <span>Cannot be bought</span>
              <span>Cannot be sold or transferred</span>
              <span>No money, crypto, or prizes</span>
            </div>
          </div>
          <PlatformVisual />
        </div>
      </section>

      <section className="page-section">
        <div className="section-inner">
          <div className="section-heading">
            <p className="eyebrow">Competitions</p>
            <h2>Worlds focus</h2>
            <p>PowerPicks is focused on one upcoming competition while source workflows are built out.</p>
          </div>
          <div className="grid-2">
            {featuredCompetitions.map((competition) => (
              <CompetitionCard
                key={competition.id}
                competition={competition}
                marketCount={getCompetitionMarkets(competition.id).length}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="section-inner">
          <div className="section-heading">
            <p className="eyebrow">Source-linked markets</p>
            <h2>Yes/No prediction templates</h2>
            <p>
              Markets stay pending until Goodlift nominations, live result feeds, or manual review evidence are attached.
            </p>
          </div>
          <div className="grid-2">
            {featuredMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="section-inner">
          <PolicyNote />
        </div>
      </section>
    </>
  );
}
