function createDestinationProfileRepository(config, mongoFactory) {
    let client;
    async function getCollection() {
        if (!client) {
            const factory = mongoFactory || (() => {
                const { MongoClient } = require("mongodb");
                return new MongoClient(config.databaseUri, { readPreference: "secondaryPreferred", serverSelectionTimeoutMS: 5000 });
            });
            client = factory();
            await client.connect();
        }
        return client.db(config.aiDatabaseName).collection("destinationprofiles");
    }

    async function findAll() {
        return (await getCollection()).find(
            { status: "active" },
            { projection: { _id: 0, siteKey: 1, name: 1, aliases: 1, environmentTags: 1, accessibilityTags: 1, climateNotes: 1, terrainNotes: 1, verifiedSource: 1 }, maxTimeMS: 3000 }
        ).toArray();
    }

    async function health() {
        await (await getCollection()).findOne({}, { projection: { _id: 1 }, maxTimeMS: 3000 });
        return true;
    }

    async function close() {
        if (client) await client.close();
        client = null;
    }

    return { findAll, health, close };
}

module.exports = { createDestinationProfileRepository };
