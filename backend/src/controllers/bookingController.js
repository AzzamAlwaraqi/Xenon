const bookingCore = require("../services/Core/bookingCore");
const AppError = require("../utils/AppError");


exports.getbooking = (req, res) => {
    res.send("getbooking");
};

exports.getAllbookingMe = (req, res) => {
    res.send("getAllbooking");
};

exports.updatebooking = (req, res) => {
    res.send("updatebooking");
};

exports.deletebooking = (req, res) => {
    res.send("deletebooking");
};

exports.createbooking = (req, res) => {
    res.send("createbooking");
};


exports.getAllRequests = async (req, res) => {
    try {
        const bookings = await bookingCore.getAllRequestsCore(req.user.id, req.params.package_id);
        return res.status(200).json(bookings);
    } catch (err) {
        return res.AppError(err.message, 400);
    }
};

exports.addNotification = async (req, res) => {
    try {
        const notification = await bookingCore.addNotificationCore(req.user.id, req.params.bookingId);
        return res.status(200).json({
            status: "success",
            data: notification
        });
    } catch (err) {
        return res.AppError(err.message, 400);
    }
};
