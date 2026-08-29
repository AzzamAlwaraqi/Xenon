const AppError = require("../../../utils/AppError");
const crypto = require("node:crypto");
const aiService = require("../../Integration/aiService");
const { loadAiConfig } = require("../../../config/aiConfig");

const PACKAGE_FIELDS = ["_id", "package_name", "package_description", "package_price", "package_type", "startDate", "endDate", "images", "tags", "max_people", "available_seats", "ratingsAverage", "vendor_id"];
const MAXIMUM_RECOMMENDATIONS = 3;
const MAXIMUM_REASONS = 6;

function userIdOf(user) {
    const id = user?._id || user?.id;
    if (!id) throw new AppError("Authenticated user context is missing.", 401);
    return String(id);
}

function conversationError() {
    const error = new AppError("conversationId is invalid or expired.", 400);
    // Lets the app tell "this conversation ended" apart from "this request was bad".
    error.code = "CONVERSATION_EXPIRED";
    return error;
}

function signature(value, secret) {
    return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function createConversationToken(conversationId, userId, config = loadAiConfig(), now = Date.now()) {
    if (!config.conversationSecret) throw new AppError("AI conversation security is not configured.", 503);
    const encoded = Buffer.from(JSON.stringify({ conversationId, userId, expiresAt: now + config.conversationTtlMs })).toString("base64url");
    return `${encoded}.${signature(encoded, config.conversationSecret)}`;
}

function readConversationToken(token, userId, config = loadAiConfig(), now = Date.now()) {
    if (!token) return null;
    if (!config.conversationSecret) throw new AppError("AI conversation security is not configured.", 503);
    const [encoded, suppliedSignature, extra] = token.split(".");
    if (!encoded || !suppliedSignature || extra) throw conversationError();
    const expected = signature(encoded, config.conversationSecret);
    const left = Buffer.from(suppliedSignature);
    const right = Buffer.from(expected);
    if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) throw conversationError();
    let payload;
    try { payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")); }
    catch (_) { throw conversationError(); }
    if (payload.userId !== userId || !Number.isFinite(payload.expiresAt) || payload.expiresAt <= now || !/^[a-f\d-]{36}$/iu.test(payload.conversationId || "")) {
        throw conversationError();
    }
    return payload.conversationId;
}

function clientPackage(value) {
    if (!value || typeof value !== "object") return null;
    return Object.fromEntries(PACKAGE_FIELDS.filter(field => value[field] !== undefined).map(field => [field, value[field]]));
}

function clientRecommendation(item) {
    return {
        package: clientPackage(item.package),
        totalPrice: item.totalPrice,
        currency: item.currency,
        matchReasons: (item.matchReasons || []).slice(0, MAXIMUM_REASONS),
        tradeoffs: (item.tradeoffs || []).slice(0, MAXIMUM_REASONS),
        weather: item.weather || null
    };
}

// The advisor answers with its full working set: three copies of every recommendation plus the
// preference state it extracted. The mobile client needs neither, and forwarding them would leak
// internal fields and multiply the payload, so the response is shaped explicitly here.
function clientPayload(data) {
    const source = Array.isArray(data.matchingPackages) ? data.matchingPackages : (Array.isArray(data.recommendations) ? data.recommendations : []);
    return {
        reply: data.reply,
        outcome: data.outcome,
        matchingPackages: source.slice(0, MAXIMUM_RECOMMENDATIONS).filter(item => item && typeof item === "object").map(clientRecommendation),
        suggestions: Array.isArray(data.suggestions) ? data.suggestions.slice(0, 3) : [],
        alternatives: Array.isArray(data.alternatives) ? data.alternatives.slice(0, MAXIMUM_RECOMMENDATIONS).map(item => ({ package: clientPackage(item.package), totalPrice: item.totalPrice, currency: item.currency, reason: item.reason })) : [],
        caveats: Array.isArray(data.caveats) ? data.caveats : [],
        disclaimer: data.disclaimer
    };
}

async function getAiAdviceCore({ query, conversationId, user, requestId }, dependencies = {}) {
    const service = dependencies.aiService || aiService;
    const config = dependencies.config || loadAiConfig();
    const userId = userIdOf(user);
    const upstreamConversationId = readConversationToken(conversationId, userId, config);
    // The advisor never sees who the customer is, only a stable opaque id for its own rate limiting.
    const clientId = crypto.createHmac("sha256", config.conversationSecret).update(userId).digest("hex").slice(0, 32);
    const payload = await service.requestAdvice({ query, conversationId: upstreamConversationId, requestId, clientId });
    const upstreamId = payload.data.conversationId;
    if (!/^[a-f\d-]{36}$/iu.test(upstreamId || "")) throw new AppError("The AI advisor returned an invalid conversation.", 502);
    return {
        status: "success",
        data: { ...clientPayload(payload.data), conversationId: createConversationToken(upstreamId, userId, config) },
        requestId: payload.requestId || requestId,
        apiVersion: payload.apiVersion || "1.0"
    };
}

module.exports = { getAiAdviceCore, createConversationToken, readConversationToken, clientPayload };
