const joi = require("joi");

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

exports.createAccountValidation = function (Body) {
    const Schema = joi.object({
        name: joi.string().trim().required(),
        email: joi.string().email().required(),
        password: joi.string().regex(passwordRegex).required().messages({
            "string.pattern.base": "Password must be at least 8 characters long, contain uppercase, lowercase, number, and special character"
        }),
        phone_no: joi.string().regex(/^[6-9]\d{9}$/).required().messages({
            "string.pattern.base": "Invalid phone number format"
        }),
        role: joi.string().valid("vendor", "user").required()
    });

    return Schema.validate(Body, { abortEarly: false });
};

exports.loginAccountValidation = function (Body) {
    const Schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().required(),
        role: joi.string().valid("vendor", "user").required()
    });

    return Schema.validate(Body, { abortEarly: false });
};

exports.updateProfileVendorValidation = function (Body) {
    const Schema = joi.object({
        name: joi.string().trim().min(2).max(100).optional(),
        phone_no: joi.string().regex(/^[6-9]\d{9}$/).optional(),
        company_name: joi.string().trim().min(2).max(100).optional(),
        address: joi.string().optional(),
        city: joi.string().optional(),
        state: joi.string().optional(),
        pincode: joi.string().pattern(/^[0-9]{4,10}$/).optional(),
        country: joi.string().optional(),
        vendor_type: joi.string().optional(),
        file: joi.string().optional()
    }).min(1); 

    return Schema.validate(Body, { abortEarly: false });
};

exports.changePasswordValidation = function (Body) {
    const Schema = joi.object({
        old_password: joi.string().required(),
        new_password: joi.string().regex(passwordRegex).required().messages({
            "string.pattern.base": "New password must be at least 8 characters long, contain uppercase, lowercase, number, and special character"
        }),
        confirm_password: joi.string().valid(joi.ref('new_password')).required().messages({
            "any.only": "Confirm password does not match new password"
        })
    });

    return Schema.validate(Body, { abortEarly: false });
};

exports.toVendorValidation = function (body) {
    const schema = joi.object({
        company_name: joi.string().trim().min(2).max(100).required(),
        address: joi.string().required(),
        city: joi.string().required(),
        state: joi.string().required(),
        pincode: joi.string().pattern(/^[0-9]{4,10}$/).required().messages({
            "string.pattern.base": "Pincode must contain digits only"
        }),
        country: joi.string().required(),
        vendor_type: joi.string().required(),

        owner_id: joi.string().regex(objectIdRegex).required().messages({
            "string.pattern.base": "Invalid owner_id format"
        }),
        user_id: joi.string().regex(objectIdRegex).required().messages({
            "string.pattern.base": "Invalid user_id format"
        }),

        mobile: joi.string().pattern(/^[0-9+\s-]{8,15}$/).required().messages({
            "string.pattern.base": "Invalid mobile phone number format"
        }),

        status: joi.string().valid("pending", "active", "rejected").default("pending"),
        email: joi.string().email().required()
    });

    return schema.validate(body, { abortEarly: false });
};
exports.logoutVendorValidation = function (body) {
    const Schema = joi.object({
        session_id: joi.string().regex(objectIdRegex).required().messages({
            "string.pattern.base": "Invalid session_id format",
            "any.required": "session_id is required for logout"
        })
    });

    return Schema.validate(body, { abortEarly: false });
};
exports.resetPasswordVendorValidation = function (body) {
    const Schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().regex(passwordRegex).required().messages({
            "string.pattern.base": "Password must be at least 8 characters long, contain uppercase, lowercase, number, and special character"
        }),
        confirm_password: joi.string().valid(joi.ref('password')).required().messages({
            "any.only": "Confirm password does not match new password"
        }),
        token: joi.string().required(),
    });

    return Schema.validate(body, { abortEarly: false });
};
exports.updateProfileValidation = function (Body) {
    const Schema = joi.object({
        name: joi.string().trim().min(2).max(100).optional(),
        phone_no: joi.string().regex(/^[6-9]\d{9}$/).optional(),
    }).min(1);

    return Schema.validate(Body, { abortEarly: false });
};
exports.deleteAccountValidation = function (Body) {
    const Schema = joi.object({
        reason: joi.string().optional()
    });

    return Schema.validate(Body, { abortEarly: false });
};
exports.updatevendorValidation = function (Body) {
    const Schema = joi.object({
        vendor_mobile: joi.string().regex(/^[6-9]\d{9}$/).optional(),
        vendor_address: joi.string().optional(),
        vendor_city: joi.string().optional(),
        vendor_state: joi.string().optional(),
        vendor_pincode: joi.string().regex(/^[0-9]{4,10}$/).optional(),
        vendor_country: joi.string().optional(),
        is_Active: joi.boolean().optional()
    }).min(1);
    return Schema.validate(Body, { abortEarly: false, stripUnknown: true });
};
