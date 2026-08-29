const test = require("node:test");
const assert = require("node:assert/strict");
const { createPreferenceService, fallbackPreferences, parseTravelDate } = require("../src/services/preferenceService");

test("fallback parses English, Arabic, French, and Spanish", () => {
    const cases = [
        ["Cultural Jordan trip with my family, around 3000 dollars and not too hot", "USD"],
        ["أريد موقع ثقافي في الأردن مع عائلتي بميزانية حوالي 3000 دينار والجو غير حار", "JOD"],
        ["Voyage culturel en Jordanie avec ma famille, budget de 3000 euros, pas trop chaud", "EUR"],
        ["Viaje cultural en Jordania con mi familia, presupuesto de 3000 dólares, no muy caluroso", "USD"]
    ];
    for (const [prompt, currency] of cases) {
        const result = fallbackPreferences(prompt);
        assert.equal(result.destination, "Jordan");
        assert.ok(result.packageTypes.includes("cultural"));
        assert.equal(result.budget, 3000);
        assert.equal(result.currency, currency);
        assert.equal(result.people, 4);
        assert.equal(result.maxTemperatureC, 30);
    }
});

test("Ollama request uses Qwen structured output", async () => {
    let request;
    const fetchMock = async (url, options) => {
        request = { url, body: JSON.parse(options.body) };
        return { ok: true, json: async () => ({ message: { content: JSON.stringify({ destination: "Jordan", packageTypes: ["historical"], budget: 900, currency: "USD", people: 2, maxTemperatureC: 27, travelDate: "2026-09-01", familyFriendly: false }) } }) };
    };
    const service = createPreferenceService({ ollamaEnabled: true, ollamaBaseUrl: "http://ollama:11434", ollamaModel: "qwen3:4b", ollamaTimeoutMs: 1000 }, fetchMock);
    const result = await service.extract("Historical visit to Jordan for 2 people under $900");
    assert.equal(request.url, "http://ollama:11434/api/chat");
    assert.equal(request.body.model, "qwen3:4b");
    assert.equal(request.body.stream, false);
    assert.equal(request.body.format.type, "object");
    assert.equal(result.source, "ollama:qwen3:4b");
    assert.equal(result.people, 2);
});

test("malformed or unavailable Ollama falls back safely", async () => {
    const service = createPreferenceService({ ollamaEnabled: true, ollamaBaseUrl: "http://ollama", ollamaModel: "qwen3:4b", ollamaTimeoutMs: 1000 }, async () => { throw new Error("offline"); });
    const result = await service.extract("Cultural Jordan family trip around 1000 USD");
    assert.equal(result.source, "fallback");
    assert.equal(result.budget, 1000);
});

test("normalizes untrusted Ollama fields before database use", async () => {
    const service = createPreferenceService({ ollamaEnabled: true, ollamaBaseUrl: "http://ollama", ollamaModel: "qwen3:4b", ollamaTimeoutMs: 1000 }, async () => ({
        ok: true,
        json: async () => ({ message: { content: JSON.stringify({ destination: "x".repeat(500), packageTypes: ["cultural", "$where"], budget: -5, currency: "BAD", people: 10000, maxTemperatureC: 900, travelDate: "not-a-date", familyFriendly: true }) } })
    }));
    const result = await service.extract("Cultural Jordan request around 1000 USD");
    assert.deepEqual(result.packageTypes, ["cultural"]);
    assert.equal(result.people, 100);
    assert.equal(result.currency, "USD");
    assert.equal(result.budget, 1000);
    assert.equal(result.travelDate, null);
    assert.ok(result.destination.length <= 100);
});

test("parses dates and preserves conversational preferences", async () => {
    assert.equal(parseTravelDate("travel on 2026-09-05"), "2026-09-05");
    assert.equal(parseTravelDate("travel September 5", new Date("2026-08-27T00:00:00Z")), "2026-09-05");
    const service = createPreferenceService({ ollamaEnabled: false });
    const first = await service.extract("Cultural Jordan family trip under 300 JOD on September 5");
    const second = await service.extract("make it cheaper", first);
    assert.equal(second.destination, "Jordan");
    assert.deepEqual(second.packageTypes, ["cultural"]);
    assert.equal(second.travelDate.slice(5), "09-05");
    assert.equal(second.budget, 240);
});

test("extracts environmental exclusions, activities, and required services", () => {
    const result = fallbackPreferences("Family trip with hiking, no sandy places, not humid, and must include a guide and lunch");
    assert.deepEqual(result.avoidFeatures.sort(), ["humid", "sandy"]);
    assert.deepEqual(result.preferredActivities, ["hiking"]);
    assert.deepEqual(result.requiredServices.sort(), ["guide", "meals"]);
    assert.equal(result.maxHumidityPercent, 65);
});

test("extracts an explicit dated humidity preference", () => {
    const result = fallbackPreferences("Jordan trip with humidity below 55% on 2026-09-05");
    assert.equal(result.maxHumidityPercent, 55);
    assert.equal(result.travelDate, "2026-09-05");
});
