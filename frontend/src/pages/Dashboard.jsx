import { useEffect, useState } from "react";
import { api } from "../api/api";
import RunnersTable from "../components/RunnersTable";
import ResultsCard from "../components/ResultsCard";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await api.get("/api/live/latest");
        setData(res.data.data);
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
    <div style={{ padding: 30 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 25 }}>
  <h1>🏇 Paddy Virtual Racing</h1>

  <a
    href="https://paddy-v3go.onrender.com/api/export/excel"
    target="_blank"
    rel="noopener noreferrer"
    style={{
      color: "white",
      background: "#2563eb",
      padding: "8px 14px",
      borderRadius: 6,
      textDecoration: "none",
      height: "fit-content"
    }}
  >
    ⬇ Download Excel
  </a>
</div>


      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2.2fr 1fr",
          gap: 24,
          alignItems: "start"
        }}
      >
        {/* LEFT SIDE */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <RaceInfo race={data.current_race} />

          <div
            style={{
              background: "#020617",
              border: "1px solid #1f2937",
              borderRadius: 14,
              padding: 16
            }}
          >
            <InfoRow label="Duplicate Count" value={data.duplicate_count} />
            <InfoRow label="Last Seen" value={data.last_seen || "First time"} />
          </div>

          <RunnersTable
            runners={data.runners}
            results={data.last_results}
          />
        </div>

        {/* RIGHT SIDE */}
        <ResultsCard
          results={data.last_results}
          runners={data.runners}
        />
      </div>
    </div>
  );
}

/* ---------------- RACE INFO ---------------- */

function RaceInfo({ race }) {
  return (
    <div
      style={{
        background: "#020617",
        border: "1px solid #1f2937",
        borderRadius: 14,
        padding: 20
      }}
    >
      <h3 style={{ marginBottom: 12 }}>Current Race</h3>

      <InfoRow label="Race Time (IST)" value={race.race_time_ist} />
      <InfoRow label="Race Time (UK)" value={race.race_time_uk} />
      <InfoRow label="Runners" value={race.runner_count} />
      <InfoRow
        label="Scraped At"
        value={new Date(race.scraped_at).toLocaleString()}
      />
    </div>
  );
}

/* ---------------- INFO ROW ---------------- */

function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 6,
        fontSize: 14
      }}
    >
      <span style={{ color: "#9ca3af" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
