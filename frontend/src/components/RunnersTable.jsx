import { buildWinnerMap } from "../utils/winnerMap";

export default function RunnersTable({ runners, results }) {
  const winnerMap = buildWinnerMap(results || []);

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
