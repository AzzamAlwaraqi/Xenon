const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");

async function withServer(options, callback) {
    const server = createApp(options);
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    try { await callback(`http://127.0.0.1:${server.address().port}`); }
    finally { await new Promise(resolve => server.close(resolve)); }
}

test("HTTP recommendation validates authorization and returns advice", async () => {
    const advisor = { recommend: async query => ({ query, recommendations: [] }) };
    await withServer({ advisor, repository: { health: async () => true }, apiKey: "secret" }, async base => {
        assert.equal((await fetch(`${base}/v1/recommendations`, { method: "POST", body: JSON.stringify({ query: "a valid travel request" }) })).status, 401);
        const response = await fetch(`${base}/v1/recommendations`, { method: "POST", headers: { Authorization: "Bearer secret", "Content-Type": "application/json" }, body: JSON.stringify({ query: "a valid travel request" }) });
        assert.equal(response.status, 200);
        assert.equal((await response.json()).data.query, "a valid travel request");
    });
});

test("HTTP endpoint rejects malformed and short inputs", async () => {
    await withServer({ advisor: {}, repository: { health: async () => true }, apiKey: null }, async base => {
        assert.equal((await fetch(`${base}/v1/recommendations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" })).status, 400);
        const invalid = await fetch(`${base}/v1/recommendations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: "x" }) });
        assert.equal(invalid.status, 400);
        assert.equal((await invalid.json()).error.code, "INVALID_QUERY");
        assert.equal((await fetch(`${base}/v1/recommendations`, { method: "POST", body: JSON.stringify({ query: "valid trip" }) })).status, 415);
        assert.equal((await fetch(`${base}/missing`)).status, 404);
    });
});

test("maintains preferences across a conversation", async () => {
    const seen = [];
    const advisor = { recommend: async (query, context) => {
        seen.push({ query, context });
        return { preferences: query.includes("cultural") ? { destination: "Jordan", packageTypes: ["cultural"], budget: 300 } : { ...context.preferences, budget: 200 }, recommendations: [] };
    } };
    await withServer({ advisor, repository: {}, apiKey: null }, async base => {
        const first = await fetch(`${base}/v1/recommendations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: "cultural Jordan trip" }) }).then(value => value.json());
        const conversationId = first.data.conversationId;
        const second = await fetch(`${base}/v1/recommendations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: "cheaper", conversationId }) }).then(value => value.json());
        assert.equal(second.data.conversationId, conversationId);
        assert.deepEqual(seen[1].context.preferences.packageTypes, ["cultural"]);
    });
});

test("health checks database connectivity", async () => {
    let checked = false;
    await withServer({ advisor: {}, repository: { health: async () => { checked = true; } }, apiKey: null }, async base => {
        assert.equal((await fetch(`${base}/health`)).status, 200);
        assert.equal(checked, true);
    });
});

test("supports Flutter web CORS preflight", async () => {
    await withServer({ advisor: {}, repository: {}, apiKey: null, corsOrigin: "*" }, async base => {
        const response = await fetch(`${base}/v1/recommendations`, { method: "OPTIONS", headers: { Origin: "http://localhost:5173", "Access-Control-Request-Method": "POST" } });
        assert.equal(response.status, 204);
        assert.equal(response.headers.get("access-control-allow-origin"), "*");
        assert.match(response.headers.get("access-control-allow-methods"), /POST/);
    });
});

test("protects health when an API key is configured", async () => {
    await withServer({ advisor: {}, repository: { health: async () => true }, apiKey: "secret" }, async base => {
        assert.equal((await fetch(`${base}/health`)).status, 401);
        assert.equal((await fetch(`${base}/health`, { headers: { Authorization: "Bearer secret" } })).status, 200);
    });
});

test("rate limits clients and rejects oversized bodies", async () => {
    await withServer({ advisor: { recommend: async () => ({}) }, repository: {}, apiKey: null, rateLimitPerMinute: 1 }, async base => {
        const first = await fetch(`${base}/v1/recommendations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: "a valid travel request" }) });
        assert.equal(first.status, 200);
        const second = await fetch(`${base}/v1/recommendations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: "another valid request" }) });
        assert.equal(second.status, 429);
    });
    await withServer({ advisor: {}, repository: {}, apiKey: null }, async base => {
        const response = await fetch(`${base}/v1/recommendations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: "x".repeat(17000) }) });
        assert.equal(response.status, 413);
    });
});

test("provides a versioned Flutter-friendly contract and strict validation", async () => {
    await withServer({ advisor: { recommend: async () => ({ outcome: "matches_found" }) }, repository: {}, apiKey: null }, async base => {
        const capabilities = await fetch(`${base}/v1/capabilities`).then(response => response.json());
        assert.equal(capabilities.apiVersion, "1.0");
        assert.ok(capabilities.data.features.includes("live humidity"));
        const unknown = await fetch(`${base}/v1/recommendations`, { method: "POST", headers: { "Content-Type": "application/json", "X-Request-Id": "flutter-test-123" }, body: JSON.stringify({ query: "Jordan family trip", injected: true }) });
        assert.equal(unknown.status, 400);
        const payload = await unknown.json();
        assert.equal(payload.error.code, "UNKNOWN_FIELDS");
        assert.equal(payload.requestId, "flutter-test-123");
        assert.equal(unknown.headers.get("x-content-type-options"), "nosniff");
    });
});

test("rejects browser origins outside the configured allowlist", async () => {
    await withServer({ advisor: {}, repository: {}, apiKey: null, corsOrigins: ["https://app.example.com"] }, async base => {
        const response = await fetch(`${base}/v1/capabilities`, { headers: { Origin: "https://evil.example" } });
        assert.equal(response.status, 403);
        assert.equal((await response.json()).error.code, "ORIGIN_NOT_ALLOWED");
    });
});
