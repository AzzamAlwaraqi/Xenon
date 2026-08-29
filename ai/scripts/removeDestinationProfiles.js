const { MongoClient } = require("mongodb");
require("../src/loadEnv").loadEnv();
const { loadConfig } = require("../src/config");
const { SEED_ID } = require("./destinationProfiles");

async function main() {
    const config = loadConfig();
    const client = new MongoClient(config.databaseUri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    try {
        const result = await client.db(config.aiDatabaseName).collection("destinationprofiles").deleteMany({ ai_seed_id: SEED_ID });
        console.log(`Removed ${result.deletedCount} seeded destination profiles.`);
    } finally { await client.close(); }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
