const test = require("node:test");
const assert = require("node:assert/strict");
const { createCurrencyService } = require("../src/services/currencyService");
const { createWeatherService } = require("../src/services/weatherService");

const config = { externalTimeoutMs: 1000 };

test("currency converts, caches, and handles same currencies", async () => {
    let calls = 0;
    const service = createCurrencyService(config, async () => { calls++; return { ok: true, json: async () => ({ rate: 1.41, date: "2026-08-26" }) }; });
    assert.equal((await service.convert(100, "USD", "USD")).convertedAmount, 100);
    assert.equal((await service.convert(100, "JOD", "USD")).convertedAmount, 141);
    assert.equal((await service.convert(200, "JOD", "USD")).convertedAmount, 282);
    assert.equal(calls, 1);
});

test("currency failure returns null", async () => {
    const service = createCurrencyService(config, async () => ({ ok: false }));
    assert.equal(await service.convert(100, "JOD", "USD"), null);
});

test("weather maps provider response", async () => {
    let calls = 0;
    const service = createWeatherService(config, async url => {
        calls++;
        assert.match(String(url), /latitude=30\.3285/);
        assert.match(String(url), /relative_humidity_2m/);
        return { ok: true, json: async () => ({ daily: { time: ["2026-08-26"], temperature_2m_min: [20], temperature_2m_max: [28], precipitation_probability_max: [5], weather_code: [1] }, hourly: { relative_humidity_2m: [40, 50, 60] } }) };
    }, () => new Date("2026-08-26T00:00:00Z"));
    const first = await service.forecast(30.3285, 35.4444);
    assert.equal(first.averageHumidityPercent, 50);
    assert.equal(first.maximumHumidityPercent, 60);
    assert.equal(first.source, "Open-Meteo");
    assert.equal(first.cached, false);
    assert.equal((await service.forecast(30.3285, 35.4444)).cached, true);
    assert.equal(calls, 1);
});

test("weather rejects missing coordinates and distant dates", async () => {
    const service = createWeatherService(config, async () => { throw new Error("must not call"); }, () => new Date("2026-08-26T00:00:00Z"));
    assert.equal(await service.forecast(undefined, 35), null);
    assert.equal((await service.forecast(30, 35, "2027-01-01")).available, false);
    assert.equal((await service.forecast(30, 35, "2027-01-01")).status, "not_yet_available");
});
