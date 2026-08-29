const { ApiError } = require("../validation");
const { responseHeaders } = require("../respond");

function allowedOrigin(requestOrigin, configured = ["*"]) {
    if (!requestOrigin) return null;
    if (configured.includes("*")) return "*";
    return configured.includes(requestOrigin) ? requestOrigin : null;
}

function createCorsMiddleware(corsOrigins) {
    return function cors(req, res, context) {
        context.origin = allowedOrigin(req.headers.origin, corsOrigins);
        if (req.headers.origin && !context.origin) throw new ApiError(403, "ORIGIN_NOT_ALLOWED", "Request origin is not allowed");
        if (req.method !== "OPTIONS") return false;
        res.writeHead(204, {
            ...responseHeaders(context.origin, context.requestId),
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Request-Id,X-Client-Id",
            "Access-Control-Max-Age": "86400"
        });
        res.end();
        return true;
    };
}

module.exports = { createCorsMiddleware, allowedOrigin };
