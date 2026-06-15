import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { PolicyNote } from "@/components/policy-note";
import { StakeFormPreview } from "@/components/stake-form-preview";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { formatDateTime, formatPoints } from "@/lib/format";
import { getOutcomePrices } from "@/lib/market-pricing";
import { getMarket, getMarketCompetition, markets } from "@/lib/mock-data";

type MarketDetailPageProps = {
  params: Promise<{ marketId: string }>;
};

export function generateStaticParams() {
  return markets.map((market) => ({
    marketId: market.id,
  }));
}

export default async function MarketDetailPage({ params }: MarketDetailPageProps) {
  const { marketId } = await params;
  const market = getMarket(marketId);

  if (!market) {
    notFound();
  }

  const competition = getMarketCompetition(market);
  const totalPool = market.outcomes.reduce((sum, outcome) => sum + outcome.totalStaked, 0);
  const outcomePrices = getOutcomePrices(market);

  return (
    <section className="page-section">
      <div className="section-inner">
        <PageHeader eyebrow={market.category} title={market.title} description={market.description} />
        <div className="stats-grid">
          <StatCard label="Total pool" value={formatPoints(totalPool)} detail="Fantasy points" />
          <StatCard label="Closes" value={formatDateTime(market.closeTime)} detail="Predictions lock then" />
          <StatCard label="Status" value={market.status} detail="Market lifecycle" />
        </div>

        <div className="grid-2 page-section">
          <section className="panel">
            <div className="section-heading">
              <p className="eyebrow">Market prices</p>
              <h2>Yes / No out of 100</h2>
              <p>
                Users stake points at the displayed Yes/No price. Winning settlement
                uses stake points x (opposite price / selected price), and losing
                settlement is zero.
              </p>
            </div>
            <div className="pool-grid">
              {outcomePrices.map((outcome) => (
                <div key={outcome.id}>
                  <span>{outcome.label}</span>
                  <strong>{outcome.price}</strong>
                  <small>of 100</small>
                  <small>{formatPoints(outcome.totalStaked)} fantasy points in pool</small>
                </div>
              ))}
            </div>
            <dl className="compact-list">
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge status={market.status} />
                </dd>
              </div>
              <div>
                <dt>Settlement rule</dt>
                <dd>{market.settlementRule}</dd>
              </div>
              <div>
                <dt>Evidence source</dt>
                <dd>{market.evidenceSource}</dd>
              </div>
              {competition ? (
                <div>
                  <dt>Competition</dt>
                  <dd>
                    <Link className="text-link" href={`/competitions/${competition.id}`}>
                      {competition.name}
                    </Link>
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
          <StakeFormPreview market={market} />
        </div>

        <PolicyNote />
      </div>
    </section>
  );
}
