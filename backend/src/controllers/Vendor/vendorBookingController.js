const AppError = require("../../../utils/AppError");
const VendorBookingCore = require("../../services/Core/Vendor/vendorBookingCore");
exports.getAllBookings = async (req, res) => {
    try{
        const bookings = await VendorBookingCore.getAllRequestsCore(req.user.id);
        return res.status(200).json({
            status: "success",
            count: bookings.length,
            data: bookings
        });
    }
    catch(err){
        return res.AppError(err.message, 400);
    }
}

exports.addNotification = async (req, res) => {
    try{
        const notification = await VendorBookingCore.addNotificationCore(req.user.id,req.params.bookingId);
        return res.status(200).json({
            status: "success",
            data: notification
        });
    }
    catch(err){
        return res.AppError(err.message, 400);
    }
}