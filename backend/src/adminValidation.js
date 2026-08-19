const Joi = require('joi');
const AppError = require('./utils/AppError');
const { STAFF_POSITIONS } = require('./utils/checkvalidete');

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
        const errorMessages = error.details.map(detail => detail.message).join(' | ');
        return next(new AppError(`Validation Error: ${errorMessages}`, 400));
    }
    next();
};

const registerAdminSchema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    passwordConfirm: Joi.any().valid(Joi.ref('password')).required().messages({
        'any.only': 'Passwords do not match.'
    }),
    mobileNumber: Joi.string().pattern(/^[0-9]{10,15}$/).required().messages({
        'string.pattern.base': 'Invalid mobile number format.'
    }),
    position: Joi.string().valid(...STAFF_POSITIONS.admin).optional(),
    
    adminSecretKey: Joi.string().optional()
});

exports.registerAdminValidator = validate(registerAdminSchema);