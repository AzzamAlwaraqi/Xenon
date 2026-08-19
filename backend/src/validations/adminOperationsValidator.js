const Joi = require('joi');
const AppError = require('../utils/AppError');

const validate = (schema) => (req, res, next) => {
    const dataToValidate = { ...req.params, ...req.body, ...req.query };
    
    const { error } = schema.validate(dataToValidate, { abortEarly: false, stripUnknown: true });
    
    if (error) {
        const errorMessages = error.details.map(detail => detail.message).join(' | ');
        return next(new AppError(`Validation Error: ${errorMessages}`, 400));
    }
    
    next();
};

const updateVendorStatusSchema = Joi.object({
    vendorId: Joi.string().guid().required().messages({
        'string.guid': 'Invalid Vendor ID format. Must be a valid UUID.',
        'any.required': 'Vendor ID is required in the URL.'
    }),
    
    status: Joi.string().valid('approved', 'rejected', 'suspended', 'pending_deletion').required().messages({
        'any.only': 'Invalid status. Must be one of: approved, rejected, suspended, pending_deletion.',
        'any.required': 'Status is required.'
    }),
    
    rejectionReason: Joi.string().when('status', {
        is: 'rejected',
        then: Joi.string().min(10).required().messages({
            'any.required': 'Rejection reason is strictly required when rejecting a vendor.',
            'string.min': 'Rejection reason must be at least 10 characters long.'
        }),
        otherwise: Joi.optional().allow('', null)
    })
});

const getVendorDetailsSchema = Joi.object({
    vendorId: Joi.string().guid().required().messages({
        'string.guid': 'Invalid Vendor ID format.',
        'any.required': 'Vendor ID is required.'
    })
});


const getAllReportsSchema = Joi.object({
    status: Joi.string().valid('pending', 'resolved', 'dismissed', 'escalated', 'closed').optional().messages({
        'any.only': 'Invalid status query parameter.'
    }),
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional()
});

const resolveReportSchema = Joi.object({
    reportId: Joi.string().guid().required().messages({
        'string.guid': 'Invalid Report ID format. Must be a valid UUID.',
        'any.required': 'Report ID is required.'
    }),
    
    action: Joi.string().valid('dismiss', 'warn_user', 'suspend_user', 'delete_content').required().messages({
        'any.only': 'Invalid action type. Must be one of: dismiss, warn_user, suspend_user, delete_content.',
        'any.required': 'Action is required.'
    }),
    
    adminNotes: Joi.string().when('action', {
        is: Joi.valid('suspend_user', 'delete_content'),
        then: Joi.string().min(10).required().messages({
            'any.required': 'Admin notes are strictly required when suspending a user or deleting content.',
            'string.min': 'Admin notes must be at least 10 characters explaining the action taken.'
        }),
        otherwise: Joi.optional().allow('', null)
    })
});

const getUserHistorySchema = Joi.object({
    userId: Joi.string().guid().required().messages({
        'string.guid': 'Invalid User ID format.',
        'any.required': 'User ID is required.'
    })
});


const escalateReportSchema = Joi.object({
    reportId: Joi.string().guid().required().messages({
        'string.guid': 'Invalid Report ID format.',
        'any.required': 'Report ID is required.'
    }),
    
    escalationNotes: Joi.string().min(10).required().messages({
        'any.required': 'Escalation notes are required.',
        'string.min': 'Please provide detailed escalation notes (at least 10 characters).'
    })
});


module.exports = {
    updateVendorStatusValidator: validate(updateVendorStatusSchema),
    getVendorDetailsValidator: validate(getVendorDetailsSchema),
    
    getAllReportsValidator: validate(getAllReportsSchema),
    resolveReportValidator: validate(resolveReportSchema),
    getUserHistoryValidator: validate(getUserHistorySchema),
    escalateReportValidator: validate(escalateReportSchema)
};