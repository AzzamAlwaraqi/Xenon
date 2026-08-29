const http = require("node:http");
const { API_VERSION, failure } = require("./http/respond");
const { createConversationStore } = require("./http/conversationStore");
const { createRouter } = require("./http/router");
const { createRequestContext } = require("./http/middleware/requestContext");
const { createCorsMiddleware, allowedOrigin } = require("./http/middleware/cors");
const { createAuthMiddleware } = require("./http/middleware/authenticate");
const { createRateLimitMiddleware } = require("./http/middleware/rateLimit");
const { createHealthRoutes } = require("./http/routes/healthRoutes");
const { createCapabilityRoutes } = require("./http/routes/capabilityRoutes");
const { createRecommendationRoutes } = require("./http/routes/recommendationRoutes");

function createApp(options) {
    const { advisor, repository, apiKey, corsOrigins = options.corsOrigin ? [options.corsOrigin] : ["*"], rateLimitPerMinute = 30,
        requestTimeoutMs = 30000, maximumBodyBytes = 16384, conversationTtlMs = 1800000, maximumConversations = 10000,
        conversationRepository = null } = options;

    const conversations = createConversationStore({ ttlMs: conversationTtlMs, maximum: maximumConversations, repository: conversationRepository });

    // Each concern is its own middleware; the pipeline short-circuits as soon as one answers the request.
    const pipeline = [
        createCorsMiddleware(corsOrigins),
        createAuthMiddleware(apiKey),
        createRateLimitMiddleware(rateLimitPerMinute)
    ];

    const route = createRouter([
        ...createHealthRoutes({ repository }),
        ...createCapabilityRoutes(),
        ...createRecommendationRoutes({ advisor, conversations, maximumBodyBytes })
    ]);

    const server = http.createServer(async (req, res) => {
        const context = createRequestContext(req);
        try {
            for (const middleware of pipeline) if (await middleware(req, res, context)) return;
            return await route(req, res, context);
        } catch (error) {
            return failure(res, error, context.origin, context.requestId, context.rateHeaders);
        }
    });

    server.requestTimeout = requestTimeoutMs;
    server.headersTimeout = Math.min(10000, requestTimeoutMs);
    server.keepAliveTimeout = 5000;
    server.maxRequestsPerSocket = 100;
    server.on("clientError", (_error, socket) => { if (socket.writable) socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n"); });
    return server;
}

module.exports = { createApp, allowedOrigin, API_VERSION };
