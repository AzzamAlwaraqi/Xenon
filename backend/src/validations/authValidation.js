const joi = require("joi");
const { checkRole } = require("../utils/checkvalidete");
const AppError = require("../utils/AppError");

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const jordanMobileRegex = /^07[789]\d{7}$/;
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const passwordMessages = {
    "string.pattern.base": "Password must be at least 8 characters long, contain uppercase, lowercase, number, and special character (@$!%*?&)",
    "any.required": "Password is required"
};

const customDateValidator = (value, helpers) => {
    let date;
    if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
        const [day, month, year] = value.split('/');
        date = new Date(`${year}-${month}-${day}T00:00:00Z`);
    } else {
        date = new Date(value);
    }

    if (isNaN(date.getTime())) {
        return helpers.message(`"${helpers.state.path.join('.')}" must be a valid date in DD/MM/YYYY or ISO format`);
    }
    if (date >= new Date()) {
        return helpers.message(`"${helpers.state.path.join('.')}" must be in the past`);
    }
    return date;
};

const mobileMessages = {
    "string.pattern.base": "Mobile number must start with 077, 078, or 079 and be exactly 10 digits long",
    "any.required": "Mobile number is required"
};

const baseUserSchema = {
    name: joi.string().trim().min(2).max(100),
    email: joi.string().email().lowercase().trim(),
    password: joi.string().regex(passwordRegex).messages(passwordMessages),
    mobileNumber: joi.string().regex(jordanMobileRegex).messages(mobileMessages),
    role: joi.string().valid("user", "vendor").default("user")
};

const baseVendorSchema = {
    company_name: joi.string().trim().min(2).max(100),
    address: joi.string().trim(),
    city: joi.string().trim(),
    state: joi.string().trim(),
    pincode: joi.string().pattern(/^[0-9]{4,10}$/).messages({ "string.pattern.base": "Pincode must contain digits only" }),
    country: joi.string().trim(),
    vendor_type: joi.string().trim()
};

const validateMiddleware = (schema, dataToValidate, req, next) => {
    const { error, value } = schema.validate(dataToValidate, { abortEarly: false, stripUnknown: true });
    if (error) {
        return next(new AppError(error.details.map(d => d.message).join(" | "), 400));
    }
    req.body = value;
    next();
};

exports.createAccountValidation = function (req, res, next) {
    const Schema = joi.object({
        ...baseUserSchema,
        name: baseUserSchema.name.required(),
        email: baseUserSchema.email.required(),
        password: baseUserSchema.password.required(),
        mobileNumber: baseUserSchema.mobileNumber.required(),
        
        gender: joi.string().valid("male", "female").optional(),
        DateOfBirth: joi.any().custom(customDateValidator).optional(),
        
        ...baseVendorSchema
    });
    validateMiddleware(Schema, req.body, req, next);
};

exports.loginValidation = function (req, res, next) {
    const Schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().required(),
        role: joi.string().valid("user", "vendor", "admin").optional()
    });
    validateMiddleware(Schema, req.body, req, next);
};

exports.forgotPasswordValidation = function (req, res, next) {
    const Schema = joi.object({
        email: joi.string().email().required()
    });
    validateMiddleware(Schema, req.body, req, next);
};

exports.resetPasswordValidation = function (req, res, next) {
    const Schema = joi.object({
        email: joi.string().email().required(),
        password: joi.string().regex(passwordRegex).required().messages(passwordMessages),
        confirm_password: joi.string().valid(joi.ref('password')).required().messages({
            "any.only": "Confirm password does not match new password"
        }),
        token: joi.string().optional(),
        otpCode: joi.string().optional()
    }).xor('token', 'otpCode').messages({
        'object.missing': 'Either "token" or "otpCode" is required'
    });

    const cleanData = {
        email: req.body.email,
        password: req.body.newPassword || req.body.new_password || req.body.password,
        confirm_password: req.body.confirmPassword || req.body.confirm_password || req.body.newPassword || req.body.password, 
        token: req.body.token,
        otpCode: req.body.otpCode
    };

    validateMiddleware(Schema, cleanData, req, next);
};

exports.changePasswordValidation = function (req, res, next) {
    const Schema = joi.object({
        old_password: joi.string().required(),
        new_password: joi.string().regex(passwordRegex).required().messages(passwordMessages),
        confirm_password: joi.string().valid(joi.ref('new_password')).required().messages({
            "any.only": "Confirm password does not match new password"
        })
    });

    const cleanData = {
        old_password: req.body.oldPassword || req.body.old_password,
        new_password: req.body.newPassword || req.body.new_password,
        confirm_password: req.body.confirmPassword || req.body.confirm_password || req.body.confiomPassword // Supported user typo 'confiomPassword'
    };

    validateMiddleware(Schema, cleanData, req, next);
};

exports.updateProfileValidation = function (req, res, next) {
    const role = req.user ? req.user.role : req.body.role;
    let schemaObj = {
        name: baseUserSchema.name.optional(),
        mobileNumber: baseUserSchema.mobileNumber.optional(),
        email: baseUserSchema.email.optional()
    };

    if (checkRole(role, ["user"])) {
        schemaObj.DateOfBirth = joi.any().custom(customDateValidator).optional();
        schemaObj.gender = joi.string().valid("male", "female").optional();
    }

    if (checkRole(role, ["vendor"])) {
        schemaObj = { ...schemaObj, ...baseVendorSchema };
    }

    const Schema = joi.object(schemaObj).min(1); 
    validateMiddleware(Schema, req.body, req, next);
};

exports.logoutValidation = function (req, res, next) {
    const Schema = joi.object({
        token: joi.string().optional(),
        device_token: joi.string().optional()
    });
    validateMiddleware(Schema, req.body, req, next);
};

exports.deleteAccountValidation = function (req, res, next) {
    const Schema = joi.object({
        reason: joi.string().trim().max(500).optional()
    });
    validateMiddleware(Schema, req.body, req, next);
};

exports.sendOtpValidation = function (req, res, next) {
    const Schema = joi.object({
        email: joi.string().email().lowercase().trim().messages({
            "string.email": "Please provide a valid email address"
        }),
        purpose: joi.string().valid("registration", "password_reset", "login", "account_verification").default("registration"),
        length: joi.number().min(6).max(6).optional()
    }).or('email', 'phone').messages({
        'object.missing': 'You must provide either an email or a phone number to receive the OTP'
    });
    validateMiddleware(Schema, req.body, req, next);
};

exports.verifyOtpValidation = function (req, res, next) {
    const Schema = joi.object({
        email: joi.string().email().lowercase().trim(),
        otp: joi.string().trim().required().messages({
            "any.required": "OTP code is required",
            "string.empty": "OTP code cannot be empty"
        }),
        purpose: joi.string().valid("registration", "password_reset", "login", "account_verification").default("registration")
    }).or('email', 'phone').messages({
        'object.missing': 'You must provide either an email or a phone number to verify the OTP'
    });
    validateMiddleware(Schema, req.body, req, next);
};

exports.refreshTokenValidation = function (req, res, next) {
    const Schema = joi.object({
        refreshToken: joi.string().required().messages({
            "any.required": "Refresh token is required"
        })
    });
    validateMiddleware(Schema, req.body, req, next);
};