import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { formatPoints } from "@/lib/format";
import { predictions, wallet } from "@/lib/mock-data";

export default function DashboardPage() {
  const activePredictions = predictions.filter((prediction) => prediction.status === "active");
  const settledPredictions = predictions.filter((prediction) => prediction.status !== "active");

  return (
    <section className="page-section">
      <div className="section-inner">
        <PageHeader
          eyebrow="Dashboard"
          title="Your points and predictions"
          description="Track monthly fantasy points, active prediction markets, and settled results."
        />
        <div className="stats-grid">
          <StatCard label="Monthly points" value={formatPoints(wallet.monthlyPoints)} detail="Resets for leaderboard play" />
          <StatCard label="All-time profit" value={formatPoints(wallet.allTimeProfit)} detail="Fantasy points only" />
          <StatCard label="Credibility score" value={`${wallet.credibilityScore}`} detail="Profile signal" />
        </div>

        <div className="grid-2 page-section">
          <section className="panel">
            <div className="section-heading">
              <p className="eyebrow">Active</p>
              <h2>Current predictions</h2>
            </div>
            <div className="compact-list">
              {activePredictions.length ? (
                activePredictions.map((prediction) => (
                  <div key={prediction.id}>
                    <dt>
                      <Link className="text-link" href={`/markets/${prediction.marketId}`}>
                        {prediction.marketTitle}
                      </Link>
                    </dt>
                    <dd>
                      {prediction.outcome} - {formatPoints(prediction.amount)}
                    </dd>
                  </div>
                ))
              ) : (
                <div>
                  <dt>No active predictions</dt>
                  <dd>Worlds markets are pending source review before users can stake points.</dd>
                </div>
              )}
            </div>
          </section>
          <section className="panel">
            <div className="section-heading">
              <p className="eyebrow">Settled</p>
              <h2>Recent results</h2>
            </div>
            <div className="compact-list">
              {settledPredictions.length ? (
                settledPredictions.map((prediction) => (
                  <div key={prediction.id}>
                    <dt>{prediction.marketTitle}</dt>
                    <dd>
                      <StatusBadge status={prediction.status} />
                    </dd>
                  </div>
                ))
              ) : (
                <div>
                  <dt>No settled predictions</dt>
                  <dd>Results will appear after source-linked markets settle.</dd>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
