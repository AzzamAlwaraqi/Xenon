const ALLOWED_BODY_FIELDS = new Set(["query", "conversationId"]);

class ApiError extends Error {
    constructor(statusCode, code, message, fields) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.fields = fields;
    }
}

function normalizeQuery(value) {
    if (typeof value !== "string") throw new ApiError(400, "INVALID_QUERY", "query must be a string", { query: "Required string" });
    const query = value.normalize("NFKC").trim();
    if (query.length < 2 || query.length > 1000) throw new ApiError(400, "INVALID_QUERY", "query must contain 2 to 1000 characters", { query: "Use 2 to 1000 characters" });
    if (/\p{Cc}/u.test(query)) throw new ApiError(400, "INVALID_QUERY", "query contains unsupported control characters", { query: "Remove control characters" });
    return query;
}

function validateRecommendationBody(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new ApiError(400, "INVALID_BODY", "Request body must be a JSON object");
    const unknown = Object.keys(body).filter(key => !ALLOWED_BODY_FIELDS.has(key));
    if (unknown.length) throw new ApiError(400, "UNKNOWN_FIELDS", `Unknown request field(s): ${unknown.join(", ")}`, { unknown });
    const query = normalizeQuery(body.query);
    const conversationId = body.conversationId;
    if (conversationId != null && (typeof conversationId !== "string" || !/^[a-f\d]{8}-[a-f\d-]{27,45}$/iu.test(conversationId))) {
        throw new ApiError(400, "INVALID_CONVERSATION_ID", "conversationId is invalid", { conversationId: "Use the ID returned by this API" });
    }
    return { query, conversationId };
}

module.exports = { ApiError, validateRecommendationBody };
