import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import RaceDetails from "./pages/RaceDetails";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/horse" element={<Dashboard />} />
      <Route path="/race/:id" element={<RaceDetails />} />
    </Routes>
  );
}
