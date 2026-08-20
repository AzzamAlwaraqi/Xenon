const aiAdvisorCore = require("../../services/Core/Client/aiAdvisorCore");

exports.getAiAdvice = async (req, res, next) => {
    try {
        const { query } = req.body;
        const result = await aiAdvisorCore.getAiAdviceCore(query, req.user);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
