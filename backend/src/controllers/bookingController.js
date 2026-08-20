const bookingCore = require("../services/Core/bookingCore");

exports.createbooking = async (req, res, next) => {
    try {
        const booking = await bookingCore.createBookingCore(req.user, req.body);
        return res.status(201).json({
            status: "success",
            data: booking
        });
    } catch (error) {
        next(error);
    }
};

exports.getbooking = async (req, res, next) => {
    try {
        const booking = await bookingCore.getBookingCore(req.user, req.params.id);
        return res.status(200).json(booking);
    } catch (error) {
        next(error);
    }
};

exports.getAllbookingMe = async (req, res, next) => {
    try {
        const bookings = await bookingCore.getAllBookingCore(req.user);
        return res.status(200).json(bookings);
    } catch (error) {
        next(error);
    }
};

exports.getMyBookings = async (req, res, next) => {
    try {
        const activeBookings = await bookingCore.getAllMyBookingsCore(req.user);
        return res.status(200).json(activeBookings);
    } catch (error) {
        next(error);
    }
};

exports.getUserHistory = async (req, res, next) => {
    try {
        const history = await bookingCore.getBookingHistoryCore(req.user);
        return res.status(200).json(history);
    } catch (error) {
        next(error);
    }
};

exports.updatebooking = async (req, res, next) => {
    try {
        const updatedBooking = await bookingCore.updateBookingCore(req.user, req.params.id, req.body);
        return res.status(200).json(updatedBooking);
    } catch (error) {
        next(error);
    }
};

exports.deletebooking = async (req, res, next) => {
    try {
        const result = await bookingCore.deleteBookingCore(req.user, req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getAllRequests = async (req, res, next) => {
    try {
        const packageId = req.params.package_id || req.query.package_id;
        const requests = await bookingCore.getAllRequestsCore(req.user, packageId);
        return res.status(200).json(requests);
    } catch (error) {
        next(error);
    }
};

exports.updateBookingStatus = async (req, res, next) => {
    try {
        const result = await bookingCore.updateStatusCore(req.user, req.params.id, req.body.status);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getUserPendingRequests = async (req, res, next) => {
    try {
        const requests = await bookingCore.getUserPendingRequestsCore(req.user);
        return res.status(200).json(requests);
    } catch (error) {
        next(error);
    }
};

exports.getPendingRequestsCount = async (req, res, next) => {
    try {
        const countData = await bookingCore.getPendingRequestsCountCore(req.user);
        return res.status(200).json(countData);
    } catch (error) {
        next(error);
    }
};
