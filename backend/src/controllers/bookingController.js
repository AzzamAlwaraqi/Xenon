const bookingCore = require("../services/Core/bookingCore");
const AppError = require("../utils/AppError");
const bookingValidation = require("../validations/bookingValidation");

exports.createbooking = async (req, res, next) => {
    try {
        const { error, value } = bookingValidation.createBookingValidation(req.body);
        if (error) return next(new AppError(error.details.map(d => d.message).join(", "), 400));
        req.body = value;

        const booking = await bookingCore.createBookingCore(req.user, req.body);
        return res.status(201).json({
            status: "success",
            data: booking
        });
    } catch (err) {
        return next(new AppError(err.message, err.statusCode || 400));
    }
};

exports.getbooking = async (req, res, next) => {
    try {
        const { error, value } = bookingValidation.bookingIdParamValidation(req.params);
        if (error) return next(new AppError(error.details.map(d => d.message).join(", "), 400));
        req.params = value;

        const booking = await bookingCore.getBookingCore(req.user, req.params.id);
        return res.status(200).json(booking);
    } catch (err) {
        return next(new AppError(err.message, err.statusCode || 400));
    }
};

exports.getAllbookingMe = async (req, res, next) => {
    try {
        const bookings = await bookingCore.getAllBookingCore(req.user);
        return res.status(200).json(bookings);
    } catch (err) {
        return next(new AppError(err.message, err.statusCode || 400));
    }
};

exports.getMyBookings = async (req, res, next) => {
    try {
        const activeBookings = await bookingCore.getAllMyBookingsCore(req.user);
        return res.status(200).json(activeBookings);
    } catch (err) {
        return next(new AppError(err.message, err.statusCode || 400));
    }
};

exports.getUserHistory = async (req, res, next) => {
    try {
        const history = await bookingCore.getBookingHistoryCore(req.user);
        return res.status(200).json(history);
    } catch (err) {
        return next(new AppError(err.message, err.statusCode || 400));
    }
};

exports.updatebooking = async (req, res, next) => {
    try {
        const { error: paramsError, value: paramsValue } = bookingValidation.bookingIdParamValidation(req.params);
        if (paramsError) return next(new AppError(paramsError.details.map(d => d.message).join(", "), 400));
        req.params = paramsValue;

        const { error, value } = bookingValidation.updateBookingValidation(req.body);
        if (error) return next(new AppError(error.details.map(d => d.message).join(", "), 400));
        req.body = value;

        const updatedBooking = await bookingCore.updateBookingCore(req.user, req.params.id, req.body);
        return res.status(200).json(updatedBooking);
    } catch (err) {
        return next(new AppError(err.message, err.statusCode || 400));
    }
};

exports.deletebooking = async (req, res, next) => {
    try {
        const { error, value } = bookingValidation.bookingIdParamValidation(req.params);
        if (error) return next(new AppError(error.details.map(d => d.message).join(", "), 400));
        req.params = value;

        const result = await bookingCore.deleteBookingCore(req.user, req.params.id);
        return res.status(200).json(result);
    } catch (err) {
        return next(new AppError(err.message, err.statusCode || 400));
    }
};

exports.getAllRequests = async (req, res, next) => {
    try {
        const { error, value } = bookingValidation.getAllRequestsQueryValidation(req.query);
        if (error) return next(new AppError(error.details.map(d => d.message).join(", "), 400));
        req.query = value;

        const requests = await bookingCore.getAllRequestsCore(req.user, req.query.package_id);
        return res.status(200).json(requests);
    } catch (err) {
        return next(new AppError(err.message, err.statusCode || 400));
    }
};

exports.updateBookingStatus = async (req, res, next) => {
    try {
        const { error: paramsError, value: paramsValue } = bookingValidation.bookingIdParamValidation(req.params);
        if (paramsError) return next(new AppError(paramsError.details.map(d => d.message).join(", "), 400));
        req.params = paramsValue;

        const { error, value } = bookingValidation.updateBookingStatusValidation(req.body);
        if (error) return next(new AppError(error.details.map(d => d.message).join(", "), 400));
        req.body = value;

        const result = await bookingCore.updateStatusCore(req.user, req.params.id, req.body.status);
        return res.status(200).json(result);
    } catch (err) {
        return next(new AppError(err.message, err.statusCode || 400));
    }
};

exports.getUserPendingRequests = async (req, res, next) => {
    try {
        const requests = await bookingCore.getUserPendingRequestsCore(req.user);
        return res.status(200).json(requests);
    } catch (err) {
        return next(new AppError(err.message, err.statusCode || 400));
    }
};

exports.getPendingRequestsCount = async (req, res, next) => {
    try {
        const countData = await bookingCore.getPendingRequestsCountCore(req.user);
        return res.status(200).json(countData);
    } catch (err) {
        return next(new AppError(err.message, err.statusCode || 400));
    }
};
