function round(value, digits = 1) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}

function humiditySummary(values) {
    const valid = (values || []).filter(value => Number.isFinite(value) && value >= 0 && value <= 100);
    if (!valid.length) return { averageHumidityPercent: null, maximumHumidityPercent: null };
    return { averageHumidityPercent: round(valid.reduce((sum, value) => sum + value, 0) / valid.length), maximumHumidityPercent: Math.max(...valid) };
}

function createWeatherService(config, fetchImpl = fetch, now = () => new Date()) {
    const cache = new Map();
    const ttlMs = config.weatherCacheTtlMs ?? 600000;

    async function forecast(latitude, longitude, date) {
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
        const today = now().toISOString().slice(0, 10);
        const requested = date || today;
        const limit = new Date(now().getTime() + 15 * 86400000).toISOString().slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(requested) || requested < today || requested > limit) {
            return { available: false, status: requested > limit ? "not_yet_available" : "outside_forecast_window", requestedDate: requested, forecastWindow: { from: today, through: limit }, reason: "Forecast is available only from today through 15 days ahead." };
        }
        const key = `${round(latitude, 4)}:${round(longitude, 4)}:${requested}`;
        const cached = cache.get(key);
        if (cached && now().getTime() - cached.cachedAt <= ttlMs) return { ...cached.value, cached: true };

        const url = new URL("https://api.open-meteo.com/v1/forecast");
        for (const [name, value] of Object.entries({
            latitude, longitude,
            daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
            hourly: "relative_humidity_2m", timezone: "auto", start_date: requested, end_date: requested
        })) url.searchParams.set(name, value);
        try {
            const response = await fetchImpl(url, { headers: { Accept: "application/json", "User-Agent": "Xenon-AI/1.0" }, signal: AbortSignal.timeout(config.externalTimeoutMs) });
            if (!response.ok) throw new Error("weather request failed");
            const payload = await response.json();
            const daily = payload?.daily;
            if (!daily?.time?.[0] || !Number.isFinite(daily.temperature_2m_min?.[0]) || !Number.isFinite(daily.temperature_2m_max?.[0])) throw new Error("invalid weather response");
            const value = {
                available: true, status: "forecast", source: "Open-Meteo", fetchedAt: now().toISOString(), date: daily.time[0],
                minTemperatureC: daily.temperature_2m_min[0], maxTemperatureC: daily.temperature_2m_max[0],
                precipitationProbability: Number.isFinite(daily.precipitation_probability_max?.[0]) ? daily.precipitation_probability_max[0] : null,
                weatherCode: Number.isFinite(daily.weather_code?.[0]) ? daily.weather_code[0] : null,
                ...humiditySummary(payload?.hourly?.relative_humidity_2m), cached: false
            };
            cache.set(key, { value, cachedAt: now().getTime() });
            return value;
        } catch (_) {
            return { available: false, status: "temporarily_unavailable", requestedDate: requested, reason: "Weather is temporarily unavailable." };
        }
    }
    return { forecast };
}

module.exports = { createWeatherService, humiditySummary };
