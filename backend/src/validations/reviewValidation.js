const Joi = require('joi');
const AppError = require("../utils/AppError");

const createReviewSchema = Joi.object({
    booking_id: Joi.string().uuid().required().messages({
        'string.guid': 'The format of this booking id is not valid (must be UUID)',
        'any.required': 'Booking id is required'
    }),
    rating: Joi.number().min(1).max(5).required().messages({
        'number.base': 'Rating must be a number',
        'number.min': 'Rating must be at least 1',
        'number.max': 'Rating must not be more than 5',
        'any.required': 'Rating is required'
    }),
    comment: Joi.string().trim().min(3).max(500).optional().allow('', null).messages({
        'string.base': 'Comment must be a string',
        'string.min': 'Comment must be at least 3 characters long',
        'string.max': 'Comment must not be more than 500 characters long'
    })
});

const updateReviewBodySchema = Joi.object({
    rating: Joi.number().min(1).max(5).optional(),
    comment: Joi.string().trim().min(3).max(500).optional()
}).min(1);

const replyReviewSchema = Joi.object({
    reply_comment: Joi.string().trim().min(2).max(500).required().messages({
        'any.required': 'Reply comment is required'
    })
});

const updateStatusSchema = Joi.object({
    status: Joi.string().valid("accepted", "rejected", "in-progress").required().messages({
        'any.required': 'Status is required'
    })
});

const paramIdSchema = Joi.object({
    id: Joi.string().uuid().required().messages({
        'string.guid': 'The format of this id is not valid (must be UUID)',
        'any.required': 'This id is required in the URL'
    })
});

const queryReviewSchema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    rating: Joi.number().min(1).max(5).optional(),
    status: Joi.string().valid("accepted", "rejected", "in-progress").optional()
});

exports.createReviewValidation = (req, res, next) => {
    const { error, value } = createReviewSchema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 400));
    req.body = value;
    next();
};

exports.updateReviewValidation = (req, res, next) => {
    const { error, value } = updateReviewBodySchema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 400));
    req.body = value;
    next();
};

exports.getReviewsQueryValidation = (req, res, next) => {
    const { error, value } = queryReviewSchema.validate(req.query);
    if (error) return next(new AppError(error.details[0].message, 400));
    req.query = value;
    next();
};

exports.paramIdValidation = (req, res, next) => {
    const idToValidate = req.params.reviewId || req.params.targetId || req.params.id;
    const { error, value } = paramIdSchema.validate({ id: idToValidate });
    if (error) return next(new AppError(error.details[0].message, 400));
    req.params.id = value.id;
    next();
};

exports.reviewIdParamValidation = exports.paramIdValidation;

exports.replyOnReviewValidation = (req, res, next) => {
    const { error, value } = replyReviewSchema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 400));
    req.body = value;
    next();
};

exports.updateReviewStatusValidation = (req, res, next) => {
    const { error, value } = updateStatusSchema.validate(req.body);
    if (error) return next(new AppError(error.details[0].message, 400));
    req.body = value;
    next();
};