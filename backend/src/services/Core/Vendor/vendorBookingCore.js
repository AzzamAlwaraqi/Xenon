const multer = require("multer");
const sharp = require("sharp");
const AppError = require("../../../utils/AppError");
const Booking = require("../../../Models/BookingModel");
exports.updateBookingStatusCore = async function (vendor) {
    try {
        return "updateBookingStatus not yet implemented";
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
}
exports.getBookingCore = async function (vendor) {
    try {
        return "getBooking not yet implemented";
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
}
exports.createBookingCore = async function (vendor) {
    try {
        return "createBooking not yet implemented";
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
}
exports.deleteBookingCore = async function (vendor) {
    try {
        return "deleteBooking not yet implemented";
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
}
exports.getAllRequestsCore = async function (vendor) {
    try {
        return "getAllRequests not yet implemented";
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
}
exports.cancelRequestCore = async function (vendor) {
    try {
        return "cancelRequest not yet implemented";
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
}