import { notFound } from "next/navigation";
import { MarketCard } from "@/components/market-card";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";
import { competitions, getCompetition, getCompetitionMarkets } from "@/lib/mock-data";

type CompetitionDetailPageProps = {
  params: Promise<{ competitionId: string }>;
};

export function generateStaticParams() {
  return competitions.map((competition) => ({
    competitionId: competition.id,
  }));
}

export default async function CompetitionDetailPage({ params }: CompetitionDetailPageProps) {
  const { competitionId } = await params;
  const competition = getCompetition(competitionId);

  if (!competition) {
    notFound();
  }

  const competitionMarkets = getCompetitionMarkets(competition.id);
  const openMarkets = competitionMarkets.filter((market) => market.status === "open").length;

  return (
    <section className="page-section">
      <div className="section-inner">
        <PageHeader
          eyebrow={competition.federation}
          title={competition.name}
          description={competition.summary}
        />
        <div className="stats-grid">
          <StatCard label="Location" value={competition.location} detail="Competition venue" />
          <StatCard
            label="Dates"
            value={`${formatDate(competition.startDate)}`}
            detail={`Ends ${formatDate(competition.endDate)}`}
          />
          <StatCard label="Open markets" value={`${openMarkets}`} detail={`${competitionMarkets.length} total`} />
        </div>

        <section className="page-section">
          <div className="section-heading">
            <p className="eyebrow">Status</p>
            <h2>
              <StatusBadge status={competition.status} />
            </h2>
          </div>
          <div className="grid-2">
            {competitionMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
