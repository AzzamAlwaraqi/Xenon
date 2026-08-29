const { json } = require("../respond");
const { API_VERSION } = require("../respond");

function createRateLimiter(limit) {
    const clients = new Map();
    return function check(key, now = Date.now()) {
        const previous = clients.get(key);
        const record = !previous || now >= previous.resetAt ? { count: 1, resetAt: now + 60000 } : { ...previous, count: previous.count + 1 };
        clients.set(key, record);
        if (clients.size > 10000) for (const [id, value] of clients) if (now >= value.resetAt) clients.delete(id);
        return { allowed: record.count <= limit, remaining: Math.max(0, limit - record.count), resetAt: record.resetAt };
    };
}

// One shared socket serves every customer when the backend proxies calls, so an authenticated
// caller may name the end user it is acting for. Unauthenticated callers are always bucketed by address.
function clientKey(req, context) {
    const supplied = context.authenticated ? String(req.headers["x-client-id"] || "").trim() : "";
    if (/^[A-Za-z0-9_.:-]{1,128}$/.test(supplied)) return `client:${supplied}`;
    return `address:${req.socket.remoteAddress || "unknown"}`;
}

function createRateLimitMiddleware(limit) {
    const check = createRateLimiter(limit);
    return function rateLimit(req, res, context) {
        const rate = check(clientKey(req, context));
        context.rateHeaders = {
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(rate.remaining),
            "X-RateLimit-Reset": String(Math.ceil(rate.resetAt / 1000))
        };
        if (rate.allowed) return false;
        json(res, 429, { status: "fail", message: "Too many requests. Try again later.", error: { code: "RATE_LIMITED", message: "Too many requests. Try again later." }, requestId: context.requestId, apiVersion: API_VERSION },
            context.origin, context.requestId, { ...context.rateHeaders, "Retry-After": String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))) });
        return true;
    };
}

module.exports = { createRateLimitMiddleware, createRateLimiter };
