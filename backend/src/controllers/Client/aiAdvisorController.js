const aiAdvisorCore = require("../../services/Core/Client/aiAdvisorCore");

exports.getAiAdvice = async (req, res, next) => {
    try {
        const { query, conversationId } = req.body;
        const result = await aiAdvisorCore.getAiAdviceCore({ query, conversationId, user: req.user, requestId: req.aiRequestId || req.headers["x-request-id"] });
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
