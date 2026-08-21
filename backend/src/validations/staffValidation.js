const Joi = require('joi');
const AppError = require('../utils/AppError');
const { STAFF_POSITIONS } = require('../utils/checkvalidete');

const ROLES = ['admin', 'vendor'];
const WORK_SYSTEMS = ["part-time", "full-time", "contract", "freelance"];
const ADMIN_POSITIONS = STAFF_POSITIONS.admin;
const VENDOR_POSITIONS = STAFF_POSITIONS.vendor;

const MIN_SALARY_JORDAN = 260; 
const MIN_HOURLY_RATE = 1.25;

const CORPORATE_EMAIL_REGEX = /@xenon\.com$/i;
const STRONG_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;


const objectIdSchema = Joi.object({
    id: Joi.string().hex().length(24).required().messages({
        'string.hex': 'Invalid ID format',
        'string.length': 'ID must be exactly 24 characters long',
        'any.required': 'Employee ID is required in the URL'
    })
});

const getAllStaffSchema = Joi.object({
    page: Joi.number().min(1).optional(),
    limit: Joi.number().min(1).optional(),
    role: Joi.string().valid(...ROLES).optional(),
    job_active: Joi.boolean().optional(),
    sort: Joi.string().optional()
}).unknown(true);

const createStaffSchema = Joi.object({
    name: Joi.string().trim().min(3).max(50).required(),
    
    email: Joi.string().email().pattern(CORPORATE_EMAIL_REGEX).required().messages({
        'string.pattern.base': 'Employees must use a corporate email ending with @xenon.com'
    }),

    mobileNumber: Joi.string().pattern(/^\d{10}$/).required().messages({
        'string.pattern.base': 'Mobile number must be exactly 10 digits'
    }),
    
    password: Joi.string().pattern(STRONG_PASSWORD_REGEX).required().messages({
        'string.pattern.base': 'Password must be at least 8 characters long and contain at least one letter and one number'
    }),
    
    role: Joi.string().valid(...ROLES).required(),

    workSystem: Joi.string().valid(...WORK_SYSTEMS).required().messages({
        'any.only': 'Work system type is not correct'
    }),

    position: Joi.string().when('role', {
        is: 'admin',
        then: Joi.valid(...ADMIN_POSITIONS).required(),
        otherwise: Joi.when('role', {
            is: 'vendor',
            then: Joi.valid(...VENDOR_POSITIONS).required(),
            otherwise: Joi.forbidden()
        })
    }),

    basePay: Joi.number().min(0).required().messages({
        'any.required': "Base pay (salary or hourly rate) is required."
    }),

    allowances: Joi.number().min(0).when('workSystem', {
        is: Joi.valid('full-time', 'contract'),
        then: Joi.optional().messages({
            'number.min': "Allowances cannot be a negative number."
        }),
        otherwise: Joi.forbidden()
    })
});

const updateStaffSchema = Joi.object({
    role: Joi.string().valid(...ROLES).optional(),
    
    email: Joi.string().email().pattern(CORPORATE_EMAIL_REGEX).optional().messages({
        'string.pattern.base': 'Employees must use a corporate email ending with @xenon.com'
    }),

    mobileNumber: Joi.string().pattern(/^\d{10}$/).optional().messages({
        'string.pattern.base': 'Mobile number must be exactly 10 digits'
    }),

    workSystem: Joi.string().valid(...WORK_SYSTEMS).optional(),

    position: Joi.string().optional(),

    basePay: Joi.number().min(0).optional(),

    allowances: Joi.number().min(0).optional(),

    job_active: Joi.boolean().optional()
})
.min(1);

const handleJoiError = (error, next) => {
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(', ');
        return next(new AppError(errorMessage, 400));
    }
};

exports.createStaffValidation = (req, res, next) => {
    if (!req.body.role && req.user) {
        if (req.user.role === 'vendor') {
            req.body.role = 'vendor';
        } else if (req.user.role === 'admin') {
            req.body.role = req.body.vendor_id ? 'vendor' : 'admin';
        }
    }
    const { error, value } = createStaffSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) return handleJoiError(error, next);
    req.body = value;
    next();
};

exports.updateStaffValidation = (req, res, next) => {
    const { error: idError } = objectIdSchema.validate(req.params);
    if (idError) return handleJoiError(idError, next);

    const { error: bodyError } = updateStaffSchema.validate(req.body, { abortEarly: false });
    if (bodyError) return handleJoiError(bodyError, next);
    
    next();
};


exports.getOrDeleteStaffValidation = (req, res, next) => {
    const { error } = objectIdSchema.validate(req.params);
    if (error) return handleJoiError(error, next);
    next();
};

exports.getAllStaffValidation = (req, res, next) => {
    const { error, value } = getAllStaffSchema.validate(req.query, { abortEarly: false, stripUnknown: true });
    if (error) return handleJoiError(error, next);
    req.query = value;
    next();
};

exports.staffIdParamValidation = exports.getOrDeleteStaffValidation;