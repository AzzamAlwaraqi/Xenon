const AppError = require("../../utils/AppError");


exports.getAllReviewsCore = async function (user) {
    try {
        return "getMyReviews not yet implemented";
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
};


exports.getAllBookingHistoryCore = async function (user) {
    try {
        return "getAllBookingHistory not yet implemented";
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
};

exports.getAllNotificationsCore = async function (user) {
    try {
        return "getAllNotifications not yet implemented";
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
};  
