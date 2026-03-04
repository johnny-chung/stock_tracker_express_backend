const express = require("express");
const router = express.Router();
const { getDb } = require("../db");

// GET /api/portfolio?ticker=TD.TO
router.get("/portfolio", async (req, res) => {
  try {
    const db = await getDb();
    const filter = req.query.ticker ? { ticker: req.query.ticker } : {};
    const docs = await db.collection("portfolio_state").find(filter).toArray();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch portfolio", details: err.message });
  }
});

module.exports = router;
