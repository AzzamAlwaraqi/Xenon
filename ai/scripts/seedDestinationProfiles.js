const { MongoClient } = require("mongodb");
require("../src/loadEnv").loadEnv();
const { loadConfig } = require("../src/config");
const { SEED_ID, profiles } = require("./destinationProfiles");

async function main() {
    const config = loadConfig();
    const client = new MongoClient(config.databaseUri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    try {
        const collection = client.db(config.aiDatabaseName).collection("destinationprofiles");
        await collection.createIndex({ siteKey: 1 }, { unique: true });
        for (const profile of profiles) {
            await collection.updateOne(
                { siteKey: profile.siteKey },
                { $set: { ...profile, status: "active", verifiedSource: "curated-local-demo", ai_seed_id: SEED_ID, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
                { upsert: true }
            );
        }
        console.log(`Seeded ${profiles.length} destination profiles into ${config.aiDatabaseName}.destinationprofiles.`);
    } finally { await client.close(); }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
