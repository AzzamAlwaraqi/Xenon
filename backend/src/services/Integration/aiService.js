const crypto = require("node:crypto");
const AppError = require("../../utils/AppError");
const { loadAiConfig } = require("../../config/aiConfig");

// Upstream status codes are translated deliberately: the customer must learn that their own
// input was rejected (4xx) without ever seeing the advisor's internal error text.
function clientErrorFor(status) {
    if (status === 429) return new AppError("The AI advisor is busy. Please try again shortly.", 429);
    if (status === 400) return new AppError("The AI advisor could not understand that request. Please rephrase it.", 400);
    if (status === 413) return new AppError("That message is too long for the AI advisor. Please shorten it.", 400);
    // 401/403/404/5xx are all faults on our side of the integration, never the customer's.
    return new AppError("The AI advisor could not complete the request.", 502);
}

function createAiService(fetchImpl = fetch, configProvider = loadAiConfig) {
    async function requestAdvice({ query, conversationId, requestId, clientId }) {
        const config = configProvider();
        const url = new URL("/v1/recommendations", config.serviceUrl);
        let response;
        try {
            response = await fetchImpl(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", Accept: "application/json",
                    "X-Request-Id": requestId || crypto.randomUUID(),
                    // Lets the advisor rate limit per customer instead of bucketing the whole backend together.
                    ...(clientId ? { "X-Client-Id": clientId } : {}),
                    ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
                },
                body: JSON.stringify({ query, ...(conversationId ? { conversationId } : {}) }),
                signal: AbortSignal.timeout(config.timeoutMs)
            });
        } catch (error) {
            const message = error?.name === "TimeoutError" ? "The AI advisor timed out. Please try again." : "The AI advisor is temporarily unavailable.";
            throw new AppError(message, 503);
        }

        const declaredLength = Number(response.headers?.get?.("content-length"));
        if (Number.isFinite(declaredLength) && declaredLength > config.maximumResponseBytes) throw new AppError("The AI advisor returned an invalid response.", 502);
        let text;
        try { text = await response.text(); }
        catch (_) { throw new AppError("The AI advisor returned an invalid response.", 502); }
        if (Buffer.byteLength(text) > config.maximumResponseBytes) throw new AppError("The AI advisor returned an invalid response.", 502);
        // A failing upstream may answer with HTML from a proxy, so the status is judged before the body.
        if (!response.ok) throw clientErrorFor(response.status);
        let payload;
        try { payload = JSON.parse(text); } catch (_) { throw new AppError("The AI advisor returned an invalid response.", 502); }
        if (payload?.status !== "success" || !payload.data || typeof payload.data !== "object") throw new AppError("The AI advisor returned an invalid response.", 502);
        return payload;
    }
    return { requestAdvice };
}

const service = createAiService();
module.exports = { ...service, createAiService };
