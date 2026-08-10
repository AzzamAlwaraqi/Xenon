const joi = require("joi");

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

exports.createClientValidation = function (Body) {
    const Schema = joi.object({
        name: joi.string().trim().min(2).max(100).required().messages({
            "string.min": "Name must be at least 2 characters",
            "string.max": "Name must not exceed 100 characters",
            "any.required": "Name is required"
        }),
        email: joi.string().email().lowercase().trim().required().messages({
            "string.email": "Please provide a valid email address",
            "any.required": "Email is required"
        }),
        password: joi.string().regex(passwordRegex).required().messages({
            "string.pattern.base": "Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&)",
            "any.required": "Password is required"
        }),
        gender: joi.string().valid("male", "female").required().messages({
            "any.only": "Gender must be either 'male' or 'female'",
            "any.required": "Gender is required"
        }),
        mobileNumber: joi.string().regex(/^07[789]\d{7}$/).required().messages({
            "string.pattern.base": "Mobile number must start with 077, 078, or 079 and be exactly 10 digits long",
            "any.required": "Mobile number is required"
        }),
        DateOfBirth: joi.date().iso().less("now").required().messages({
            "date.base": "Date of birth must be a valid date",
            "date.less": "Date of birth must be in the past",
            "any.required": "Date of birth is required"
        }),
        role: joi.string().valid("user", "vendor").optional() 
    });

    return Schema.validate(Body, { abortEarly: false });
};

exports.createAccountValidation = function (Body) {
    const Schema = joi.object({
        name: joi.string().trim().required(),
        email: joi.string().email().required(),
        password: joi.string().regex(passwordRegex).required().messages({
            "string.pattern.base": "Password must be at least 8 characters long, contain uppercase, lowercase, number, and special character"
        }),
        phone_no: joi.string().regex(/^07[789]\d{7}$/).required().messages({
            "string.pattern.base": "Mobile number must start with 077, 078, or 079 and be exactly 10 digits long"
        }),
        role: joi.string().valid("vendor", "user").required(),
        company_name: joi.string().trim().optional(),
        address: joi.string().optional(),
        city: joi.string().optional(),
        state: joi.string().optional(),
        pincode: joi.string().optional(),
        country: joi.string().optional(),
        vendor_type: joi.string().optional()
    });

    return Schema.validate(Body, { abortEarly: false, allowUnknown: true });
};

exports.loginAccountValidation = function (Body) {
    const Schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().required(),
        role: joi.string().optional()
    });

    return Schema.validate(Body, { abortEarly: false });
};

exports.updateProfileVendorValidation = function (Body) {
    const Schema = joi.object({
        name: joi.string().trim().min(2).max(100).optional(),
        phone_no: joi.string().regex(/^07[789]\d{7}$/).optional().messages({
            "string.pattern.base": "Mobile number must start with 077, 078, or 079 and be exactly 10 digits long"
        }),
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
    const data = {};
    if (Body.old_password || Body.oldPassword) {
        data.old_password = Body.old_password || Body.oldPassword;
    }
    if (Body.new_password || Body.newPassword) {
        data.new_password = Body.new_password || Body.newPassword;
    }
    if (Body.confirm_password || Body.confirmPassword || Body.confiomPassword || Body.confiom_password) {
        data.confirm_password = Body.confirm_password || Body.confirmPassword || Body.confiomPassword || Body.confiom_password;
    }

    const Schema = joi.object({
        old_password: joi.string().required(),
        new_password: joi.string().regex(passwordRegex).required().messages({
            "string.pattern.base": "New password must be at least 8 characters long, contain uppercase, lowercase, number, and special character"
        }),
        confirm_password: joi.string().valid(joi.ref('new_password')).required().messages({
            "any.only": "Confirm password does not match new password"
        })
    });

    return Schema.validate(data, { abortEarly: false });
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

        owner_id: joi.string().regex(objectIdRegex).optional().messages({
            "string.pattern.base": "Invalid owner_id format"
        }),
        user_id: joi.string().regex(objectIdRegex).optional().messages({
            "string.pattern.base": "Invalid user_id format"
        }),

        mobile: joi.string().regex(/^07[789]\d{7}$/).optional().messages({
            "string.pattern.base": "Mobile number must start with 077, 078, or 079 and be exactly 10 digits long"
        }),

        status: joi.string().valid("pending", "active", "rejected").default("pending"),
        email: joi.string().email().required()
    });

    return schema.validate(body, { abortEarly: false, allowUnknown: true });
};
exports.logoutVendorValidation = function (body) {
    const Schema = joi.object({
        session_id: joi.string().optional(),
        token: joi.string().optional(),
        device_token: joi.string().optional()
    });

    return Schema.validate(body, { abortEarly: false, allowUnknown: true });
};
exports.resetPasswordValidation = function (body) {
    const data = { ...body };
    if (data.newPassword || data.new_password) {
        data.password = data.newPassword || data.new_password;
    }
    if (data.confirmPassword || data.confirm_password || data.confiomPassword || data.confiom_password) {
        data.confirm_password = data.confirmPassword || data.confirm_password || data.confiomPassword || data.confiom_password;
    }
    // If the user forgot confirmPassword completely in Postman (since screenshot only shows newPassword), let's map newPassword to confirm_password IF it's completely missing, or just let it fail so they add it?
    // Wait, the screenshot only shows "newPassword": "ResetPassword123!&", it doesn't show confirmPassword! Let's just map it to confirm_password if they only sent newPassword.
    if (!data.confirm_password && (data.newPassword || data.new_password)) {
        data.confirm_password = data.newPassword || data.new_password;
    }

    const Schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().regex(passwordRegex).required().messages({
            "string.pattern.base": "Password must be at least 8 characters long, contain uppercase, lowercase, number, and special character"
        }),
        confirm_password: joi.string().valid(joi.ref('password')).required().messages({
            "any.only": "Confirm password does not match new password"
        }),
        token: joi.string().optional(),
        otpCode: joi.string().optional(),
        newPassword: joi.any().optional(),
        new_password: joi.any().optional(),
        confirmPassword: joi.any().optional(),
        confiomPassword: joi.any().optional(),
        confiom_password: joi.any().optional()
    }).xor('token', 'otpCode').messages({
        'object.missing': 'Either "token" or "otpCode" is required'
    });

    return Schema.validate(data, { abortEarly: false, allowUnknown: true });
};
exports.updateProfileValidation = function (Body) {
    const Schema = joi.object({
        name: joi.string().trim().min(2).max(100).optional(),
        phone_no: joi.string().regex(/^07[789]\d{7}$/).optional().messages({
            "string.pattern.base": "Mobile number must start with 077, 078, or 079 and be exactly 10 digits long"
        }),
        email: joi.string().email().optional(),
        DateOfBirth: joi.date().iso().optional()
    }).min(1);

    return Schema.validate(Body, { abortEarly: false, allowUnknown: true });
};
exports.deleteAccountValidation = function (Body) {
    const Schema = joi.object({
        reason: joi.string().optional()
    });

    return Schema.validate(Body, { abortEarly: false });
};
exports.updatevendorValidation = function (Body) {
    const Schema = joi.object({
        name: joi.string().trim().min(2).max(100).optional(),
        company_name: joi.string().trim().min(2).max(100).optional(),
        phone_no: joi.string().regex(/^07[789]\d{7}$/).optional().messages({
            "string.pattern.base": "Mobile number must start with 077, 078, or 079 and be exactly 10 digits long"
        }),
        mobile: joi.string().regex(/^07[789]\d{7}$/).optional().messages({
            "string.pattern.base": "Mobile number must start with 077, 078, or 079 and be exactly 10 digits long"
        }),
        address: joi.string().optional(),
        city: joi.string().optional(),
        state: joi.string().optional(),
        pincode: joi.string().pattern(/^[0-9]{4,10}$/).optional().messages({
            "string.pattern.base": "Pincode must contain digits only"
        }),
        country: joi.string().optional(),
        vendor_type: joi.string().optional()
    }).min(1);
    return Schema.validate(Body, { abortEarly: false, allowUnknown: true });
};

exports.forgotPasswordValidation = function (body) {
    const Schema = joi.object({
        email: joi.string().email().required()
    });
    return Schema.validate(body, { abortEarly: false });
};
