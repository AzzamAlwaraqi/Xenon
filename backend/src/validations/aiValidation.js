const Joi = require("joi");
const AppError = require("../utils/AppError");

const requestSchema = Joi.object({
    query: Joi.string().trim().min(2).max(1000).custom((value, helpers) => /\p{Cc}/u.test(value) ? helpers.error("string.control") : value.normalize("NFKC")).required(),
    conversationId: Joi.string().max(2048).pattern(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/).optional()
}).unknown(false).messages({
    "string.control": "query contains unsupported control characters",
    "object.unknown": "Unknown field: {#label}"
});

function validateAiAdvice(req, _res, next) {
    const { error, value } = requestSchema.validate(req.body, { abortEarly: false, convert: true });
    if (error) return next(new AppError(error.details.map(detail => detail.message).join(" | "), 400));
    req.body = value;
    next();
}

module.exports = { validateAiAdvice, requestSchema };
