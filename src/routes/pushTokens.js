const express = require("express");
const router = express.Router();

const { savePushToken } = require("../services/pushTokens");

// POST /api/push-expo-tokens
// Body: { token: string, userId?: string, device?: object }
router.post("/push-expo-tokens", async (req, res) => {
  try {
    const { token, userId, device } = req.body || {};
    if (!token || typeof token !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'token'" });
    }
    await savePushToken({ token, userId, device });
    return res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("[push-expo-tokens] error:", err);
    return res
      .status(500)
      .json({ error: "Internal error", details: err.message });
  }
});

// Simple GET to verify routing works
router.get("/push-expo-tokens", (req, res) => {
  res.json({ status: "ok", route: "/api/push-expo-tokens" });
});

module.exports = router;
