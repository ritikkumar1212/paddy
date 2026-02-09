export default function ResultsCard({ results = [], runners = [] }) {
  // Build runner map
  const horseMap = {};
  runners.forEach(r => {
    horseMap[r.runner_number] = r.horse_name;
  });

  const emoji = (p) =>
    p === 1 ? "🥇" : p === 2 ? "🥈" : p === 3 ? "🥉" : "🏅";

  // --------- FIX 1: Deduplicate results by position ---------
  const uniqueResults = Object.values(
    results.reduce((acc, r) => {
      if (!acc[r.position]) acc[r.position] = r;
      return acc;
    }, {})
  );

  // --------- FIX 2: Hard reset when empty ---------
  if (!uniqueResults.length) {
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
        {uniqueResults.map((r) => (
          <div key={r.position} className="result-card">
            <strong>
              {emoji(r.position)} Position {r.position}
            </strong>

            <div style={{ fontSize: 16, marginTop: 4 }}>
              {
                horseMap[r.horse_number] ||
                r.raw_text ||                 // fallback to scraped text
                "Waiting…"                    // final safety
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
