import { useEffect, useState } from "react";
import { api } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function UpcomingRaces() {
  const [races, setRaces] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/races/upcoming").then(res => {
      setRaces(res.data.data || []);
    });
  }, []);

  return (
    <div style={{ background:"#020617", padding:16, borderRadius:14 }}>
      <h3>Upcoming Races</h3>

      {races.map(r => (
        <div
          key={r.id}
          onClick={() => navigate(`/race/${r.id}`)}
          style={{
            cursor:"pointer",
            padding:10,
            borderBottom:"1px solid #1f2937"
          }}
        >
          ⏱ {r.race_time_ist}
        </div>
      ))}
    </div>
  );
}
