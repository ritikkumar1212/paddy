export default function ResultsCard({ results = [], runners = [] }) {
  const horseMap = {};
  runners.forEach(r => {
    horseMap[r.runner_number] = r.horse_name;
  });

  const emoji = (p) =>
    p === 1 ? "🥇" : p === 2 ? "🥈" : p === 3 ? "🥉" : "🏅";

  // HARD RESET WHEN EMPTY
  if (!Array.isArray(results) || results.length === 0) {
    return (
      <div className="panel" style={{ position: "sticky", top: 30 }}>
        <div className="panel-header">
          <h3>Results</h3>
          <span className="pill">Last Completed</span>
        </div>
        <p className="muted">Waiting for results…</p>
      </div>
    );
  }

  return (
    <div className="panel" style={{ position: "sticky", top: 30 }}>
      <div className="panel-header">
        <h3>Results</h3>
        <span className="pill">Last Completed</span>
      </div>

      <div className="results-list">
        {results.map((r) => (
          <div key={r.position} className="result-card">
            <strong>
              {emoji(r.position)} Position {r.position}
            </strong>

            <div style={{ fontSize: 16, marginTop: 4 }}>
              {horseMap[r.horse_number] || "Unknown"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
