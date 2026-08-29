const { success, API_VERSION } = require("../respond");

function createCapabilityRoutes() {
    return [{
        method: "GET", path: "/v1/capabilities",
        handle: async (_req, res, context) => success(res, 200, {
            apiVersion: API_VERSION,
            endpoint: "/v1/recommendations",
            languages: ["Arabic", "English", "French", "Spanish"],
            features: ["package matching", "conversation follow-ups", "date availability", "live temperature", "live humidity", "currency conversion", "environment exclusions"]
        }, context)
    }];
}

module.exports = { createCapabilityRoutes };
