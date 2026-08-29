function createCurrencyService(config, fetchImpl = fetch) {
    const cache = new Map();
    async function convert(amount, from, to) {
        if (!Number.isFinite(Number(amount))) return null;
        const base = String(from).toUpperCase();
        const quote = String(to).toUpperCase();
        if (base === quote) return { originalAmount: Number(amount), originalCurrency: base, convertedAmount: Number(amount), convertedCurrency: quote, rate: 1, source: "identity" };
        if (!/^[A-Z]{3}$/.test(base) || !/^[A-Z]{3}$/.test(quote)) return null;
        const key = `${base}:${quote}`;
        let rate = cache.get(key);
        try {
            if (!rate || Date.now() - rate.cachedAt > 3600000) {
                const response = await fetchImpl(`https://api.frankfurter.dev/v2/rate/${base}/${quote}`, { signal: AbortSignal.timeout(config.externalTimeoutMs) });
                if (!response.ok) return null;
                const data = await response.json();
                if (!Number.isFinite(data.rate) || data.rate <= 0) return null;
                rate = { value: data.rate, date: data.date, cachedAt: Date.now() };
                cache.set(key, rate);
            }
            return { originalAmount: Number(amount), originalCurrency: base, convertedAmount: Math.round(Number(amount) * rate.value * 100) / 100, convertedCurrency: quote, rate: rate.value, date: rate.date, source: "Frankfurter" };
        } catch (_) { return null; }
    }
    return { convert };
}

module.exports = { createCurrencyService };
