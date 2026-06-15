import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { adminCounts, competitions, markets } from "@/lib/mock-data";

export default function AdminPage() {
  return (
    <section className="page-section">
      <div className="section-inner">
        <PageHeader
          eyebrow="Admin"
          title="Market operations"
          description="Placeholder controls for managing competitions, market review, closing, settlement, and voiding."
        />
        <div className="stats-grid">
          <StatCard label="Pending markets" value={`${adminCounts.pending}`} detail="Awaiting review" />
          <StatCard label="Open markets" value={`${adminCounts.open}`} detail="Accepting fantasy points" />
          <StatCard label="Closed markets" value={`${adminCounts.closed}`} detail="Ready for settlement" />
          <StatCard label="Settled markets" value={`${adminCounts.settled}`} detail="Results applied" />
          <StatCard label="Voided markets" value={`${adminCounts.voided}`} detail="Fantasy points returned" />
          <StatCard label="Competitions" value={`${competitions.length}`} detail="Worlds only" />
        </div>

        <section className="page-section">
          <div className="grid-2">
            <section className="panel">
              <div className="section-heading">
                <p className="eyebrow">Actions</p>
                <h2>Admin workflow placeholders</h2>
              </div>
              <div className="action-list">
                <button type="button">Create competition</button>
                <button type="button">Create market</button>
                <button type="button">Approve markets</button>
                <button type="button">Attach Goodlift nominations</button>
                <button type="button">Attach LiftingCast source</button>
                <button type="button">Queue video review</button>
                <button type="button">Close markets</button>
                <button type="button">Settle markets</button>
                <button type="button">Void markets</button>
              </div>
            </section>
            <section className="panel">
              <div className="section-heading">
                <p className="eyebrow">Markets</p>
                <h2>Review queue</h2>
              </div>
              <div className="compact-list">
                {markets.map((market) => (
                  <div key={market.id}>
                    <dt>{market.title}</dt>
                    <dd>
                      <StatusBadge status={market.status} />
                    </dd>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </section>
  );
}
