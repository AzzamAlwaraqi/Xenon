const AppError = require("../utils/AppError");

exports.validate = (validationFunction) => {
    return (req, res, next) => {
        const { error, value } = validationFunction(req.body);
        if (error) {
            return next(new AppError(error.details.map(d => d.message).join(", "), 400));
        }
        req.body = value; // update req.body with sanitized/casted values
        next();
    };
};

exports.validateRoleBased = (userValidationFunc, vendorValidationFunc) => {
    return (req, res, next) => {
        const role = req.body.role === "vendor" ? "vendor" : "user";
        const validationFunction = role === "vendor" ? vendorValidationFunc : userValidationFunc;
        
        const { error, value } = validationFunction(req.body);
        if (error) {
            return next(new AppError(error.details.map(d => d.message).join(", "), 400));
        }
        req.body = value;
        next();
    };
};

exports.validateProfileUpdate = (userValidationFunc, vendorValidationFunc) => {
    return (req, res, next) => {
        const role = req.user && req.user.role === "vendor" ? "vendor" : "user";
        const validationFunction = role === "vendor" ? vendorValidationFunc : userValidationFunc;
        
        const { error, value } = validationFunction(req.body);
        if (error) {
            return next(new AppError(error.details.map(d => d.message).join(", "), 400));
        }
        req.body = value;
        next();
    };
};
