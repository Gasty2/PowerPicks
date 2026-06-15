import { formatPoints } from "@/lib/format";
import { getExampleSettlement, getOutcomePrices } from "@/lib/market-pricing";
import type { Market } from "@/types/domain";

type StakeFormPreviewProps = {
  market: Market;
};

export function StakeFormPreview({ market }: StakeFormPreviewProps) {
  const isOpen = market.status === "open";
  const outcomePrices = getOutcomePrices(market);
  const example = getExampleSettlement(market);

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Stake preview</p>
        <h2>Stake points</h2>
        <p>This placeholder does not submit or change fantasy points.</p>
      </div>
      <form className="stake-form">
        <fieldset disabled>
          <legend>Choose an outcome</legend>
          <div className="choice-grid">
            {outcomePrices.map((outcome) => (
              <label key={outcome.id}>
                <input type="radio" name="outcome" value={outcome.label} />
                <span>
                  {outcome.label} at {outcome.price}
                  <small>
                    Winning settlement uses {outcome.oppositePrice}/{outcome.price}
                  </small>
                </span>
              </label>
            ))}
          </div>
          <label className="input-label">
            Points to stake
            <input type="number" placeholder="100" min="1" max="100" />
          </label>
          <button className="button-primary" type="submit">
            {isOpen ? "Stake points" : "Market not open"}
          </button>
        </fieldset>
      </form>
      <div className="settlement-preview">
        <p className="eyebrow">Example settlement</p>
        <p>
          Stake {formatPoints(example.stakePoints)} points on {example.selected.label} at{" "}
          {example.selected.price}:{" "}
          <span className="formula">
            {formatPoints(example.stakePoints)} x ({example.selected.oppositePrice}/
            {example.selected.price}) = {formatPoints(example.winningSettlement)}
          </span>{" "}
          points if it wins, or zero if it loses.
        </p>
      </div>
    </section>
  );
}
