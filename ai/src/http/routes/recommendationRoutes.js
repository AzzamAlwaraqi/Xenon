const crypto = require("node:crypto");
const { success } = require("../respond");
const { validateRecommendationBody } = require("../validation");
const { readJson, requireJsonContentType } = require("../middleware/jsonBody");

function createRecommendationRoutes({ advisor, conversations, maximumBodyBytes }) {
    return [{
        method: "POST", path: "/v1/recommendations",
        handle: async (req, res, context) => {
            requireJsonContentType(req);
            const { query, conversationId: supplied } = validateRecommendationBody(await readJson(req, maximumBodyBytes));
            const conversationId = supplied || crypto.randomUUID();
            const previous = await conversations.get(conversationId);
            // A follow-up whose stored context is gone (service restart, expiry) must be told so,
            // never silently answered as if it were a brand new unrelated question.
            const contextLost = Boolean(supplied) && !previous;
            const result = await advisor.recommend(query, { preferences: previous?.preferences, topRecommendation: previous?.topRecommendation, contextLost });
            await conversations.set(conversationId, {
                preferences: result.preferences || previous?.preferences,
                topRecommendation: result.topRecommendation || previous?.topRecommendation
            });
            return success(res, 200, { ...result, conversationId }, context);
        }
    }];
}

module.exports = { createRecommendationRoutes };
