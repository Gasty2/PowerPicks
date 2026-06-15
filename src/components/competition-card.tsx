import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { Competition } from "@/types/domain";
import { StatusBadge } from "@/components/status-badge";

type CompetitionCardProps = {
  competition: Competition;
  marketCount: number;
};

export function CompetitionCard({ competition, marketCount }: CompetitionCardProps) {
  return (
    <article className="item-card">
      <div className="card-heading">
        <div>
          <p className="eyebrow">{competition.federation}</p>
          <h2>{competition.name}</h2>
        </div>
        <StatusBadge status={competition.status} />
      </div>
      <p>{competition.summary}</p>
      <dl className="compact-list">
        <div>
          <dt>Location</dt>
          <dd>{competition.location}</dd>
        </div>
        <div>
          <dt>Dates</dt>
          <dd>
            {formatDate(competition.startDate)} - {formatDate(competition.endDate)}
          </dd>
        </div>
        <div>
          <dt>Prediction markets</dt>
          <dd>{marketCount}</dd>
        </div>
      </dl>
      <Link className="text-link" href={`/competitions/${competition.id}`}>
        View competition
      </Link>
    </article>
  );
}
