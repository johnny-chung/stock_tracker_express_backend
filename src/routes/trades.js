const express = require("express");
const router = express.Router();
const { getDb } = require("../db");

const TRADES_COL = "trades";
const PORTFOLIO_COL = "portfolio_state";

// GET /api/trades?ticker=TD.TO  — last 20 trades
router.get("/trades", async (req, res) => {
  try {
    const db = await getDb();
    const filter = req.query.ticker ? { ticker: req.query.ticker } : {};
    const docs = await db
      .collection(TRADES_COL)
      .find(filter)
      .sort({ _id: -1 })
      .limit(20)
      .toArray();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch trades", details: err.message });
  }
});

// POST /api/trades  — record a trade and update portfolio_state
router.post("/trades", async (req, res) => {
  try {
    const { ticker, action, shares, price, commission = 0, notes = "", ts } = req.body;

    // Basic validation
    if (!ticker || !action || !shares || !price) {
      return res.status(400).json({ error: "ticker, action, shares, price are required" });
    }
    if (!["BUY", "SELL"].includes(action.toUpperCase())) {
      return res.status(400).json({ error: "action must be BUY or SELL" });
    }
    const sharesNum = Number(shares);
    const priceNum = Number(price);
    const commissionNum = Number(commission) || 0;
    if (sharesNum <= 0 || priceNum <= 0) {
      return res.status(400).json({ error: "shares and price must be positive" });
    }

    const db = await getDb();
    const act = action.toUpperCase();

    // Load current portfolio state
    const portfolio = await db.collection(PORTFOLIO_COL).findOne({ ticker });
    if (!portfolio) {
      return res.status(404).json({ error: `No portfolio_state found for ticker=${ticker}` });
    }

    const oldShares = Number(portfolio.shares) || 0;
    const oldCash = Number(portfolio.cash) || 0;
    const oldAvgCost = Number(portfolio.avg_cost) || 0;

    // Validate SELL doesn't exceed holdings
    if (act === "SELL" && sharesNum > oldShares) {
      return res.status(400).json({
        error: `Cannot sell ${sharesNum} shares, only ${oldShares} held`,
      });
    }

    // Calculate new portfolio state
    let newShares, newCash, newAvgCost;
    if (act === "BUY") {
      newShares = oldShares + sharesNum;
      newCash = oldCash - priceNum * sharesNum - commissionNum;
      newAvgCost =
        newShares > 0
          ? (oldAvgCost * oldShares + priceNum * sharesNum + commissionNum) / newShares
          : 0;
    } else {
      newShares = oldShares - sharesNum;
      newCash = oldCash + priceNum * sharesNum - commissionNum;
      newAvgCost = newShares > 0 ? oldAvgCost : 0;
    }

    const now = new Date();
    const tradeDoc = {
      ticker,
      action: act,
      shares: sharesNum,
      price: priceNum,
      commission: commissionNum,
      notes: notes || "",
      ts: ts ? new Date(ts) : now,
      inserted_at: now,
    };

    // Insert trade + update portfolio atomically (best-effort, no transactions needed for single user)
    await db.collection(TRADES_COL).insertOne(tradeDoc);
    await db.collection(PORTFOLIO_COL).updateOne(
      { ticker },
      {
        $set: {
          cash: Math.round(newCash * 100) / 100,
          shares: newShares,
          avg_cost: Math.round(newAvgCost * 10000) / 10000,
          updated_at: now,
        },
      }
    );

    res.status(201).json({
      trade: tradeDoc,
      portfolio: { ticker, cash: newCash, shares: newShares, avg_cost: newAvgCost },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to record trade", details: err.message });
  }
});

module.exports = router;
