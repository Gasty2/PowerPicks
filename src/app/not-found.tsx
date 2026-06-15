import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page-section">
      <div className="section-inner panel">
        <p className="eyebrow">Not found</p>
        <h1>Market or page unavailable</h1>
        <p>This placeholder app only includes the current PowerPicks routes and source-reviewed records.</p>
        <Link className="button-primary" href="/competitions">
          Browse competitions
        </Link>
      </div>
    </section>
  );
}
