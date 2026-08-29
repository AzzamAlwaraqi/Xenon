const crypto = require("node:crypto");
const { RateLimiterMemory } = require("rate-limiter-flexible");
const AppError = require("../utils/AppError");

// These middlewares exist only for the AI advisor route and are mounted on the AI router alone.
// The advisor is a separate service with its own limits, so it must not consume, or be
// constrained by, the shared action limiter used elsewhere in the API.

// Keyed by the authenticated user, not the IP. Behind a proxy or carrier NAT an IP key would put
// every customer of the app into one bucket.
const conversationLimiter = new RateLimiterMemory({ points: 20, duration: 60 });

function aiRateLimiter(req, res, next) {
    const key = String(req.user?._id || req.user?.id || req.ip);
    conversationLimiter.consume(key)
        .then(() => next())
        .catch(rejection => {
            const retryAfterSeconds = Math.max(1, Math.ceil((rejection?.msBeforeNext || 60000) / 1000));
            res.set("Retry-After", String(retryAfterSeconds));
            res.status(429).json({
                status: "fail",
                message: "You are sending messages to the travel assistant too quickly. Please wait a moment and try again."
            });
        });
}

// The advisor request id is echoed into an upstream header, so it must be a safe token.
// An unusable value is replaced rather than allowed to break the upstream call.
function aiRequestId(req, _res, next) {
    const supplied = String(req.headers["x-request-id"] || "");
    req.aiRequestId = /^[A-Za-z0-9-]{8,100}$/.test(supplied) ? supplied : crypto.randomUUID();
    next();
}

function requireAiUser(req, _res, next) {
    if (!req.user?._id && !req.user?.id) return next(new AppError("Authenticated user context is missing.", 401));
    next();
}

// Router-scoped error handling: the advisor is the only route that needs to tell the app which
// kind of failure happened, so the coded shape lives here rather than in the global handler.
function aiErrorHandler(error, _req, res, next) {
    // Only errors this route raised deliberately are answered here. Anything else (token, cast,
    // and database errors) belongs to the global handler, which knows how to translate them.
    if (res.headersSent || !error?.isOperational || !error.statusCode) return next(error);
    const { statusCode, message } = error;
    return res.status(statusCode).json({
        status: `${statusCode}`.startsWith("4") ? "fail" : "error",
        message,
        error: { code: error.code || "AI_REQUEST_FAILED", message }
    });
}

module.exports = { aiRateLimiter, aiRequestId, requireAiUser, aiErrorHandler };
