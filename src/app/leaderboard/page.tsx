import { PageHeader } from "@/components/page-header";
import { formatPoints } from "@/lib/format";
import { leaderboard } from "@/lib/mock-data";

export default function LeaderboardPage() {
  return (
    <section className="page-section">
      <div className="section-inner">
        <PageHeader
          eyebrow="Leaderboard"
          title="Monthly standings"
          description="Rankings use fantasy points, all-time profit, prediction accuracy, and credibility score."
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>User</th>
                <th>Monthly points</th>
                <th>All-time profit</th>
                <th>Markets won</th>
                <th>Markets lost</th>
                <th>Accuracy</th>
                <th>Credibility</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((user) => (
                <tr key={user.username}>
                  <td>{user.rank}</td>
                  <td>
                    {user.displayName}
                    <br />
                    <span className="eyebrow">@{user.username}</span>
                  </td>
                  <td>{formatPoints(user.monthlyPoints)}</td>
                  <td>{formatPoints(user.allTimeProfit)}</td>
                  <td>{user.marketsWon}</td>
                  <td>{user.marketsLost}</td>
                  <td>{user.accuracy}%</td>
                  <td>{user.credibilityScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
