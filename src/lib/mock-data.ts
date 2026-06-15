import type {
  Competition,
  LeaderboardUser,
  Market,
  Prediction,
  Wallet,
} from "@/types/domain";

export const competitions: Competition[] = [
  {
    id: "ipf-world-classic-open-2026",
    name: "IPF 2026 World Classic Open Powerlifting Championships",
    federation: "IPF",
    location: "Druskininkai, Lithuania",
    startDate: "2026-06-13",
    endDate: "2026-06-21",
    status: "upcoming",
    summary:
      "The only upcoming competition in PowerPicks for now. Athlete-specific markets will be created from Goodlift nominations for this event.",
  },
];

export const markets: Market[] = [
  {
    id: "druskininkai-world-record",
    competitionId: "ipf-world-classic-open-2026",
    title: "Will at least one open world record be broken at Worlds?",
    description:
      "A source-linked Worlds market that settles from official IPF results and live competition evidence.",
    category: "Worlds market",
    closeTime: "2026-06-13T08:00:00.000Z",
    settlementRule:
      "Settles Yes if official IPF results identify at least one open world record during the championship.",
    evidenceSource: "IPF official results, LiftingCast live data if available, and linked championship evidence.",
    status: "pending",
    outcomes: [
      { id: "druskininkai-record-yes", label: "Yes", totalStaked: 0 },
      { id: "druskininkai-record-no", label: "No", totalStaked: 0 },
    ],
  },
  {
    id: "goodlift-nomination-total-line",
    competitionId: "ipf-world-classic-open-2026",
    title: "Goodlift nomination template: selected lifter total line",
    description:
      "This market is not assigned to a lifter yet. It becomes available only after Goodlift nominations confirm the athlete is entered at Worlds.",
    category: "Goodlift nominations",
    closeTime: "2026-06-13T08:00:00.000Z",
    settlementRule:
      "Settles from the selected lifter's official total after the athlete, class, and total line are reviewed by an admin.",
    evidenceSource: "Goodlift nominations for athlete entry, then LiftingCast/live results and official IPF results.",
    status: "pending",
    outcomes: [
      { id: "nomination-total-yes", label: "Yes", totalStaked: 0 },
      { id: "nomination-total-no", label: "No", totalStaked: 0 },
    ],
  },
  {
    id: "liftingcast-live-attempt-template",
    competitionId: "ipf-world-classic-open-2026",
    title: "LiftingCast template: selected live result milestone",
    description:
      "A live-data market template for milestones that can be validated from LiftingCast or official live result feeds.",
    category: "LiftingCast live data",
    closeTime: "2026-06-13T08:00:00.000Z",
    settlementRule:
      "Settles from the official live result feed and final IPF results after the exact session, lifter, and milestone are locked.",
    evidenceSource: "LiftingCast live data where available, backed by official IPF results.",
    status: "pending",
    outcomes: [
      { id: "live-milestone-yes", label: "Yes", totalStaked: 0 },
      { id: "live-milestone-no", label: "No", totalStaked: 0 },
    ],
  },
  {
    id: "manual-referee-call-review",
    competitionId: "ipf-world-classic-open-2026",
    title: "Manual review template: specific referee call",
    description:
      "For markets like depth or soft lockout calls, automation is not reliable enough yet. These require a timestamped livestream review before settlement.",
    category: "Manual video review",
    closeTime: "2026-06-13T08:00:00.000Z",
    settlementRule:
      "Settles only after an admin records the lifter, attempt, referee-call category, video timestamp, and review decision.",
    evidenceSource: "IPF or official YouTube livestream timestamp plus admin review notes.",
    status: "pending",
    outcomes: [
      { id: "referee-call-yes", label: "Yes", totalStaked: 0 },
      { id: "referee-call-no", label: "No", totalStaked: 0 },
    ],
  },
];

export const wallet: Wallet = {
  monthlyPoints: 1000,
  allTimeProfit: 0,
  totalStaked: 0,
  totalWon: 0,
  marketsWon: 0,
  marketsLost: 0,
  credibilityScore: 82,
};

export const predictions: Prediction[] = [];

export const leaderboard: LeaderboardUser[] = [
  {
    rank: 1,
    username: "white_lights",
    displayName: "Alex Morgan",
    monthlyPoints: 1740,
    allTimeProfit: 1120,
    marketsWon: 22,
    marketsLost: 8,
    accuracy: 73,
    credibilityScore: 94,
  },
  {
    rank: 2,
    username: "depth_called",
    displayName: "Priya Shah",
    monthlyPoints: 1585,
    allTimeProfit: 890,
    marketsWon: 19,
    marketsLost: 9,
    accuracy: 68,
    credibilityScore: 88,
  },
  {
    rank: 3,
    username: "platform_reader",
    displayName: "Theo Clarke",
    monthlyPoints: 1430,
    allTimeProfit: 620,
    marketsWon: 16,
    marketsLost: 7,
    accuracy: 70,
    credibilityScore: 86,
  },
  {
    rank: 4,
    username: "third_attempt",
    displayName: "Maya Brooks",
    monthlyPoints: 1320,
    allTimeProfit: 480,
    marketsWon: 14,
    marketsLost: 8,
    accuracy: 64,
    credibilityScore: 79,
  },
];

export const adminCounts = {
  pending: markets.filter((market) => market.status === "pending").length,
  open: markets.filter((market) => market.status === "open").length,
  closed: markets.filter((market) => market.status === "closed").length,
  settled: markets.filter((market) => market.status === "settled").length,
  voided: markets.filter((market) => market.status === "voided").length,
};

export function getCompetition(id: string) {
  return competitions.find((competition) => competition.id === id);
}

export function getCompetitionMarkets(competitionId: string) {
  return markets.filter((market) => market.competitionId === competitionId);
}

export function getMarket(id: string) {
  return markets.find((market) => market.id === id);
}

export function getMarketCompetition(market: Market) {
  return competitions.find((competition) => competition.id === market.competitionId);
}
