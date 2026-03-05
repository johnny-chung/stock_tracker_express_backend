const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();
const { getDb } = require("./src/db");

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));

// Routes
const pushTokensRouter = require("./src/routes/pushTokens");
const tradesRouter = require("./src/routes/trades");
const portfolioRouter = require("./src/routes/portfolio");
app.use("/api", pushTokensRouter);
app.use("/api", tradesRouter);
app.use("/api", portfolioRouter);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "express_backend",
    timestamp: new Date().toISOString(),
  });
});

async function fetchLatest(collectionName, { from, to, limit = 50 } = {}) {
  const db = await getDb();
  const col = db.collection(collectionName);
  const filter = {};
  if (from || to) {
    filter.ts = {};
    if (from) filter.ts.$gte = new Date(from);
    if (to) {
      // Include the full "to" day (end of day)
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      filter.ts.$lte = toDate;
    }
  }
  const docs = await col.find(filter).sort({ ts: -1 }).limit(limit).toArray();
  return docs;
}

app.get("/api/bars", async (req, res) => {
  try {
    const data = await fetchLatest("bars", {
      from: req.query.from,
      to: req.query.to,
      limit: parseInt(req.query.limit) || 50,
    });
    res.json(data);
  } catch (err) {
    console.error("Error fetching bars:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch bars", details: err.message });
  }
});

app.get("/api/signals", async (req, res) => {
  try {
    const data = await fetchLatest("signals", {
      from: req.query.from,
      to: req.query.to,
      limit: parseInt(req.query.limit) || 50,
    });
    res.json(data);
  } catch (err) {
    console.error("Error fetching signals:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch signals", details: err.message });
  }
});

app.get("/api/events", async (req, res) => {
  try {
    const data = await fetchLatest("events", {
      from: req.query.from,
      to: req.query.to,
      limit: parseInt(req.query.limit) || 50,
    });
    res.json(data);
  } catch (err) {
    console.error("Error fetching events:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch events", details: err.message });
  }
});

app.listen(port, () => {
  console.log(`Express backend listening on port ${port}`);
});
