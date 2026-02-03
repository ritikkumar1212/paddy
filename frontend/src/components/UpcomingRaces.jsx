export default function UpcomingRaces({ races }) {
  if (!races || !races.length) {
    return (
      <div className="panel">
        <div className="panel-header">
          <h3>Upcoming Races</h3>
          <span className="pill">Live Queue</span>
        </div>
        <p className="muted">No upcoming races</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Upcoming Races</h3>
        <span className="pill">Live Queue</span>
      </div>

      <div className="upcoming-list">
        {races.map((r) => (
          <div
            key={r.id}
            className="upcoming-item"
            onClick={() => {
              window.location.hash = `#/race/${r.id}`;
            }}
          >
            <span>🕒 {r.race_time_ist} IST</span>
            <span className="muted">Race #{r.id}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
