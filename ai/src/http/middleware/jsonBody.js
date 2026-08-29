const { ApiError } = require("../validation");

function readJson(req, maximumBodyBytes) {
    return new Promise((resolve, reject) => {
        let body = ""; let size = 0; let settled = false;
        // Stop buffering but let the request drain, so the 413 response still reaches the caller.
        const stop = error => { settled = true; body = ""; reject(error); };
        req.setEncoding("utf8");
        req.on("data", chunk => {
            if (settled) return;
            size += Buffer.byteLength(chunk);
            if (size > maximumBodyBytes) return stop(new ApiError(413, "BODY_TOO_LARGE", `Request body exceeds ${maximumBodyBytes} bytes`));
            body += chunk;
        });
        req.on("end", () => {
            if (settled) return;
            try { resolve(JSON.parse(body || "{}")); }
            catch (_) { reject(new ApiError(400, "INVALID_JSON", "Invalid JSON body")); }
        });
        req.on("error", error => { if (!settled) reject(error); });
    });
}

function requireJsonContentType(req) {
    if (!/^application\/json(?:\s*;|$)/i.test(req.headers["content-type"] || "")) throw new ApiError(415, "JSON_REQUIRED", "Content-Type must be application/json");
}

module.exports = { readJson, requireJsonContentType };
