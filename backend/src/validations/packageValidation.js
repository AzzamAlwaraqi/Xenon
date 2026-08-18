
const Joi = require('joi');
const AppError = require('../utils/AppError');

const { setStandardDate } = require('../utils/dateFormatter');

const createPackageSchema = Joi.object({
    // vendor_id is securely extracted from the authenticated user token
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

// 3. Middleware to check package validation
exports.validateCreatePackage = (req, res, next) => {
    const { error, value } = createPackageSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (!error) req.body = value;
    
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(', ');
        return next(new AppError(errorMessage, 400));
    }
    next();
};

exports.validateUpdatePackage = (req, res, next) => {
    const { error, value } = updatePackageSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (!error) req.body = value;
    
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(', ');
        return next(new AppError(errorMessage, 400));
    }
    next();
};

const packageIdSchema = Joi.object({
    id: Joi.string().uuid().required().messages({
        'string.empty': 'ID is required',
        'string.guid': 'Invalid ID format, must be a valid UUID',
        'any.required': 'ID is required'
    })
});

exports.createPackageValidate = (req, res) => {
    if (req.body.startDate) req.body.startDate = setStandardDate(req.body.startDate);
    if (req.body.endDate) req.body.endDate = setStandardDate(req.body.endDate);

    const { error, value } = createPackageSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (!error) req.body = value;
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(', ');
        res.AppError(errorMessage, 400);
        return false;
    }
    return true;
};

exports.getAllPackagesValidate = (req, res) => {
    return true;
};

exports.getPackageValidate = (req, res) => {
    const { error } = packageIdSchema.validate({ id: req.params.id }, { abortEarly: false });
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(', ');
        res.AppError(errorMessage, 400);
        return false;
    }
    return true;
};

exports.updatePackageValidate = (req, res) => {
    const idValidation = packageIdSchema.validate({ id: req.params.id }, { abortEarly: false });
    if (idValidation.error) {
        const errorMessage = idValidation.error.details.map(err => err.message).join(', ');
        res.AppError(errorMessage, 400);
        return false;
    }
    
    if (req.body.startDate) req.body.startDate = setStandardDate(req.body.startDate);
    if (req.body.endDate) req.body.endDate = setStandardDate(req.body.endDate);

    const bodyValidation = updatePackageSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (!bodyValidation.error) req.body = bodyValidation.value;
    if (bodyValidation.error) {
        const errorMessage = bodyValidation.error.details.map(err => err.message).join(', ');
        res.AppError(errorMessage, 400);
        return false;
    }
    return true;
};

exports.deletePackageValidate = (req, res) => {
    const { error } = packageIdSchema.validate({ id: req.params.id }, { abortEarly: false });
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(', ');
        res.AppError(errorMessage, 400);
        return false;
    }
    return true;
};