const { json, API_VERSION } = require("../respond");

function createHealthRoutes({ repository }) {
    return [{
        method: "GET", path: "/health",
        handle: async (_req, res, context) => {
            const health = await repository.health();
            return json(res, 200, { status: "ok", data: typeof health === "object" ? health : { database: "connected" }, requestId: context.requestId, apiVersion: API_VERSION }, context.origin, context.requestId, context.rateHeaders);
        }
    }];
}

module.exports = { createHealthRoutes };
