const Joi = require("joi");
const AppError = require("../utils/AppError");

const addBookingPaymentSchema = Joi.object({
    booking_id: Joi.string().uuid().required(),
    amount: Joi.number().min(0.01).required(),
    payment_method: Joi.string().valid('CliQ', 'Cash', 'ManualBankTransfer', 'OnlineGateway').required(),
    customer_phone: Joi.string().length(10).pattern(/^\d+$/).required(),
    payment_description: Joi.string().max(500).required(),
    receipt_image_url: Joi.string().uri().optional().allow('', null),
    transaction_id: Joi.string().optional().allow('', null),
    payment_metadata: Joi.object().optional()
});

const updateBookingPaymentSchema = Joi.object({
    amount: Joi.number().min(0.01).optional(),
    payment_method: Joi.string().valid('CliQ', 'Cash', 'ManualBankTransfer', 'OnlineGateway').optional(),
    payment_description: Joi.string().max(500).optional(),
    receipt_image_url: Joi.string().uri().optional().allow('', null),
    transaction_id: Joi.string().optional().allow('', null),
    payment_metadata: Joi.object().optional()
}).min(1);

const addSubscriptionSchema = Joi.object({
    vendor_id: Joi.string().uuid().required(),
    amount: Joi.number().min(0.01).required(),
    payment_method: Joi.string().valid('CliQ', 'ManualBankTransfer', 'OnlineGateway').required(),
    payment_description: Joi.string().max(500).required(),
    receipt_image_url: Joi.string().uri().optional().allow('', null),
    transaction_id: Joi.string().optional().allow('', null),
    payment_metadata: Joi.object().optional()
});

const updateSubscriptionSchema = Joi.object({
    amount: Joi.number().min(0.01).optional(),
    payment_method: Joi.string().valid('CliQ', 'ManualBankTransfer', 'OnlineGateway').optional(),
    payment_description: Joi.string().max(500).optional(),
    receipt_image_url: Joi.string().uri().optional().allow('', null),
    transaction_id: Joi.string().optional().allow('', null),
    payment_metadata: Joi.object().optional()
}).min(1);

const paramIdSchema = Joi.object({
    id: Joi.string().uuid().required().messages({
        'string.guid': 'The format of this ID is invalid (must be UUID)'
    })
});

const phoneSchema = Joi.object({
    phone: Joi.string().length(10).pattern(/^\d+$/).required().messages({
        'string.length': 'Phone number must be exactly 10 digits',
        'string.pattern.base': 'Phone number must contain only numbers'
    })
});

exports.addBookingPaymentValidation = (req, res, next) => {
    const { error, value } = addBookingPaymentSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return next(new AppError(error.details.map(d => d.message).join(" | "), 400));
    req.body = value;
    next();
};

exports.updateBookingPaymentValidation = (req, res, next) => {
    const { error, value } = updateBookingPaymentSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return next(new AppError(error.details.map(d => d.message).join(" | "), 400));
    req.body = value;
    next();
};

exports.addSubscriptionValidation = (req, res, next) => {
    const { error, value } = addSubscriptionSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return next(new AppError(error.details.map(d => d.message).join(" | "), 400));
    req.body = value;
    next();
};

exports.updateSubscriptionValidation = (req, res, next) => {
    const { error, value } = updateSubscriptionSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return next(new AppError(error.details.map(d => d.message).join(" | "), 400));
    req.body = value;
    next();
};

exports.paramIdValidation = (req, res, next) => {
    const { error, value } = paramIdSchema.validate({ id: req.params.id }, { abortEarly: false, stripUnknown: true });
    if (error) return next(new AppError(error.details.map(d => d.message).join(" | "), 400));
    req.params.id = value.id;
    next();
};

exports.phoneValidation = (req, res, next) => {
    const { error, value } = phoneSchema.validate({ phone: req.params.phone }, { abortEarly: false, stripUnknown: true });
    if (error) return next(new AppError(error.details.map(d => d.message).join(" | "), 400));
    req.params.phone = value.phone;
    next();
};
