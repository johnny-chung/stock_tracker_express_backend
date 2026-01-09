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
app.use("/api", pushTokensRouter);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "express_backend",
    timestamp: new Date().toISOString(),
  });
});

async function fetchLatest(collectionName, limit = 10) {
  const db = await getDb();
  const col = db.collection(collectionName);
  // Sort by ObjectId descending to approximate newest inserts
  const docs = await col.find({}).sort({ _id: -1 }).limit(limit).toArray();
  return docs;
}

app.get("/api/bars", async (req, res) => {
  try {
    const data = await fetchLatest("bars");
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
    const data = await fetchLatest("signals");
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
    const data = await fetchLatest("events");
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
