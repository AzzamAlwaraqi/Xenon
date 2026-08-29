const crypto = require("node:crypto");
const { ApiError } = require("../validation");

function safeKeyEquals(provided, expected) {
    if (!provided || !expected) return false;
    const left = crypto.createHash("sha256").update(provided).digest();
    const right = crypto.createHash("sha256").update(expected).digest();
    return crypto.timingSafeEqual(left, right);
}

function createAuthMiddleware(apiKey) {
    return function authenticate(req, _res, context) {
        if (!apiKey) { context.authenticated = false; return false; }
        const supplied = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
        if (!safeKeyEquals(supplied, apiKey)) throw new ApiError(401, "UNAUTHORIZED", "Unauthorized");
        context.authenticated = true;
        return false;
    };
}

module.exports = { createAuthMiddleware, safeKeyEquals };
