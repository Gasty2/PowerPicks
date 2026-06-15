export type CompetitionStatus = "upcoming" | "live" | "complete";

export type MarketStatus = "pending" | "open" | "closed" | "settled" | "voided";

export type StakeStatus = "active" | "won" | "lost" | "refunded";

export type Role = "user" | "moderator" | "admin";

export type OutcomeLabel = "Yes" | "No";

export type Competition = {
  id: string;
  name: string;
  federation: string;
  location: string;
  startDate: string;
  endDate: string;
  status: CompetitionStatus;
  summary: string;
};

export type MarketOutcome = {
  id: string;
  label: OutcomeLabel;
  totalStaked: number;
};

export type Market = {
  id: string;
  competitionId: string;
  title: string;
  description: string;
  category: string;
  closeTime: string;
  settlementRule: string;
  evidenceSource: string;
  status: MarketStatus;
  outcomes: [MarketOutcome, MarketOutcome];
};

export type Wallet = {
  monthlyPoints: number;
  allTimeProfit: number;
  totalStaked: number;
  totalWon: number;
  marketsWon: number;
  marketsLost: number;
  credibilityScore: number;
};

export type Prediction = {
  id: string;
  marketId: string;
  marketTitle: string;
  outcome: OutcomeLabel;
  amount: number;
  status: StakeStatus;
};

export type LeaderboardUser = {
  rank: number;
  username: string;
  displayName: string;
  monthlyPoints: number;
  allTimeProfit: number;
  marketsWon: number;
  marketsLost: number;
  accuracy: number;
  credibilityScore: number;
};
