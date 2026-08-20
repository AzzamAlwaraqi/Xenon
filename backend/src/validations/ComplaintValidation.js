const Joi = require('joi');
const AppError = require("../utils/AppError");

const createComplaintSchema = Joi.object({
    complaint_type: Joi.string().required().trim(),
    complaint_title: Joi.string().min(5).max(100).required().trim(),
    complaint_message: Joi.string().min(10).max(1000).required().trim(),
    complaint_priority: Joi.string().valid("low", "medium", "high", "critical").required(),
    vendor_id: Joi.string().uuid().optional().allow(null, ''),
    booking_id: Joi.string().uuid().optional().allow(null, '')
});

const queryComplaintSchema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    status: Joi.string().valid("pending", "accepted", "rejected", "cancelled", "completed").optional(),
    priority: Joi.string().valid("low", "medium", "high", "critical").optional(),
    type: Joi.string().optional(),
    vendor_id: Joi.string().uuid().optional(),
    search: Joi.string().optional().trim()
});

const paramIdSchema = Joi.object({
    complaintId: Joi.string().uuid().required().messages({
        'string.guid': 'Invalid Complaint ID format'
    })
});

const respondComplaintSchema = Joi.object({
    status: Joi.string().valid("pending", "accepted", "rejected", "completed").optional(),
    admin_response: Joi.string().max(1000).optional().trim()
}).min(1); 


// ==========================================
// 2. Middlewares (دوال التحقق)
// ==========================================

exports.createComplaintValidation = (req, res, next) => {
    const { error, value } = createComplaintSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return next(new AppError(error.details.map(d => d.message).join(" | "), 400));
    req.body = value;
    next();
};

exports.getComplaintsQueryValidation = (req, res, next) => {
    const { error, value } = queryComplaintSchema.validate(req.query, { abortEarly: false, stripUnknown: true });
    if (error) return next(new AppError(error.details.map(d => d.message).join(" | "), 400));
    req.query = value;
    next();
};

exports.complaintIdParamValidation = (req, res, next) => {
    const { error, value } = paramIdSchema.validate(req.params, { abortEarly: false, stripUnknown: true });
    if (error) return next(new AppError(error.details.map(d => d.message).join(" | "), 400));
    req.params = value;
    next();
};

exports.respondOnComplaintValidation = (req, res, next) => {
    const { error, value } = respondComplaintSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return next(new AppError(error.details.map(d => d.message).join(" | "), 400));
    req.body = value;
    next();
};