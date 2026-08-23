const Joi = require('joi');
const AppError = require('../utils/AppError');

const handleJoiError = (error, next) => {
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(' | ');
        return next(new AppError(errorMessage, 400));
    }
};

const targetedNotificationSchema = Joi.object({
    userIds: Joi.alternatives().try(
        Joi.string().hex().length(24),
        Joi.array().items(Joi.string().hex().length(24)).min(1)
    ).required().messages({
        'any.required': 'You must provide at least one user ID.'
    }),
    title: Joi.string().trim().min(3).max(100).required(),
    message: Joi.string().trim().min(5).max(500).required(),
    type: Joi.string().optional()
});

const broadcastSchema = Joi.object({
    title: Joi.string().trim().min(3).max(100).required(),
    message: Joi.string().trim().min(5).max(500).required(),
    type: Joi.string().optional(),
    targetAudience: Joi.string().valid('all', 'users_only', 'vendors_only').optional() 
});

const mongoIdParamSchema = Joi.object({
    id: Joi.string().hex().length(24).required().messages({
        'string.hex': 'Invalid ID format. Must be a valid MongoDB ID.',
        'string.length': 'Invalid ID format. Must be a 24 character MongoDB ID.'
    })
});

exports.validateTargetedNotification = (req, res, next) => {
    const { error, value } = targetedNotificationSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return handleJoiError(error, next);
    req.body = value;
    next();
};

exports.validateBroadcast = (req, res, next) => {
    const { error, value } = broadcastSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return handleJoiError(error, next);
    req.body = value;
    next();
};

exports.validateNotificationIdParam = (req, res, next) => {
    const { error, value } = mongoIdParamSchema.validate(req.params, { abortEarly: false, stripUnknown: true });
    if (error) return handleJoiError(error, next);
    req.params = value;
    next();
};