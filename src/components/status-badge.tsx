import type { CompetitionStatus, MarketStatus, StakeStatus } from "@/types/domain";

type StatusBadgeProps = {
  status: CompetitionStatus | MarketStatus | StakeStatus;
};

const statusLabels: Record<string, string> = {
  active: "Active",
  closed: "Closed",
  complete: "Complete",
  live: "Live",
  lost: "Settled",
  open: "Open",
  pending: "Pending",
  refunded: "Refunded",
  settled: "Settled",
  upcoming: "Upcoming",
  voided: "Voided",
  won: "Won",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge status-${status}`}>{statusLabels[status]}</span>;
}
