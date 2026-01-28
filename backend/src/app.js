const express = require("express");
const cors = require("cors");

const racesRoutes = require("./routes/races.routes");
const resultsRoutes = require("./routes/results.routes");
const liveRoutes = require("./routes/live.routes");
const exportRoutes = require("./routes/export.routes");

const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
  res.json({ message: "✅ Virtual Racing Backend Running" });
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/races", racesRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/live", liveRoutes);
app.use("/api/export", exportRoutes);


app.use(errorMiddleware);

module.exports = app;
