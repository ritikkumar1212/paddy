import { useNavigate } from "react-router-dom";

export default function Home() {
  const nav = useNavigate();

  return (
    <div className="app-shell">
      <div className="hero">
        <div>
          <p className="eyebrow">Virtual arena</p>
          <h1 className="hero-title">Paddy Games</h1>
          <p className="hero-subtitle">
            Track live virtual races, spot the winners, and stay ahead of the next
            sprint with a dashboard that updates in real time.
          </p>
        </div>

        <div className="hero-panel">
          <h3>Today&apos;s Pulse</h3>
          <ul>
            <li>
              <span>Live dashboards</span>
              <strong>24/7</strong>
            </li>
            <li>
              <span>Race refresh</span>
              <strong>5s</strong>
            </li>
            <li>
              <span>Data exports</span>
              <strong>Instant</strong>
            </li>
          </ul>
        </div>
      </div>

      <div className="card-grid">
        <GameCard title="🏇 Horse Racing" onClick={() => nav("/horse")} />
        <GameCard title="🎰 Slots (Coming Soon)" disabled />
        <GameCard title="🃏 Cards (Coming Soon)" disabled />
      </div>
    </div>
  );
}

function GameCard({ title, onClick, disabled }) {
  return (
    <div
      onClick={!disabled ? onClick : null}
      className={`game-card${disabled ? " disabled" : ""}`}
    >
      <h3>{title}</h3>
      <p className="muted" style={{ marginTop: 10 }}>
        {disabled ? "Launching soon" : "Enter the track"}
      </p>
    </div>
  );
}
