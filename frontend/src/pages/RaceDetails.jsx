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
    <div style={{ padding:30 }}>
      <h2>Race {data.race.race_time_ist}</h2>

      <h3>Runners</h3>
      {data.runners.map(r => (
        <div key={r.runner_number}>
          {r.runner_number}. {r.horse_name} ({r.odds})
        </div>
      ))}

      <h3 style={{marginTop:20}}>Previous Occurrences</h3>

      {data.history.map(h => (
        <div key={h.id}>
          {h.scraped_at} — Winner: {h.winner}
        </div>
      ))}
    </div>
  );
}
