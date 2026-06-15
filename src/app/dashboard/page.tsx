import Link from "next/link";
import { redirect } from "next/navigation";
import { logout } from "@/app/auth/actions";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { formatPoints } from "@/lib/format";
import { predictions } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login?next=/dashboard");
  }

  const [{ data: profile }, { data: wallet }] = await Promise.all([
    supabase.from("profiles").select("display_name, username").eq("id", user.id).maybeSingle(),
    supabase.from("wallets").select("monthly_points, lifetime_points").eq("user_id", user.id).maybeSingle(),
  ]);

  const displayName = profile?.username ?? profile?.display_name ?? user.email ?? "PowerPicks user";
  const email = user.email ?? "Email unavailable";
  const monthlyPoints = wallet?.monthly_points ?? 0;
  const lifetimePoints = wallet?.lifetime_points ?? monthlyPoints;
  const activePredictions = predictions.filter((prediction) => prediction.status === "active");
  const settledPredictions = predictions.filter((prediction) => prediction.status !== "active");

  return (
    <section className="page-section">
      <div className="section-inner">
        <PageHeader
          eyebrow="Dashboard"
          title="Your points and predictions"
          description="Track monthly fantasy points, active prediction markets, and settled results."
        />
        <section className="panel account-summary">
          <div>
            <p className="eyebrow">Signed in</p>
            <h2>{displayName}</h2>
            <p>{email}</p>
          </div>
          <form action={logout}>
            <button className="button-secondary" type="submit">
              Log out
            </button>
          </form>
        </section>

        <div className="stats-grid">
          <StatCard label="Monthly points" value={formatPoints(monthlyPoints)} detail="Resets for leaderboard play" />
          <StatCard label="Lifetime points" value={formatPoints(lifetimePoints)} detail="Fantasy points only" />
          <StatCard label="Prediction status" value="Pending" detail="Markets require source review" />
        </div>

        <div className="grid-2 page-section">
          <section className="panel">
            <div className="section-heading">
              <p className="eyebrow">Active</p>
              <h2>Current predictions</h2>
            </div>
            <div className="compact-list">
              {activePredictions.length ? (
                activePredictions.map((prediction) => (
                  <div key={prediction.id}>
                    <dt>
                      <Link className="text-link" href={`/markets/${prediction.marketId}`}>
                        {prediction.marketTitle}
                      </Link>
                    </dt>
                    <dd>
                      {prediction.outcome} - {formatPoints(prediction.amount)}
                    </dd>
                  </div>
                ))
              ) : (
                <div>
                  <dt>No active predictions</dt>
                  <dd>Worlds markets are pending source review before users can stake points.</dd>
                </div>
              )}
            </div>
          </section>
          <section className="panel">
            <div className="section-heading">
              <p className="eyebrow">Settled</p>
              <h2>Recent results</h2>
            </div>
            <div className="compact-list">
              {settledPredictions.length ? (
                settledPredictions.map((prediction) => (
                  <div key={prediction.id}>
                    <dt>{prediction.marketTitle}</dt>
                    <dd>
                      <StatusBadge status={prediction.status} />
                    </dd>
                  </div>
                ))
              ) : (
                <div>
                  <dt>No settled predictions</dt>
                  <dd>Results will appear after source-linked markets settle.</dd>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
