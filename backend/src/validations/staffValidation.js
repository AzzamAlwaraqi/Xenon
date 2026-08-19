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
const STRONG_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;


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

    salary: Joi.number().min(MIN_SALARY_JORDAN).when('workSystem', {
        is: Joi.valid('full-time', 'contract'),
        then: Joi.required().messages({
            'any.required': "A fixed salary is required for full-time or contract-based positions."
        }),
        otherwise: Joi.forbidden().messages({
            'any.unknown': "A fixed salary is not allowed for part-time or freelance positions. Please use 'hourOfWork' instead."
        })
    }),

    allowances: Joi.number().min(0).when('workSystem', {
        is: Joi.valid('full-time', 'contract'),
        then: Joi.optional().messages({
            'number.min': "Allowances cannot be a negative number."
        }),
        otherwise: Joi.forbidden()
    }),

    hourOfWork: Joi.number().min(MIN_HOURLY_RATE).when('workSystem', {
        is: Joi.valid('part-time', 'freelance'),
        then: Joi.required().messages({
            'any.required': "An hourly rate is required for part-time or freelance positions."
        }),
        otherwise: Joi.forbidden().messages({
            'any.unknown': "An hourly rate is not allowed for full-time or contract-based positions. Please use 'salary' instead."
        })
    })
});

const updateStaffSchema = Joi.object({
    role: Joi.string().valid(...ROLES).optional(),
    
    email: Joi.string().email().pattern(CORPORATE_EMAIL_REGEX).optional().messages({
        'string.pattern.base': 'Employees must use a corporate email ending with @xenon.com'
    }),

    workSystem: Joi.string().valid(...WORK_SYSTEMS).optional(),

    position: Joi.string().optional(),

    salary: Joi.number().min(MIN_SALARY_JORDAN).optional(),

    allowances: Joi.number().min(0).optional(),

    hourOfWork: Joi.number().min(MIN_HOURLY_RATE).optional(),

    job_active: Joi.boolean().optional()
})
.min(1)
.when(Joi.object({ workSystem: Joi.valid('full-time', 'contract') }).unknown(), {
    then: Joi.object({
        hourOfWork: Joi.forbidden().messages({
            'any.unknown': "Cannot add an hourly rate to full-time or contract systems."
        })
    })
})
.when(Joi.object({ workSystem: Joi.valid('freelance', 'part-time') }).unknown(), {
    then: Joi.object({
        salary: Joi.forbidden().messages({
            'any.unknown': "Cannot add a fixed salary to freelance or part-time systems."
        }),
        allowances: Joi.forbidden()
    })
});

const handleJoiError = (error, next) => {
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(', ');
        return next(new AppError(errorMessage, 400));
    }
};

exports.createStaffValidation = (req, res, next) => {
    const { error } = createStaffSchema.validate(req.body, { abortEarly: false });
    if (error) return handleJoiError(error, next);
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
    const { error } = getAllStaffSchema.validate(req.query, { abortEarly: false });
    if (error) return handleJoiError(error, next);
    next();
};