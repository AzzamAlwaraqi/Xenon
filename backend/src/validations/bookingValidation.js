const joi = require('joi');
const AppError = require("../utils/AppError");
const { setStandardDate } = require("../utils/dateFormatter");

exports.createBookingValidation = function (req, res, next) {
    if (req.body.date) {
        req.body.date = setStandardDate(req.body.date);
    }

    const Schema = joi.object({
        package_Name: joi.string().required().messages({
            "any.required": "Package name is required"
        }),
        VENDOR_Name: joi.string().required().messages({
            "any.required": "Vendor name is required"
        }),
        date: joi.date().min('now').required().messages({
            "any.required": "Booking date is required",
            "date.min": "Booking date must be in the future"
        }),
        guests: joi.number().integer().min(1).max(5).required().messages({
            'number.min': 'You must be at least one person.',
            'number.max': 'You can book for a maximum of 5 people only.',
            'number.base': 'Number of guests must be a number.',
            'any.required': 'Number of guests is required'
        }),
        user_id: joi.string().optional()
    });

    const { error, value } = Schema.validate(req.body, { stripUnknown: true, abortEarly: false });
    if (error) return next(new AppError(error.details.map(d => d.message).join(" | "), 400));
    req.body = value;
    next();
};

exports.updateBookingValidation = function (req, res, next) {
    const Schema = joi.object({
        package_id: joi.string().uuid().optional().messages({
            "string.guid": "Package ID must be a valid UUID"
        }),
        booking_date: joi.date().iso().optional().messages({
            "date.format": "Booking date must be a valid ISO date"
        }),
        number_of_people: joi.number().integer().min(1).max(5).optional().messages({
            "number.min": "Number of people must be at least 1",
            "number.max": "Number of people cannot exceed 5"
        }),
        status: joi.string().valid("pending", "confirmed", "cancelled", "completed").optional()
    }).min(1).messages({
        "object.min": "At least one field must be provided for update"
    });

    const { error, value } = Schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return next(new AppError(error.details.map(d => d.message).join(" | "), 400));
    req.body = value;
    next();
};

exports.bookingIdParamValidation = function (req, res, next) {
    const Schema = joi.object({
        id: joi.string().uuid().required().messages({
            "string.empty": "Booking ID is required",
            "string.guid": "Invalid Booking ID format, Booking ID must be a valid UUID",
            "any.required": "Booking ID is required"
        })
    });

    const { error, value } = Schema.validate(req.params, { abortEarly: false, stripUnknown: true });
    if (error) return next(new AppError(error.details.map(d => d.message).join(" | "), 400));
    req.params = value;
    next();
};

exports.updateBookingStatusValidation = function (req, res, next) {
    const Schema = joi.object({
        status: joi.string().valid("accepted", "rejected", "completed").required().messages({
            "any.only": "Status must be one of: accepted, rejected, completed",
            "any.required": "Status is required"
        })
    });

    const { error, value } = Schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return next(new AppError(error.details.map(d => d.message).join(" | "), 400));
    req.body = value;
    next();
};

exports.getAllRequestsQueryValidation = function (req, res, next) {
    const Schema = joi.object({
        package_id: joi.string().uuid().optional().messages({
            "string.guid": "Invalid Package ID format, must be a valid UUID"
        })
    });

    const dataToValidate = req.params.package_id ? req.params : req.query;
    const { error, value } = Schema.validate(dataToValidate, { abortEarly: false, stripUnknown: true });
    if (error) return next(new AppError(error.details.map(d => d.message).join(" | "), 400));
    
    if (req.params.package_id) {
        req.params = value;
    } else {
        req.query = value;
    }
    next();
};
