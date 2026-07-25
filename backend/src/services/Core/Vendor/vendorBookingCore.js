const AppError = require("../../../utils/AppError");
const BookingModel = require('../../../Models/BookingModel');
const PackageModel = require('../../../Models/PackageModel');
const mongoose = require('mongoose');

exports.getAllRequestsCore = async function (vendorId) {
    try {
        const requests = await BookingModel.find({ 
            vendor_id: vendorId, 
            status: 'pending' 
        })
        .populate({
            path: 'package_id',
            select: 'title price location max_people' 
        })
        .populate({
            path: 'user_id',
            select: 'name email phone' 
        })
        .sort({ createdAt: -1 }); 

        return {
            status: "success",
            count: requests.length,
            data: requests
        };

    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message || "Internal Server Error", 500);
    }
};

exports.addNotificationCore = async function (userId,bookingId) {
    try {
        
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message || "Internal Server Error", 500);
    }
    
}
exports.messageforComplaint = async function (bookingId){
    
}