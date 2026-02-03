import { buildWinnerMap } from "../utils/winnerMap";

export default function RunnersTable({ runners, results }) {
  const winnerMap = buildWinnerMap(results || []);

  const getRowClass = (position) => {
    if (position === 1) return "row--gold";
    if (position === 2) return "row--silver";
    if (position === 3) return "row--bronze";
    if (position === 4) return "row--green";
    return "";
  };

  const medal = (pos) =>
    pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : pos === 4 ? "🏅" : "";

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Runners</h3>
        <span className="pill warning">Live Field</span>
      </div>

      <div className="table-shell">
        <table>
          <thead>
          <tr>
            <th>#</th>
            <th>Horse</th>
            <th>Jockey</th>
            <th>Odds</th>
          </tr>
        </thead>

        <tbody>
          {runners.map((r) => {
            const position = winnerMap[r.runner_number];

            return (
              <tr key={r.runner_number} className={getRowClass(position)}>
                <td>{r.runner_number}</td>
                <td>
                  {medal(position)} {r.horse_name}
                </td>
                <td>{r.jockey_name}</td>
                <td>{r.odds}</td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
    </div>
  );
}
