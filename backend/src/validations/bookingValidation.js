const joi = require('joi');

exports.createBookingValidation = function (body) {
    const Schema = joi.object({
        package_id: joi.string().uuid().required().messages({
            "string.guid": "Package ID must be a valid UUID"
        }),
        
        booking_date: joi.date().iso().min('now').required(),
        
        number_of_people: joi.number().integer().min(1).max(5).required().messages({
            'number.min': 'You must be at least one person.',
            'number.max': 'You can book for a maximum of 5 people only.',
            'number.base': 'Number of people must be a number.'
        }),
        user_id: joi.string().optional()
    });
    return Schema.validate(body, { stripUnknown: true });
};
////number of people can be updated and booking date  just or can chenge the pakage that can updated 
exports.updateBookingValidation = function (body) {
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

    return Schema.validate(body, { abortEarly: false, stripUnknown: true });
};

exports.bookingIdParamValidation = function (params) {
    const Schema = joi.object({
        id: joi.string().uuid().required().messages({
            "string.empty": "Booking ID is required",
            "string.guid": "Invalid Booking ID format, Booking ID must be a valid UUID",
            "any.required": "Booking ID is required"
        })
    });

    return Schema.validate(params, { abortEarly: false, stripUnknown: true });
};

exports.updateBookingStatusValidation = function (body) {
    const Schema = joi.object({
        status: joi.string().valid("accepted", "rejected", "completed").required().messages({
            "any.only": "Status must be one of: accepted, rejected, completed",
            "any.required": "Status is required"
        })
    });

    return Schema.validate(body, { abortEarly: false, stripUnknown: true });
};

exports.getAllRequestsQueryValidation = function (query) {
    const Schema = joi.object({
        package_id: joi.string().uuid().optional().messages({
            "string.guid": "Invalid Package ID format, must be a valid UUID"
        })
    });

    return Schema.validate(query, { abortEarly: false, stripUnknown: true });
};
