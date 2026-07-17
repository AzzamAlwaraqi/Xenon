const joi = require("joi");

exports.createPackageValidate = (req, res) => {
    const schema = joi.object({
        package_name: joi.string().max(100).required(),
        package_price: joi.number().min(0).required(),
        package_description: joi.string().max(1000).required(),
        startDate: joi.date().min('now').required(),
        endDate: joi.date().min('now').greater(joi.ref('startDate')).required(),
        package_type: joi.string().valid('flight', 'hotel', 'package').required(),
        package_status: joi.string().valid('active', 'inactive').required()
    });

    const { error } = schema.validate(req.body);

    if (error) {
        res.status(400).json({
            status: "fail",
            message: error.details[0].message
        });
        return false;
    }

    if (!req.file) {
        res.status(400).json({
            status: "fail",
            message: "package_image is required"
        });
        return false;
    }

    if (req.file.size > 1024 * 1024 * 5) {
        res.status(400).json({
            status: "fail",
            message: "package_image size must be less than 5MB"
        });
        return false;
    }

    if (req.file.mimetype !== "image/jpeg" && req.file.mimetype !== "image/png") {
        res.status(400).json({
            status: "fail",
            message: "package_image must be jpeg or png"
        });
        return false;
    }

    return true;
}

exports.updatePackageValidate = (req, res) => {
    const schema = joi.object({
        package_name: joi.string().max(100),
        package_price: joi.number().min(0),
        package_description: joi.string().max(1000),
        startDate: joi.date().min('now'),
        endDate: joi.date().min('now').greater(joi.ref('startDate')),
        package_type: joi.string().valid('flight', 'hotel', 'package'),
        package_status: joi.string().valid('active', 'inactive')
    });

    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400).json({
            status: "fail",
            message: error.details[0].message
        });
        return false;
    }
    
    if (req.file) {
        if (req.file.size > 1024 * 1024 * 5) {
            res.status(400).json({
                status: "fail",
                message: "package_image size must be less than 5MB"
            });
            return false;
        }
        if (req.file.mimetype !== "image/jpeg" && req.file.mimetype !== "image/png") {
            res.status(400).json({
                status: "fail",
                message: "package_image must be jpeg or png"
            });
            return false;
        }
    }

    return true;
}

exports.deletePackageValidate = (req, res) => {
    const schema = joi.object({
        package_id: joi.string().required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400).json({
            status: "fail",
            message: error.details[0].message
        });
        return false;
    }

    return true;
}