const { MongoClient } = require("mongodb");
require("../src/loadEnv").loadEnv();
const { loadConfig } = require("../src/config");
const { SEED_ID } = require("./fakePackages");

async function main() {
    const config = loadConfig();
    const client = new MongoClient(config.databaseUri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    try {
        const db = client.db(config.databaseName);
        const packageIds = await db.collection("packages").find({ ai_seed_id: SEED_ID }, { projection: { _id: 1 } }).toArray();
        const ids = packageIds.map(item => item._id);
        const details = ids.length ? await db.collection("packagedetails").deleteMany({ package_id: { $in: ids }, ai_seed_id: SEED_ID }) : { deletedCount: 0 };
        const removed = await db.collection("packages").deleteMany({ ai_seed_id: SEED_ID });
        console.log(`Removed ${removed.deletedCount} fake packages and ${details.deletedCount} fake detail records.`);
    } finally { await client.close(); }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
