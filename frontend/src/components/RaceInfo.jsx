export default function RaceInfo({ race, duplicateCount, lastSeen }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: 20, borderRadius: 8 }}>
      <p><b>Race Time (IST):</b> {race.race_time_ist}</p>
      <p><b>Race Time (UK):</b> {race.race_time_uk}</p>
      <p><b>Runners:</b> {race.runner_count}</p>
      <p><b>Scraped At:</b> {new Date(race.scraped_at).toLocaleString()}</p>
      <hr />
      <p><b>Duplicate Count:</b> {duplicateCount}</p>
      <p>
        <b>Last Seen:</b>{" "}
        {lastSeen ? new Date(lastSeen).toLocaleString() : "First time"}
      </p>
    </div>
  );
}
