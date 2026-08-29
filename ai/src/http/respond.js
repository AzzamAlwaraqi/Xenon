const API_VERSION = "1.0";

const SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'", "Cache-Control": "no-store"
};

function responseHeaders(origin, requestId) {
    return { ...SECURITY_HEADERS, ...(origin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}), "X-Request-Id": requestId };
}

function json(res, status, body, origin, requestId, extraHeaders = {}) {
    const payload = JSON.stringify(body);
    res.writeHead(status, { ...responseHeaders(origin, requestId), ...extraHeaders, "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(payload) });
    res.end(payload);
}

function success(res, status, data, context, extraHeaders = {}) {
    return json(res, status, { status: "success", data, requestId: context.requestId, apiVersion: API_VERSION }, context.origin, context.requestId, { ...context.rateHeaders, ...extraHeaders });
}

function failure(res, error, origin, requestId, extraHeaders = {}) {
    const status = error.statusCode || 500;
    const message = error.statusCode ? error.message : "Internal server error";
    const code = error.code || "INTERNAL_ERROR";
    return json(res, status, { status: status >= 500 ? "error" : "fail", message, error: { code, message, ...(error.fields ? { fields: error.fields } : {}) }, requestId, apiVersion: API_VERSION }, origin, requestId, extraHeaders);
}

module.exports = { API_VERSION, SECURITY_HEADERS, responseHeaders, json, success, failure };
