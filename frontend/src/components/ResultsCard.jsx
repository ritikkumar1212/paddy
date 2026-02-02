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
      <div
        style={{
          position: "sticky",
          top: 30,
          background: "linear-gradient(180deg,#020617,#020617)",
          border: "1px solid #1f2937",
          borderRadius: 16,
          padding: 20,
          minHeight: 260
        }}
      >
        <h3 style={{ marginBottom: 16 }}>
          Results – Last Completed Race
        </h3>

        <p style={{ color: "#9ca3af" }}>Waiting for results…</p>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "sticky",
        top: 30,
        background: "linear-gradient(180deg,#020617,#020617)",
        border: "1px solid #1f2937",
        borderRadius: 16,
        padding: 20,
        minHeight: 260
      }}
    >
      <h3 style={{ marginBottom: 16 }}>
        Results – Last Completed Race
      </h3>

      {results.map(r => (
        <div
          key={r.position}
          style={{
            background: "#020617",
            border: "1px solid #1f2937",
            borderRadius: 10,
            padding: 12,
            marginBottom: 10
          }}
        >
          <strong style={{ fontSize: 15 }}>
            {emoji(r.position)} Position {r.position}
          </strong>

          <div style={{ fontSize: 16, marginTop: 4 }}>
            {horseMap[r.horse_number] || "Unknown"}
          </div>
        </div>
      ))}
    </div>
  );
}
