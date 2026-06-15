import Link from "next/link";
import { formatDateTime, formatPoints } from "@/lib/format";
import { getOutcomePrices } from "@/lib/market-pricing";
import type { Market } from "@/types/domain";
import { StatusBadge } from "@/components/status-badge";

type MarketCardProps = {
  market: Market;
};

export function MarketCard({ market }: MarketCardProps) {
  const totalPool = market.outcomes.reduce((sum, outcome) => sum + outcome.totalStaked, 0);
  const outcomePrices = getOutcomePrices(market);

  return (
    <article className="item-card market-card">
      <div className="card-heading">
        <div>
          <p className="eyebrow">{market.category}</p>
          <h2>{market.title}</h2>
        </div>
        <StatusBadge status={market.status} />
      </div>
      <p>{market.description}</p>
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
          <dt>Total pool</dt>
          <dd>{formatPoints(totalPool)} fantasy points</dd>
        </div>
        <div>
          <dt>Closes</dt>
          <dd>{formatDateTime(market.closeTime)}</dd>
        </div>
      </dl>
      <Link className="text-link" href={`/markets/${market.id}`}>
        View market
      </Link>
    </article>
  );
}
