import { useEffect, useState } from "react";
import { api } from "../api/api";
import RunnersTable from "../components/RunnersTable";
import ResultsCard from "../components/ResultsCard";
import UpcomingRaces from "../components/UpcomingRaces";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [dupes, setDupes] = useState([]);
  const [showDupes, setShowDupes] = useState(false);

  useEffect(() => {
    const fetchLive = async () => {
  try {
    const res = await api.get("/api/live/latest");
    const d = res.data.data;

    setData({
      current_race: d.current_race || null,
      runners: Array.isArray(d.runners) ? d.runners : [],
      last_results: Array.isArray(d.last_results) ? [...d.last_results] : [],
      upcoming: Array.isArray(d.upcoming) ? d.upcoming : [],
      duplicate_count: d.duplicate_count || 0,
      last_seen: d.last_seen || null
    });

  } catch (err) {
    console.error("Failed to fetch live race", err);
  }
};

    fetchLive();
    const interval = setInterval(fetchLive, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!data || !data.current_race) return <p style={{ padding: 20 }}>Loading…</p>;

  return (
    <>
      <div className="app-shell">
        <div className="top-bar">
          <div>
            <p className="eyebrow">Live dashboard</p>
            <h1>🏇 Paddy Virtual Racing</h1>
          </div>

          <div className="action-row">
            <span className="pill">Auto refresh · 5s</span>
            <a
              href="https://paddy-v3go.onrender.com/api/export/excel"
              target="_blank"
              rel="noopener noreferrer"
              className="button"
            >
              ⬇ Download Excel
            </a>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* LEFT */}
          <div className="page-stack">
            <RaceInfo race={data.current_race} />

            <div className="panel">
              <div className="panel-header">
                <h3>Signal Health</h3>
                <span className="pill">Monitoring</span>
              </div>
              <div className="info-grid">
                <InfoRow label="Duplicate Count" value={data.duplicate_count} />
                <InfoRow label="Last Seen" value={data.last_seen || "First time"} />
              </div>

              {data.duplicate_count >= 2 && (
                <button
                  onClick={async () => {
                    const res = await api.get(
                      `/api/races/duplicates/${data.current_race.id}`
                    );
                    setDupes(res.data.data);
                    setShowDupes(true);
                  }}
                  className="button secondary"
                  style={{ marginTop: 16 }}
                >
                  View Past Duplicate Races
                </button>
              )}
            </div>

            <RunnersTable runners={data.runners} results={data.last_results} />
          </div>

          {/* RIGHT */}
          <div className="page-stack">
            <ResultsCard results={data.last_results} runners={data.runners} />
            <UpcomingRaces races={data.upcoming} />
          </div>
        </div>
      </div>

      {/* DUPLICATE MODAL */}
      {showDupes && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Past Duplicate Races</h3>

            <div className="modal-list">
              {dupes.map((d) => (
                <div key={d.id} className="result-card">
                  Race #{d.id} – {d.race_time_uk} –{" "}
                  {new Date(d.scraped_at).toLocaleString()}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowDupes(false)}
              className="button secondary"
              style={{ marginTop: 16 }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ----------- helpers ----------- */

function RaceInfo({ race }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Current Race</h3>
        <span className="pill">Race #{race.id}</span>
      </div>

      <div className="info-grid">
        <InfoRow label="Race Time (IST)" value={race.race_time_ist} />
        <InfoRow label="Race Time (UK)" value={race.race_time_uk} />
        <InfoRow label="Runners" value={race.runner_count} />
        <InfoRow label="Race ID" value={race.id} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
