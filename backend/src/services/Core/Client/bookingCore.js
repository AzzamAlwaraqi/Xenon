const AppError = require("../../../utils/AppError");
exports.getbookingCore = async function(user) {
    try {
        return "getbooking not yet implemented";
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
}
exports.getAllbookingCore = async function(user) {
    try {
        return "getAllbooking not yet implemented";
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
}
exports.updatebookingCore = async function(user) {
    try {
        return "updatebooking not yet implemented";
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
}
exports.deletebookingCore = async function(user) {
    try {
        return "deletebooking not yet implemented";
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
}
exports.createbookingCore = async function(user, reqBody) {
    try {
        if(user.role !== "user"){
            return AppError("You are not authorized to create a booking", 403);
        }
        const { vendorId, bookingDate, bookingTime, numberOfPeople } = reqBody;
        const booking = await Booking.create({ vendorId, userId: user._id, bookingDate, bookingTime, numberOfPeople });
        return booking;
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
}