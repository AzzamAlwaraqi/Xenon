const Joi = require('joi');
const AppError = require('../utils/AppError');
const { setStandardDate } = require('../utils/dateFormatter');

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
    startDate: Joi.date().required(),
    endDate: Joi.date().min(Joi.ref('startDate')).required().messages({
        'date.min': 'End date must be after start date'
    })
});

const updatePackageSchema = Joi.object({
    package_name: Joi.string().min(3).max(100),
    package_price: Joi.number().min(0),
    package_description: Joi.string().max(500).allow('', null),
    package_type: Joi.string(),
    package_status: Joi.string().valid('active', 'inactive', 'draft'),
    startDate: Joi.date(),
    endDate: Joi.date().min(Joi.ref('startDate'))
});

const packageIdSchema = Joi.object({
    id: Joi.string().uuid().required().messages({
        'string.empty': 'ID is required',
        'string.guid': 'Invalid ID format, must be a valid UUID',
        'any.required': 'ID is required'
    })
});

exports.validateCreatePackage = (req, res, next) => {
    if (req.body.startDate) req.body.startDate = setStandardDate(req.body.startDate);
    if (req.body.endDate) req.body.endDate = setStandardDate(req.body.endDate);

    const { error, value } = createPackageSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(' | ');
        return next(new AppError(errorMessage, 400));
    }
    req.body = value;
    next();
};

exports.validateUpdatePackage = (req, res, next) => {
    if (req.body.startDate) req.body.startDate = setStandardDate(req.body.startDate);
    if (req.body.endDate) req.body.endDate = setStandardDate(req.body.endDate);

    const { error, value } = updatePackageSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(' | ');
        return next(new AppError(errorMessage, 400));
    }
    req.body = value;
    next();
};

exports.packageIdParamValidation = (req, res, next) => {
    const { error, value } = packageIdSchema.validate(req.params, { abortEarly: false, stripUnknown: true });
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(' | ');
        return next(new AppError(errorMessage, 400));
    }
    req.params = value;
    next();
};