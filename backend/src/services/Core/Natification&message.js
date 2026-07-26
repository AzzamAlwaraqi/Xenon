exports.addNotificationCore = async function (userId,bookingId) {
    try {
        
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message || "Internal Server Error", 500);
    }
    
}
exports.messageforComplaint = async function (bookingId){
    
}