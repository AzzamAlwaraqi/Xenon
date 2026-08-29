const crypto = require("node:crypto");

// The service owns its request identity: a caller-supplied id is echoed only when it is safe to log.
function createRequestContext(req) {
    const incoming = req.headers["x-request-id"] || "";
    return { requestId: /^[a-zA-Z0-9-]{8,100}$/.test(incoming) ? incoming : crypto.randomUUID(), rateHeaders: {} };
}

module.exports = { createRequestContext };
