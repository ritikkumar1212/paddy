import { useNavigate } from "react-router-dom";

export default function Home() {
  const nav = useNavigate();

  return (
    <div style={{ padding: 60 }}>
      <h1>🎮 Paddy Games</h1>

      <div style={{ display: "flex", gap: 30, marginTop: 40 }}>
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
      style={{
        padding: 40,
        background: "#020617",
        borderRadius: 16,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1
      }}
    >
      {title}
    </div>
  );
}
