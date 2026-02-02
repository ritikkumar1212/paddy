import { buildWinnerMap } from "../utils/winnerMap";

export default function RunnersTable({ runners, results }) {
  const winnerMap = buildWinnerMap(results || []);

  const getRowStyle = (position) => {
    if (position === 1) return { background: "#FFD700", fontWeight: "bold" }; // gold
    if (position === 2) return { background: "#C0C0C0" }; // silver
    if (position === 3) return { background: "#CD7F32", color: "white" }; // bronze
    if (position === 4) return { background: "#90EE90" }; // green
    return {};
  };

  const medal = (pos) =>
    pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : pos === 4 ? "🏅" : "";

  return (
    <div style={{ flex: 2 }}>
      <h3>Runners</h3>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          borderRadius: 10,
          overflow: "hidden"
        }}
      >
        <thead style={{ background: "#222", color: "#fff" }}>
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
              <tr key={r.runner_number} style={getRowStyle(position)}>
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
  );
}
