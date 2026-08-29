const { randomUUID } = require("node:crypto");
const { MongoClient, UUID } = require("mongodb");
require("../src/loadEnv").loadEnv();
const { loadConfig } = require("../src/config");
const { SEED_ID, packages } = require("./fakePackages");

async function main() {
    const config = loadConfig();
    const client = new MongoClient(config.databaseUri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    try {
        const db = client.db(config.databaseName);
        const packageCollection = db.collection("packages");
        const detailsCollection = db.collection("packagedetails");
        const startDate = new Date(Date.now() + 7 * 86400000);
        const endDate = new Date(Date.now() + 180 * 86400000);
        for (const item of packages) {
            const existing = await packageCollection.findOne({ ai_seed_id: SEED_ID, ai_seed_key: item.key }, { projection: { _id: 1 } });
            const packageId = existing?._id || new UUID(randomUUID());
            await packageCollection.updateOne(
                { ai_seed_id: SEED_ID, ai_seed_key: item.key },
                { $set: {
                    vendor_id: new UUID("00000000-0000-4000-8000-000000000001"),
                    package_name: item.name, package_description: item.description,
                    package_price: item.price, package_type: item.type, package_status: "active",
                    startDate, endDate, tags: item.tags, max_people: item.seats,
                    available_seats: item.seats, ratingsAverage: 4.5, ratingsQuantity: 12,
                    images: [{ url: "https://placehold.co/800x600?text=Xenon+Demo", public_id: `demo-${item.key}` }],
                    isDeleted: false, ai_seed_id: SEED_ID, ai_seed_key: item.key, updatedAt: new Date()
                }, $setOnInsert: { _id: packageId, createdAt: new Date() } },
                { upsert: true }
            );
            await detailsCollection.updateOne(
                { package_id: packageId },
                { $set: {
                    package_id: packageId,
                    itinerary: [{ day_number: 1, title: item.name, activities: item.activities }],
                    included_services: [{ title: "Local guide", description: "English and Arabic speaking guide" }],
                    excluded_services: [{ title: "Personal purchases", description: "Souvenirs and optional extras" }],
                    meeting_point: item.point, location_coordinates: { lat: item.lat, lng: item.lng },
                    cancellation_policy: "Free cancellation up to 48 hours before the demo trip.",
                    important_notes: "FAKE LOCAL TEST PACKAGE - NOT BOOKABLE", ai_seed_id: SEED_ID,
                    updatedAt: new Date()
                }, $setOnInsert: { _id: new UUID(randomUUID()), createdAt: new Date() } },
                { upsert: true }
            );
        }
        console.log(`Seeded ${packages.length} fake packages into ${db.databaseName}.`);
    } finally { await client.close(); }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
