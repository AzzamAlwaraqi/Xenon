function integer(name, fallback, minimum, maximum) {
    const raw = process.env[name];
    const value = Number(raw === undefined || raw === "" ? fallback : raw);
    if (!Number.isInteger(value) || value < minimum || value > maximum) {
        throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
    }
    return value;
}

function flag(name, fallback = false) {
    const raw = (process.env[name] || "").trim().toLowerCase();
    if (!raw) return fallback;
    return ["1", "true", "yes", "on"].includes(raw);
}

function databaseUri() {
    const raw = process.env.DATABASE;
    if (!raw) throw new Error("DATABASE is required");
    return raw.includes("<PASSWORD>") ? raw.replace("<PASSWORD>", process.env.DATABASE_PASSWORD || "") : raw;
}

// This service reads the package database directly, so it must never be reachable without a key.
// Opting out is possible but has to be deliberate and explicit.
function serviceApiKey() {
    const key = (process.env.AI_API_KEY || "").trim();
    if (key) {
        if (key.length < 16) throw new Error("AI_API_KEY must be at least 16 characters");
        return key;
    }
    if (flag("AI_ALLOW_ANONYMOUS")) return null;
    throw new Error("AI_API_KEY is required. Set it to a long random secret shared with the backend, or set AI_ALLOW_ANONYMOUS=true for an isolated local run.");
}

// Browsers never call this service directly (the backend does), so nothing is allowed by default.
function corsOrigins() {
    const configured = (process.env.CORS_ALLOWED_ORIGINS || process.env.CORS_ALLOWED_ORIGIN || "").split(",").map(value => value.trim()).filter(Boolean);
    if (configured.includes("*") && !flag("AI_ALLOW_ANY_ORIGIN")) {
        throw new Error("CORS_ALLOWED_ORIGIN=* is refused. List the exact origins, or set AI_ALLOW_ANY_ORIGIN=true to accept the risk.");
    }
    return configured;
}

function loadConfig() {
    const currency = (process.env.PACKAGE_CURRENCY || "JOD").toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) throw new Error("PACKAGE_CURRENCY must be an ISO 4217 code");
    return {
        host: process.env.AI_HOST || "127.0.0.1",
        port: integer("AI_PORT", 3100, 1, 65535),
        databaseUri: databaseUri(),
        databaseName: process.env.MONGODB_DATABASE || undefined,
        aiDatabaseName: process.env.AI_DATABASE_NAME || "XenonAI",
        packageCurrency: currency,
        ollamaEnabled: process.env.OLLAMA_ENABLED !== "false",
        ollamaModel: process.env.OLLAMA_MODEL || "qwen3:4b",
        ollamaBaseUrl: (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, ""),
        ollamaTimeoutMs: integer("OLLAMA_TIMEOUT_MS", 10000, 100, 120000),
        externalTimeoutMs: integer("EXTERNAL_API_TIMEOUT_MS", 5000, 100, 30000),
        apiKey: serviceApiKey(),
        corsOrigins: corsOrigins(),
        rateLimitPerMinute: integer("RATE_LIMIT_PER_MINUTE", 30, 1, 1000),
        requestTimeoutMs: integer("REQUEST_TIMEOUT_MS", 30000, 1000, 120000),
        maximumBodyBytes: integer("MAXIMUM_BODY_BYTES", 16384, 1024, 1048576),
        conversationTtlMs: integer("CONVERSATION_TTL_MS", 1800000, 60000, 86400000),
        maximumConversations: integer("MAXIMUM_CONVERSATIONS", 10000, 10, 100000),
        conversationPersistence: flag("AI_CONVERSATION_PERSISTENCE", true),
        weatherCacheTtlMs: integer("WEATHER_CACHE_TTL_MS", 600000, 0, 3600000)
    };
}

module.exports = { loadConfig };
