const AppError = require("../../../utils/AppError");
const BookingModel = require('../../../Models/BookingModel');
const PackageModel = require('../../../Models/PackageModel');
const mongoose = require('mongoose');

exports.getAllRequestsCore = async function (vendorId, packageId) {
    try {
        const query = {
            vendor_id: vendorId,
            status: 'pending'
        };
        if (packageId) {
            query.package_id = packageId;
        }

        const requests = await BookingModel.find(query).populate({
            path: 'package_id',
            select: 'title price location max_people'
        }).populate({
            path: 'user_id',
            select: 'name email phone'
        }).sort({ createdAt: -1 });

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

