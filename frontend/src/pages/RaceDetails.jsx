import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api/api";

export default function RaceDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/api/races/${id}`).then(res => setData(res.data.data));
  }, [id]);

  if (!data) return "Loading...";

  return (
    <div className="app-shell">
      <div className="top-bar">
        <div>
          <p className="eyebrow">Race recap</p>
          <h2>Race {data.race.race_time_ist}</h2>
        </div>
        <span className="pill">Race #{data.race.id}</span>
      </div>

      <div className="page-stack">
        <div className="panel">
          <div className="panel-header">
            <h3>Runners</h3>
            <span className="pill warning">Lineup</span>
          </div>
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Horse</th>
                  <th>Odds</th>
                </tr>
              </thead>
              <tbody>
                {data.runners.map((r) => (
                  <tr key={r.runner_number}>
                    <td>{r.runner_number}</td>
                    <td>{r.horse_name}</td>
                    <td>{r.odds}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Previous Occurrences</h3>
            <span className="pill">History</span>
          </div>
          <div className="results-list">
            {data.history.map((h) => (
              <div key={h.id} className="result-card">
                {h.scraped_at} — Winner: {h.winner}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
