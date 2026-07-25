
const Joi = require('joi');
const AppError = require('../utils/AppError');

const createPackageSchema = Joi.object({
    package_name: Joi.string().min(3).max(100).required().messages({
        'string.empty': 'Package name is required',
        'string.min': 'Package name must be at least 3 characters long'
    }),
    package_price: Joi.number().min(0).required().messages({
        'number.base': 'Package price must be a number',
        'any.required': 'Package price is required'
    }),
    package_description: Joi.string().max(500).allow('', null),
    package_type: Joi.string().required(),
    package_status: Joi.string().valid('active', 'inactive', 'draft').default('active'),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required().messages({
        'date.min': 'End date must be after start date'
    })
});

const updatePackageSchema = Joi.object({
    package_name: Joi.string().min(3).max(100),
    package_price: Joi.number().min(0),
    package_description: Joi.string().max(500).allow('', null),
    package_type: Joi.string(),
    package_status: Joi.string().valid('active', 'inactive', 'draft'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate'))
});

// 3. Middleware to check package validation
exports.validateCreatePackage = (req, res, next) => {
    const { error } = createPackageSchema.validate(req.body, { abortEarly: false });
    
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(', ');
        return next(new AppError(errorMessage, 400));
    }
    next();
};

exports.validateUpdatePackage = (req, res, next) => {
    const { error } = updatePackageSchema.validate(req.body, { abortEarly: false });
    
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(', ');
        return next(new AppError(errorMessage, 400));
    }
    next();
};