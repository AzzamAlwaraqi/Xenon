const test = require("node:test");
const assert = require("node:assert/strict");
const { createConversationStore } = require("../src/http/conversationStore");
const { createConversationRepository } = require("../src/repositories/conversationRepository");
const { createPackageRepository } = require("../src/repositories/packageRepository");
const { createDestinationProfileRepository } = require("../src/repositories/destinationProfileRepository");

const CONFIG = { databaseUri: "mongodb://test", databaseName: "Xenon", aiDatabaseName: "XenonAI" };

/** Minimal MongoClient stand-in that records how it was driven. */
function fakeClient(collections = {}) {
    const calls = { connect: 0, close: 0, commands: [], databases: [] };
    return {
        calls,
        async connect() { calls.connect += 1; },
        async close() { calls.close += 1; },
        db(name) {
            calls.databases.push(name);
            return {
                collection: (collectionName) => collections[collectionName] || collections["*"] || {},
                command: async (command) => { calls.commands.push(command); return { ok: 1 }; }
            };
        }
    };
}

// ---------------------------------------------------------------- conversation store

test("conversation store returns an in-memory record before consulting the repository", async () => {
    let reads = 0;
    const repository = { read: async () => { reads += 1; return null; }, write: async () => {} };
    const store = createConversationStore({ ttlMs: 60000, maximum: 10, repository });
    await store.set("c1", { preferences: { people: 2 } });
    const record = await store.get("c1");
    assert.deepEqual(record.preferences, { people: 2 });
    assert.equal(reads, 0, "a cache hit must not reach the database");
});

test("conversation store rehydrates from the repository after a restart", async () => {
    const stored = { preferences: { destination: "Petra" }, topRecommendation: { id: "p1" } };
    const repository = { read: async (id) => (id === "c1" ? stored : null), write: async () => {} };
    const store = createConversationStore({ ttlMs: 60000, maximum: 10, repository });

    const record = await store.get("c1");
    assert.deepEqual(record.preferences, { destination: "Petra" });
    assert.deepEqual(record.topRecommendation, { id: "p1" });
    assert.equal(store.size(), 1, "the rehydrated record is cached for the next turn");
});

test("conversation store returns undefined when the repository has nothing", async () => {
    const store = createConversationStore({ ttlMs: 60000, maximum: 10, repository: { read: async () => null, write: async () => {} } });
    assert.equal(await store.get("missing"), undefined);
});

test("a repository read failure degrades to a cache miss, never to a request failure", async () => {
    const repository = { read: async () => { throw new Error("database unreachable"); }, write: async () => {} };
    const store = createConversationStore({ ttlMs: 60000, maximum: 10, repository });
    assert.equal(await store.get("c1"), undefined);
});

test("a repository write failure never propagates to the caller", async () => {
    const repository = { read: async () => null, write: async () => { throw new Error("database unreachable"); } };
    const store = createConversationStore({ ttlMs: 60000, maximum: 10, repository });
    await store.set("c1", { preferences: { people: 2 } });
    const record = await store.get("c1");
    assert.deepEqual(record.preferences, { people: 2 }, "the in-process copy still serves the follow-up");
});

test("a write persists the value and its expiry to the repository", async () => {
    const written = [];
    const repository = { read: async () => null, write: async (id, value, expiresAt) => { written.push({ id, value, expiresAt }); } };
    const store = createConversationStore({ ttlMs: 1800000, maximum: 10, repository });
    await store.set("c1", { preferences: { people: 3 } });

    assert.equal(written.length, 1);
    assert.equal(written[0].id, "c1");
    assert.deepEqual(written[0].value.preferences, { people: 3 });
    assert.ok(written[0].expiresAt instanceof Date);
    assert.ok(written[0].expiresAt.getTime() > Date.now(), "the expiry is in the future");
});

test("the store works with no repository configured", async () => {
    const store = createConversationStore({ ttlMs: 60000, maximum: 10 });
    await store.set("c1", { preferences: { people: 1 } });
    assert.deepEqual((await store.get("c1")).preferences, { people: 1 });
    assert.equal(await store.get("c2"), undefined);
});

test("an expired record is dropped rather than served", async () => {
    const store = createConversationStore({ ttlMs: 1, maximum: 10 });
    await store.set("c1", { preferences: { people: 1 } });
    await new Promise((resolve) => setTimeout(resolve, 12));
    assert.equal(await store.get("c1"), undefined);
});

test("the store evicts the least recently used conversation once it is full", async () => {
    const store = createConversationStore({ ttlMs: 60000, maximum: 2 });
    await store.set("a", { preferences: { n: 1 } });
    await store.set("b", { preferences: { n: 2 } });
    await store.get("a");                                  // "a" becomes the most recent
    await store.set("c", { preferences: { n: 3 } });

    assert.equal(store.size(), 2);
    assert.equal(await store.get("b"), undefined, "the least recently used entry is evicted");
    assert.ok(await store.get("a"));
    assert.ok(await store.get("c"));
});

test("cleanup removes expired records on demand", async () => {
    const store = createConversationStore({ ttlMs: 1000, maximum: 10 });
    await store.set("a", { preferences: {} });
    assert.equal(store.size(), 1);
    store.cleanup(Date.now() + 5000);
    assert.equal(store.size(), 0);
});

// ---------------------------------------------------------------- conversation repository

test("conversation repository stores context in the separate AI database with a TTL index", async () => {
    let indexSpec;
    let indexOptions;
    let upsert;
    const collection = {
        createIndex: async (spec, options) => { indexSpec = spec; indexOptions = options; },
        updateOne: async (filter, update, options) => { upsert = { filter, update, options }; },
        findOne: async () => null
    };
    const client = fakeClient({ aiconversations: collection });
    const repository = createConversationRepository(CONFIG, () => client);

    await repository.write("c1", { preferences: { people: 2 }, topRecommendation: null }, new Date("2030-01-01"));

    assert.deepEqual(client.calls.databases, ["XenonAI"]);
    assert.deepEqual(indexSpec, { expiresAt: 1 });
    assert.equal(indexOptions.expireAfterSeconds, 0, "MongoDB expires the document at expiresAt");
    assert.deepEqual(upsert.filter, { _id: "c1" });
    assert.equal(upsert.options.upsert, true);
    assert.deepEqual(upsert.update.$set.preferences, { people: 2 });
    assert.equal(upsert.update.$set.topRecommendation, null);
});

test("conversation repository reads back only the context fields", async () => {
    let projection;
    const collection = {
        createIndex: async () => {},
        findOne: async (filter, options) => {
            projection = options.projection;
            assert.deepEqual(filter, { _id: "c1" });
            return { preferences: { people: 2 }, topRecommendation: { id: "p1" }, expiresAt: new Date(Date.now() + 60000) };
        }
    };
    const repository = createConversationRepository(CONFIG, () => fakeClient({ aiconversations: collection }));
    const record = await repository.read("c1");

    assert.equal(projection._id, 0, "the raw id is never returned");
    assert.deepEqual(record, { preferences: { people: 2 }, topRecommendation: { id: "p1" } });
});

test("conversation repository treats an expired document as absent", async () => {
    const collection = {
        createIndex: async () => {},
        findOne: async () => ({ preferences: { people: 2 }, expiresAt: new Date(Date.now() - 1000) })
    };
    const repository = createConversationRepository(CONFIG, () => fakeClient({ aiconversations: collection }));
    assert.equal(await repository.read("c1"), null, "MongoDB's TTL sweep is not instant, so the read must check too");
});

test("conversation repository returns null for an unknown conversation", async () => {
    const collection = { createIndex: async () => {}, findOne: async () => null };
    const repository = createConversationRepository(CONFIG, () => fakeClient({ aiconversations: collection }));
    assert.equal(await repository.read("nope"), null);
});

test("conversation repository normalises a stored null back to undefined", async () => {
    const collection = {
        createIndex: async () => {},
        findOne: async () => ({ preferences: null, topRecommendation: null, expiresAt: new Date(Date.now() + 60000) })
    };
    const repository = createConversationRepository(CONFIG, () => fakeClient({ aiconversations: collection }));
    assert.deepEqual(await repository.read("c1"), { preferences: undefined, topRecommendation: undefined });
});

test("conversation repository opens one client and closes it exactly once", async () => {
    const collection = { createIndex: async () => {}, findOne: async () => null, updateOne: async () => {} };
    const client = fakeClient({ aiconversations: collection });
    const repository = createConversationRepository(CONFIG, () => client);

    await repository.read("a");
    await repository.read("b");
    assert.equal(client.calls.connect, 1, "the connection is reused across reads");

    await repository.close();
    assert.equal(client.calls.close, 1);
    await repository.close();
    assert.equal(client.calls.close, 1, "closing twice is safe");
});

// ---------------------------------------------------------------- package repository

test("package repository reports health with a ping and closes cleanly", async () => {
    const client = fakeClient({ packages: { aggregate: () => ({ toArray: async () => [] }) } });
    const repository = createPackageRepository(CONFIG, () => client);

    assert.equal(await repository.health(), true);
    assert.deepEqual(client.calls.commands, [{ ping: 1 }]);
    assert.deepEqual(client.calls.databases, ["Xenon"]);

    await repository.close();
    assert.equal(client.calls.close, 1);
});

test("package repository reuses one connection across queries", async () => {
    const client = fakeClient({ packages: { aggregate: () => ({ toArray: async () => [] }) } });
    const repository = createPackageRepository(CONFIG, () => client);
    await repository.findCandidates({ people: 1, packageTypes: [] });
    await repository.findCandidates({ people: 2, packageTypes: [] });
    assert.equal(client.calls.connect, 1);
});

test("package repository reconnects after a close", async () => {
    let created = 0;
    const factory = () => { created += 1; return fakeClient({ packages: { aggregate: () => ({ toArray: async () => [] }) } }); };
    const repository = createPackageRepository(CONFIG, factory);
    await repository.findCandidates({ people: 1, packageTypes: [] });
    await repository.close();
    await repository.findCandidates({ people: 1, packageTypes: [] });
    assert.equal(created, 2);
});

test("package repository escapes a destination before using it in a regex", async () => {
    let pipeline;
    const client = fakeClient({ packages: { aggregate(value) { pipeline = value; return { toArray: async () => [] }; } } });
    const repository = createPackageRepository(CONFIG, () => client);
    await repository.findCandidates({ people: 1, packageTypes: [], destination: "Wadi Rum (.*)" });

    const stage = pipeline.find((s) => s.$set && s.$set.destinationMatch);
    const regex = stage.$set.destinationMatch.$cond[0].$or[0].$regexMatch.regex;
    assert.ok(regex.includes("\\(") && regex.includes("\\."), "regex metacharacters are neutralised");
    assert.ok(!regex.includes("(.*)"), "an unescaped wildcard would match every package");
});

test("package repository ranks by destination without filtering on it", async () => {
    let pipeline;
    const client = fakeClient({ packages: { aggregate(value) { pipeline = value; return { toArray: async () => [] }; } } });
    const repository = createPackageRepository(CONFIG, () => client);
    await repository.findCandidates({ people: 2, packageTypes: [], destination: "Petra" });

    assert.equal(pipeline[0].$match.package_name, undefined, "destination must not narrow the match stage");
    const sort = pipeline.find((s) => s.$sort);
    assert.equal(sort.$sort.destinationMatch, -1, "destination only influences ordering");
});

test("package repository never widens a past travel date into expired packages", async () => {
    let pipeline;
    const client = fakeClient({ packages: { aggregate(value) { pipeline = value; return { toArray: async () => [] }; } } });
    const repository = createPackageRepository(CONFIG, () => client);
    await repository.findCandidates({ people: 1, packageTypes: [], travelDate: "2001-01-01" });

    const endDate = pipeline[0].$match.endDate.$gte;
    assert.ok(endDate.getTime() >= Date.now() - 5000, "a past date must not resurrect expired packages");
});

test("package repository omits optional filters that were not requested", async () => {
    let pipeline;
    const client = fakeClient({ packages: { aggregate(value) { pipeline = value; return { toArray: async () => [] }; } } });
    const repository = createPackageRepository(CONFIG, () => client);
    await repository.findCandidates({ people: 2, packageTypes: [] });

    const match = pipeline[0].$match;
    assert.equal(match.package_type, undefined);
    assert.equal(match.package_price, undefined);
    assert.equal(match.startDate, undefined);
    assert.equal(match.package_status, "active");
    assert.deepEqual(match.isDeleted, { $ne: true });
});

test("package repository caps the candidate set", async () => {
    let pipeline;
    const client = fakeClient({ packages: { aggregate(value) { pipeline = value; return { toArray: async () => [] }; } } });
    const repository = createPackageRepository(CONFIG, () => client);
    await repository.findCandidates({ people: 1, packageTypes: [] });
    assert.equal(pipeline.at(-1).$limit, 120);
});

// ---------------------------------------------------------------- destination profiles

test("destination profile repository reports health with a bounded findOne", async () => {
    let options;
    const collection = { findOne: async (filter, config) => { options = config; return { _id: "x" }; }, find: () => ({ toArray: async () => [] }) };
    const client = fakeClient({ destinationprofiles: collection });
    const repository = createDestinationProfileRepository(CONFIG, () => client);

    assert.equal(await repository.health(), true);
    assert.equal(options.maxTimeMS, 3000, "health checks must not hang the service");
});

test("destination profile repository reuses and then releases its client", async () => {
    const collection = { find: () => ({ toArray: async () => [] }), findOne: async () => null };
    const client = fakeClient({ destinationprofiles: collection });
    const repository = createDestinationProfileRepository(CONFIG, () => client);

    await repository.findAll();
    await repository.findAll();
    assert.equal(client.calls.connect, 1);

    await repository.close();
    assert.equal(client.calls.close, 1);
    await repository.close();
    assert.equal(client.calls.close, 1);
});

test("destination profile repository bounds its read and hides internal ids", async () => {
    let options;
    const collection = { find: (filter, config) => { options = config; return { toArray: async () => [] }; } };
    const repository = createDestinationProfileRepository(CONFIG, () => fakeClient({ destinationprofiles: collection }));
    await repository.findAll();

    assert.equal(options.maxTimeMS, 3000);
    assert.equal(options.projection._id, 0);
    assert.equal(options.projection.siteKey, 1);
});
