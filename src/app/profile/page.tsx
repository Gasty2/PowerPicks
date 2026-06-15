import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { formatPoints } from "@/lib/format";
import { predictions, wallet } from "@/lib/mock-data";

export default function ProfilePage() {
  return (
    <section className="page-section">
      <div className="section-inner">
        <PageHeader
          eyebrow="@white_lights"
          title="Alex Morgan"
          description="Public profile with fantasy points, prediction record, and credibility score."
        />
        <div className="stats-grid">
          <StatCard label="Monthly points" value={formatPoints(wallet.monthlyPoints)} detail="Current leaderboard month" />
          <StatCard label="Markets won" value={`${wallet.marketsWon}`} detail={`${wallet.marketsLost} markets lost`} />
          <StatCard label="Credibility score" value={`${wallet.credibilityScore}`} detail="Profile signal" />
        </div>

        <section className="page-section">
          <div className="section-heading">
            <p className="eyebrow">Prediction record</p>
            <h2>Active and settled predictions</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Market</th>
                  <th>Outcome</th>
                  <th>Points staked</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {predictions.length ? (
                  predictions.map((prediction) => (
                    <tr key={prediction.id}>
                      <td>{prediction.marketTitle}</td>
                      <td>{prediction.outcome}</td>
                      <td>{formatPoints(prediction.amount)}</td>
                      <td>
                        <StatusBadge status={prediction.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>No predictions yet. Worlds markets are pending source review.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}
