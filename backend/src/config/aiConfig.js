function boundedInteger(name, fallback, minimum, maximum) {
    const raw = process.env[name];
    const value = Number(raw === undefined || raw === "" ? fallback : raw);
    if (!Number.isInteger(value) || value < minimum || value > maximum) {
        throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
    }
    return value;
}

function buildAiConfig() {
    const serviceUrl = new URL(process.env.AI_SERVICE_URL || "http://127.0.0.1:3100");
    if (!["http:", "https:"].includes(serviceUrl.protocol) || serviceUrl.username || serviceUrl.password) {
        throw new Error("AI_SERVICE_URL must be an HTTP(S) URL without embedded credentials");
    }
    // Signs the conversation tokens handed to the mobile client. It is deliberately separate from
    // JWT_SECRET so rotating sign-in keys does not invalidate conversations, and vice versa.
    const conversationSecret = (process.env.AI_CONVERSATION_SECRET || "").trim();
    if (conversationSecret.length < 16) {
        throw new Error("AI_CONVERSATION_SECRET is required and must be at least 16 characters");
    }
    return Object.freeze({
        serviceUrl,
        apiKey: process.env.AI_SERVICE_API_KEY || null,
        timeoutMs: boundedInteger("AI_SERVICE_TIMEOUT_MS", 30000, 1000, 60000),
        maximumResponseBytes: boundedInteger("AI_SERVICE_MAX_RESPONSE_BYTES", 2097152, 1024, 10485760),
        conversationSecret,
        conversationTtlMs: boundedInteger("AI_CONVERSATION_TTL_MS", 1800000, 60000, 86400000)
    });
}

// Built once: the values come from the environment, so re-validating on every request only
// buys the chance of turning a deployment mistake into a per-request 500.
let cached = null;
function loadAiConfig() {
    if (!cached) cached = buildAiConfig();
    return cached;
}

function resetAiConfig() {
    cached = null;
}

module.exports = { loadAiConfig, resetAiConfig };
