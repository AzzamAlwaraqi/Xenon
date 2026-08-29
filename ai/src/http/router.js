const { ApiError } = require("./validation");

// A minimal router so the AI service owns its own routing table instead of borrowing the backend's.
function createRouter(routes) {
    return async function route(req, res, context) {
        const url = new URL(req.url, "http://localhost");
        const matches = routes.filter(entry => entry.path === url.pathname);
        if (!matches.length) throw new ApiError(404, "ROUTE_NOT_FOUND", "Route not found");
        const handler = matches.find(entry => entry.method === req.method);
        if (!handler) throw new ApiError(405, "METHOD_NOT_ALLOWED", "Method not allowed");
        return handler.handle(req, res, { ...context, url });
    };
}

module.exports = { createRouter };
