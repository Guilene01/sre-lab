require("./tracer");

const express = require("express");
const cors = require("cors");
const { checkConnection } = require("./db");
const { router: chaosRouter, chaosMiddleware, isDbDropActive } = require("./chaos");
const apiRoutes = require("./routes");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(chaosMiddleware);

app.get("/healthz", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/readyz", async (req, res) => {
  if (isDbDropActive()) {
    return res.status(503).json({ status: "not ready", reason: "db connection dropped (chaos)" });
  }
  try {
    await checkConnection();
    res.json({ status: "ready" });
  } catch (err) {
    res.status(503).json({ status: "not ready", reason: err.message });
  }
});

app.use("/api/chaos", chaosRouter);
app.use("/api", apiRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

app.listen(PORT, () => {
  console.log(`ecommerce-backend listening on ${PORT}`);
});
