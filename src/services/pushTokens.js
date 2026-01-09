const { getDb } = require("../db");

const COLLECTION = "expo_push_tokens";

async function getCollection() {
  const db = await getDb();
  const col = db.collection(COLLECTION);
  // Ensure an index on token for fast upsert/dedupe
  try {
    await col.createIndex({ token: 1 }, { unique: true });
  } catch (e) {
    // ignore index errors (e.g., already exists)
  }
  return col;
}

/**
 * Upsert a device push token. If the token exists, update metadata; otherwise insert.
 * @param {{ userId?: string|null, token: string, device?: any }} payload
 */
async function savePushToken(payload) {
  const { userId = null, token, device = null } = payload || {};
  if (!token || typeof token !== "string") {
    throw new Error("Invalid token");
  }
  const col = await getCollection();
  await col.updateOne(
    { token },
    {
      $set: {
        userId,
        token,
        device,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );
}

async function removePushToken(token) {
  const col = await getCollection();
  await col.deleteOne({ token });
}

async function getTokensForUser(userId) {
  const col = await getCollection();
  const docs = await col.find({ userId }).toArray();
  return docs.map((d) => d.token);
}

async function getAllTokens() {
  const col = await getCollection();
  const docs = await col.find({}).toArray();
  return docs.map((d) => d.token);
}

module.exports = {
  savePushToken,
  removePushToken,
  getTokensForUser,
  getAllTokens,
};
