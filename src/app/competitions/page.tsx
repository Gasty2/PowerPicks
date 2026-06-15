import { CompetitionCard } from "@/components/competition-card";
import { PageHeader } from "@/components/page-header";
import { competitions, getCompetitionMarkets } from "@/lib/mock-data";

export default function CompetitionsPage() {
  return (
    <section className="page-section">
      <div className="section-inner">
        <PageHeader
          eyebrow="Competitions"
          title="World Championships"
          description="The app is focused on the IPF 2026 World Classic Open Powerlifting Championships while source-linked market systems are built."
        />
        <div className="grid-3">
          {competitions.map((competition) => (
            <CompetitionCard
              key={competition.id}
              competition={competition}
              marketCount={getCompetitionMarkets(competition.id).length}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
