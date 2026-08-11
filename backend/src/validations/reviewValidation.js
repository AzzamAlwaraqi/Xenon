const Joi = require('joi');

exports.createReviewValidation = Joi.object({
    rating: Joi.number()
        .min(1)
        .max(5)
        .required()
        .messages({
            'number.base': 'this number must be a number',
            'number.min': 'this number must be at least 1',
            'number.max': 'this number must not be more than 5',
            'any.required': 'this number is required'
        }),

    comment: Joi.string()
        .trim()
        .min(5)
        .max(500)
        .optional() 
        .messages({
            'string.base': 'this text must be string',
            'string.min': 'this text must be at least 5 characters long',
            'string.max': 'this text must not be more than 500 characters long'
        }),

    targetId: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            'string.hex': 'the format of this id is not valid',
            'string.length': 'the length of this id is not valid',
            'any.required': 'this id is required'
        })
});

exports.updateReviewByIdValidation = Joi.object({
    rating: Joi.number()
        .min(1)
        .max(5)
        .optional()
        .messages({
            'number.base': 'this number must be a number',
            'number.min': 'this number must be at least 1',
            'number.max': 'this number must not be more than 5'
        }),

    comment: Joi.string()
        .trim()
        .min(5)
        .max(500)
        .optional()
        .messages({
            'string.base': 'this text must be string',
            'string.min': 'this text must be at least 5 characters long',
            'string.max': 'this text must not be more than 500 characters long'
        }),

    reviewId: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            'string.hex': 'the format of this id is not valid',
            'string.length': 'the length of this id is not valid',
            'any.required': 'this id is required'
        })
});

exports.getReviewsByTargetIdValidation = Joi.object({
    targetId: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            'string.hex': 'the format of this id is not valid',
            'string.length': 'the length of this id is not valid',
            'any.required': 'this id is required'
        })
});

exports.deleteReviewValidation = Joi.object({
    reviewId: Joi.string()
        .hex()
        .length(24)
        .required()
        .messages({
            'string.hex': 'the format of this id is not valid',
            'string.length': 'the length of this id is not valid',
            'any.required': 'this id is required'
        })
});
