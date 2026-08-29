// Conversation context is short-lived and rebuildable, so persistence is best-effort:
// every failure degrades to the in-process store rather than failing the customer's request.
function createConversationRepository(config, mongoFactory) {
    let client;
    let indexReady;

    async function getCollection() {
        if (!client) {
            const factory = mongoFactory || (() => {
                const { MongoClient } = require("mongodb");
                return new MongoClient(config.databaseUri, { serverSelectionTimeoutMS: 5000 });
            });
            client = factory();
            await client.connect();
        }
        const collection = client.db(config.aiDatabaseName).collection("aiconversations");
        indexReady = indexReady || collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => null);
        await indexReady;
        return collection;
    }

    async function read(conversationId) {
        const record = await (await getCollection()).findOne({ _id: conversationId }, { projection: { _id: 0, preferences: 1, topRecommendation: 1, expiresAt: 1 }, maxTimeMS: 3000 });
        if (!record || (record.expiresAt instanceof Date && record.expiresAt <= new Date())) return null;
        return { preferences: record.preferences ?? undefined, topRecommendation: record.topRecommendation ?? undefined };
    }

    async function write(conversationId, value, expiresAt) {
        await (await getCollection()).updateOne(
            { _id: conversationId },
            { $set: { preferences: value.preferences ?? null, topRecommendation: value.topRecommendation ?? null, expiresAt, updatedAt: new Date() } },
            { upsert: true }
        );
    }

    async function close() {
        if (client) await client.close();
        client = null;
        indexReady = undefined;
    }

    return { read, write, close };
}

module.exports = { createConversationRepository };
