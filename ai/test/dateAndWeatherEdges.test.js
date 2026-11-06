const test = require("node:test");
const assert = require("node:assert/strict");
const { parseTravelDate, readTravelDate } = require("../src/services/preferenceService");
const { createWeatherService, humiditySummary } = require("../src/services/weatherService");

const NOW = new Date("2026-09-01T10:00:00.000Z");
const at = (iso) => new Date(iso);

// ---------------------------------------------------------------- travel dates

test("reads an explicit ISO travel date", () => {
    assert.deepEqual(readTravelDate("a trip on 2026-09-20", NOW), { date: "2026-09-20", past: false });
    assert.equal(parseTravelDate("a trip on 2026-09-20", NOW), "2026-09-20");
});

test("reads a day-first numeric date, the local convention", () => {
    // 09/10/2026 is 9 October, not 10 September.
    assert.deepEqual(readTravelDate("travelling 09/10/2026", NOW), { date: "2026-10-09", past: false });
});

test("falls back to month-first only when day-first is impossible", () => {
    // There is no 25th month, so 12/25/2026 can only mean 25 December.
    assert.deepEqual(readTravelDate("leaving 12/25/2026", NOW), { date: "2026-12-25", past: false });
});

test("accepts a hyphenated numeric date", () => {
    assert.deepEqual(readTravelDate("on 20-09-2026", NOW), { date: "2026-09-20", past: false });
});

test("flags a numeric date that has already passed instead of silently searching it", () => {
    const result = readTravelDate("we went on 09/08/2026", NOW);
    assert.equal(result.past, true);
    assert.equal(result.date, null, "a past date must never reach the package query");
    assert.equal(parseTravelDate("we went on 09/08/2026", NOW), null);
});

test("rejects an impossible numeric date rather than rolling it over", () => {
    // 31 February is not a date; it must not silently become 3 March.
    assert.notEqual(parseTravelDate("on 31/02/2026", NOW), "2026-03-03");
});

test("resolves relative dates in English and Arabic", () => {
    assert.deepEqual(readTravelDate("leaving tomorrow", NOW), { date: "2026-09-02", past: false });
    assert.deepEqual(readTravelDate("next week please", NOW), { date: "2026-09-08", past: false });
    assert.deepEqual(readTravelDate("غدا", NOW), { date: "2026-09-02", past: false });
});

test("resolves a named month with an explicit year", () => {
    assert.deepEqual(readTravelDate("September 20, 2026", NOW), { date: "2026-09-20", past: false });
});

test("returns nothing when the query names no date at all", () => {
    assert.equal(readTravelDate("a cultural package for four people", NOW), null);
    assert.equal(parseTravelDate("a cultural package for four people", NOW), null);
});

test("an ISO date in the past is reported as past, not searched", () => {
    const result = readTravelDate("we booked 2026-08-01", NOW);
    assert.equal(result.past, true);
    assert.equal(result.date, null);
});

test("today counts as a valid travel date, not a past one", () => {
    assert.deepEqual(readTravelDate("2026-09-01", NOW), { date: "2026-09-01", past: false });
});

// ---------------------------------------------------------------- weather

const config = { externalTimeoutMs: 1000, weatherCacheTtlMs: 60000 };

function service(fetchImpl, now = () => NOW) {
    return createWeatherService(config, fetchImpl, now);
}

const okResponse = (payload) => ({ ok: true, status: 200, json: async () => payload });

const forecastPayload = {
    daily: {
        time: ["2026-09-05"],
        temperature_2m_max: [34],
        temperature_2m_min: [21],
        precipitation_probability_max: [10],
        weather_code: [1]
    },
    hourly: { relative_humidity_2m: [40, 44, 48] }
};

test("returns a forecast for a date inside the window", async () => {
    const weather = service(async () => okResponse(forecastPayload));
    const result = await weather.forecast(30.32, 35.44, "2026-09-05");
    assert.equal(result.available, true);
    assert.equal(result.maxTemperatureC, 34);
    assert.equal(result.minTemperatureC, 21);
    assert.equal(result.source, "Open-Meteo");
    assert.equal(result.cached, false);
});

test("refuses a date beyond the 15-day forecast window without calling the provider", async () => {
    let called = false;
    const weather = service(async () => { called = true; return okResponse(forecastPayload); });
    const result = await weather.forecast(30.32, 35.44, "2027-01-01");
    assert.equal(result.available, false);
    assert.equal(result.status, "not_yet_available");
    assert.equal(called, false, "an out-of-window date must not cost an external request");
});

test("refuses a date already in the past", async () => {
    const weather = service(async () => okResponse(forecastPayload));
    const result = await weather.forecast(30.32, 35.44, "2026-08-01");
    assert.equal(result.available, false);
    assert.equal(result.status, "outside_forecast_window");
});

test("refuses a malformed date", async () => {
    const weather = service(async () => okResponse(forecastPayload));
    const result = await weather.forecast(30.32, 35.44, "05/09/2026");
    assert.equal(result.available, false);
});

test("an upstream outage degrades to unavailable, never to a thrown request", async () => {
    const weather = service(async () => { throw new Error("network down"); });
    const result = await weather.forecast(30.32, 35.44, "2026-09-05");
    assert.equal(result.available, false);
    assert.equal(result.status, "temporarily_unavailable");
    assert.match(result.reason, /temporarily unavailable/i);
});

test("an upstream error status degrades the same way", async () => {
    const weather = service(async () => ({ ok: false, status: 503, json: async () => ({}) }));
    const result = await weather.forecast(30.32, 35.44, "2026-09-05");
    assert.equal(result.available, false);
    assert.equal(result.status, "temporarily_unavailable");
});

test("a structurally invalid payload is treated as an outage rather than trusted", async () => {
    for (const payload of [{}, { daily: {} }, { daily: { time: ["2026-09-05"], temperature_2m_max: [null], temperature_2m_min: [null] } }]) {
        const weather = service(async () => okResponse(payload));
        const result = await weather.forecast(30.32, 35.44, "2026-09-05");
        assert.equal(result.available, false, `payload ${JSON.stringify(payload)} must not be reported as a forecast`);
    }
});

test("a repeated lookup is served from cache instead of a second request", async () => {
    let calls = 0;
    const weather = service(async () => { calls += 1; return okResponse(forecastPayload); });
    await weather.forecast(30.32, 35.44, "2026-09-05");
    const second = await weather.forecast(30.32, 35.44, "2026-09-05");
    assert.equal(calls, 1);
    assert.equal(second.cached, true);
});

test("the cache expires and the provider is consulted again", async () => {
    let calls = 0;
    let clock = NOW;
    const weather = createWeatherService(config, async () => { calls += 1; return okResponse(forecastPayload); }, () => clock);
    await weather.forecast(30.32, 35.44, "2026-09-05");
    clock = at("2026-09-01T10:05:00.000Z");
    await weather.forecast(30.32, 35.44, "2026-09-05");
    assert.equal(calls, 2);
});

test("missing optional fields become null rather than undefined", async () => {
    const payload = { daily: { time: ["2026-09-05"], temperature_2m_max: [34], temperature_2m_min: [21] } };
    const weather = service(async () => okResponse(payload));
    const result = await weather.forecast(30.32, 35.44, "2026-09-05");
    assert.equal(result.precipitationProbability, null);
    assert.equal(result.weatherCode, null);
});

test("humidity is summarised from the hourly series", () => {
    const summary = humiditySummary([40, 50, 60]);
    assert.equal(summary.averageHumidityPercent, 50);
});

test("an absent humidity series does not produce a fabricated average", () => {
    for (const series of [undefined, null, []]) {
        assert.deepEqual(humiditySummary(series), { averageHumidityPercent: null, maximumHumidityPercent: null },
            `series ${JSON.stringify(series)} must not yield a number`);
    }
});

test("out-of-range humidity readings are discarded rather than averaged in", () => {
    assert.deepEqual(humiditySummary([40, -5, 250, 60, null, NaN]), { averageHumidityPercent: 50, maximumHumidityPercent: 60 });
});

test("a humidity series with no usable reading yields null, not zero", () => {
    assert.deepEqual(humiditySummary([null, undefined, NaN, 900]), { averageHumidityPercent: null, maximumHumidityPercent: null });
});
