import type { Market } from "@/types/domain";

export type OutcomePrice = Market["outcomes"][number] & {
  price: number;
  oppositePrice: number;
};

export function getOutcomePrices(market: Market): [OutcomePrice, OutcomePrice] {
  const [first, second] = market.outcomes;
  const totalPool = first.totalStaked + second.totalStaked;
  const firstPrice = totalPool > 0 ? Math.round((first.totalStaked / totalPool) * 100) : 50;
  const secondPrice = totalPool > 0 ? 100 - firstPrice : 50;

  return [
    {
      ...first,
      price: firstPrice,
      oppositePrice: secondPrice,
    },
    {
      ...second,
      price: secondPrice,
      oppositePrice: firstPrice,
    },
  ];
}

export function calculateWinningSettlement(
  stakePoints: number,
  selectedPrice: number,
  oppositePrice: number,
) {
  if (selectedPrice <= 0) {
    return 0;
  }

  return Math.round(stakePoints * (oppositePrice / selectedPrice));
}

export function getExampleSettlement(market: Market, stakePoints = 300) {
  const prices = getOutcomePrices(market);
  const selected = prices.reduce((lowest, outcome) =>
    outcome.price < lowest.price ? outcome : lowest,
  );

  return {
    stakePoints,
    selected,
    winningSettlement: calculateWinningSettlement(
      stakePoints,
      selected.price,
      selected.oppositePrice,
    ),
  };
}
