const AppError = require("../utils/AppError");

const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return AppError.badRequest(message);
};

const handleDuplicateFieldsDB = err => {
    const value = err.keyValue ? Object.values(err.keyValue)[0] : (err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : 'duplicate field');
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return AppError.badRequest(message);
};

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return AppError.badRequest(message);
};
const handleTokenError = () => AppError.unauthorized('Invalid token. Please log in again!');
const handleTokenExpiredError = () => AppError.unauthorized('Your token has expired! Please log in again.');
const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    } 
    // Programming or other unknown error: don't leak error details
    else {
        // 1) Log error
        console.error('ERROR 💥', err);

        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        });
    }
};

exports.Error = (err, req, res, next) => {
    if (err.name === 'MulterError') {
        err.statusCode = 400;
        err.status = 'fail';
        err.isOperational = true;
        if (err.message === 'Field name missing') {
            err.message = 'File upload field name is missing. Please ensure your form-data key name is specified (e.g. package_image).';
        }
    }

    let error = Object.assign(err);
    error.message = err.message;
    error.name = err.name;
    
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleTokenError();
    if (error.name === 'TokenExpiredError') error = handleTokenExpiredError();

    error.statusCode = error.statusCode || err.statusCode || 500;
    error.status = error.status || err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(error, res);
    } else {
        sendErrorProd(error, res);
    }
};