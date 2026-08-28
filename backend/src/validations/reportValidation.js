const joi = require("joi");
const AppError = require("../utils/AppError");

const validateMiddleware = (schema, dataToValidate, req, next) => {
    const { error, value } = schema.validate(dataToValidate, { abortEarly: false, stripUnknown: true });
    if (error) {
        return next(new AppError(error.details.map(d => d.message).join(" | "), 400));
    }
    req.body = value;
    next();
};

exports.submitReportValidation = function (req, res, next) {
    const Schema = joi.object({
        reported_user: joi.string().uuid().required(),
        content_type: joi.string().valid("package", "review", "comment", "user_profile").required(),
        content_id: joi.string().uuid().required(),
        reason: joi.string().min(5).max(100).required(),
        description: joi.string().min(10).max(1000).required()
    });
    validateMiddleware(Schema, req.body, req, next);
};
