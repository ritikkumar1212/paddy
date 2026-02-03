export default function UpcomingRaces({ races }) {

  if (!races || !races.length) {
    return (
      <div style={{ marginTop: 20 }}>
        <h3>Upcoming Races</h3>
        <p style={{ color: "#9ca3af" }}>No upcoming races</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Upcoming Races</h3>

      {races.map(r => (
        <div
          key={r.id}
          style={{
            padding: 10,
            borderBottom: "1px solid #1f2937",
            cursor: "pointer"
          }}
          onClick={() => window.location.hash = `/race/${r.id}`}
        >
          🕒 {r.race_time_ist} IST
        </div>
      ))}
    </div>
  );
}
