const joi = require('joi');

exports.createBookingValidation = function (body) {
    const Schema = joi.object({
        package_id: joi.string().required(),
        
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
        package_id: joi.string().optional(),
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

exports.deleteBookingValidation = function (body) {
    const Schema = joi.object({
        booking_id: joi.string().hex().length(24).required().messages({
            "string.empty": "Booking ID is required",
            "string.hex": "Invalid Booking ID format",
            "string.length": "Booking ID must be a valid 24-character hex string",
            "any.required": "Booking ID is required"
        })
    });

    return Schema.validate(body, { abortEarly: false, stripUnknown: true });
};
