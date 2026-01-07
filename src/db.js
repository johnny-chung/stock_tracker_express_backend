const { MongoClient } = require("mongodb");

let client;
let db;

async function connect() {
  if (db) return db;

  const uri = process.env.MONGO_URI;
  const dbName = process.env.MONGO_DB;

  if (!uri || !dbName) {
    throw new Error("Missing MONGO_URI or MONGO_DB environment variables");
  }

  client = new MongoClient(uri, {
    maxPoolSize: 10,
  });

  await client.connect();
  db = client.db(dbName);
  return db;
}

async function getDb() {
  return await connect();
}

process.on("SIGINT", async () => {
  try {
    if (client) await client.close();
  } catch (e) {
    // ignore
  }
  process.exit(0);
});

module.exports = { getDb };
