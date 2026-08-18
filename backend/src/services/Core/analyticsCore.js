const mongoose = require("mongoose");
const User = require("../../Models/UserModel");
const Booking = require("../../Models/BookingModel"); 
const Report = require("../../Models/ReportsModels");
const Complaint = require("../../Models/ComplaintModel");
const Package = require("../../Models/PackageModel");
const AppError = require("../../utils/AppError");

// ==========================================
// 🛠️ HELPER: Date Filter Builder (DRY Principle)
// ==========================================
const buildDateFilter = (startDate, endDate) => {
    const dateQuery = {};
    if (startDate && endDate) {
        dateQuery.createdAt = { 
            $gte: new Date(startDate), 
            $lte: new Date(endDate) 
        };
    }
    return dateQuery;
};

// ==========================================
// 🧱 INDIVIDUAL FUNCTIONS: ADMIN ANALYTICS
// ==========================================

const getTrafficVolume = async (startDate, endDate) => {
    const matchStage = buildDateFilter(startDate, endDate);
    return await Booking.countDocuments(matchStage);
};

const getDemographics = async (startDate, endDate) => {
    const matchStage = buildDateFilter(startDate, endDate);
    return await User.aggregate([
        { $match: matchStage },
        { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);
};

const getModerationEfficiency = async (startDate, endDate) => {
    const matchStage = buildDateFilter(startDate, endDate);
    const stats = await Report.aggregate([
        { $match: matchStage },
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    return {
        total_reports: stats.reduce((acc, curr) => acc + curr.count, 0),
        breakdown: stats
    };
};

const getActiveDestinations = async (startDate, endDate) => {
    const matchStage = buildDateFilter(startDate, endDate);
    return await Booking.aggregate([
        { $match: matchStage },
        { $group: { _id: "$package_id", totalBookings: { $sum: 1 } } },
        { $sort: { totalBookings: -1 } },
        { $limit: 5 },
        { $lookup: { 
            from: 'packages', 
            localField: '_id', 
            foreignField: '_id', 
            as: 'package_info' 
        }},
        { $unwind: { path: "$package_info", preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, total_bookings: "$totalBookings", package_name: "$package_info.name" } }
    ]);
};

// ==========================================
// 🧱 INDIVIDUAL FUNCTIONS: VENDOR ANALYTICS
// ==========================================

const getVendorBookingsStatus = async (vendorObjectId, startDate, endDate) => {
    const matchStage = { 
        vendor_id: vendorObjectId,
        ...buildDateFilter(startDate, endDate) 
    };
    return await Booking.aggregate([
        { $match: matchStage },
        { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
};

const getVendorCapacityLimits = async (vendorObjectId, startDate, endDate) => {
    const matchStage = { 
        vendor_id: vendorObjectId,
        ...buildDateFilter(startDate, endDate)
    };
    return await Package.aggregate([
        { $match: matchStage },
        { $lookup: { 
            from: 'bookings',
            let: { pkgId: '$_id' },
            pipeline: [
                { $match: { 
                    $expr: { $eq: ['$package_id', '$$pkgId'] },
                    status: { $in: ['accepted', 'completed'] }
                }},
                { $group: { _id: null, total_pax: { $sum: '$number_of_people' } } }
            ],
            as: 'booking_data'
        }},
        { $unwind: { path: "$booking_data", preserveNullAndEmptyArrays: true } },
        { $project: {
            package_name: "$name",
            max_capacity: "$capacity",
            booked_seats: { $ifNull: ["$booking_data.total_pax", 0] },
            occupancy_percentage: {
                $cond: [
                    { $gt: ["$capacity", 0] },
                    { $round: [ { $multiply: [ { $divide: [ { $ifNull: ["$booking_data.total_pax", 0] }, "$capacity" ] }, 100 ] }, 1 ] },
                    0
                ]
            }
        }}
    ]);
};

const getVendorQualityScore = async (vendorObjectId, startDate, endDate) => {
    const matchStage = { 
        vendor_id: vendorObjectId,
        ...buildDateFilter(startDate, endDate)
    };
    const [complaintsCount, ratingStats] = await Promise.all([
        Complaint.countDocuments(matchStage),
        Booking.aggregate([
            { $match: { ...matchStage, rating: { $exists: true } } },
            { $group: { _id: null, avg_rating: { $avg: "$rating" } } }
        ])
    ]);
    
    return {
        total_complaints_received: complaintsCount,
        average_rating: ratingStats.length > 0 ? parseFloat(ratingStats[0].avg_rating.toFixed(1)) : 0
    };
};

// ==========================================
// 🎼 ORCHESTRATORS (General Dashboard Functions)
// ==========================================

exports.getAdminDashboard = async function (startDate, endDate) {
    // Run all Admin queries in parallel
    const [traffic, demographics, moderation, destinations] = await Promise.all([
        getTrafficVolume(startDate, endDate),
        getDemographics(startDate, endDate),
        getModerationEfficiency(startDate, endDate),
        getActiveDestinations(startDate, endDate)
    ]);

    return {
        platform_traffic: { total_bookings: traffic },
        demographics_overview: demographics,
        moderation_efficiency: moderation,
        top_destinations: destinations
    };
};

exports.getVendorDashboard = async function (vendorId, startDate, endDate) {
    if (!vendorId) throw new AppError("Vendor ID is required", 400);
    const vendorObjectId = new mongoose.Types.ObjectId(vendorId);

    // Run all Vendor queries in parallel
    const [bookingsStatus, capacity, qualityScore] = await Promise.all([
        getVendorBookingsStatus(vendorObjectId, startDate, endDate),
        getVendorCapacityLimits(vendorObjectId, startDate, endDate),
        getVendorQualityScore(vendorObjectId, startDate, endDate)
    ]);

    return {
        bookings_overview: bookingsStatus,
        capacity_management: capacity,
        quality_score: qualityScore
    };
};

// 🚀 Export Individual Functions for Specific Metric Requests
exports.getVendorBookingsStatus = getVendorBookingsStatus;
exports.getVendorCapacityLimits = getVendorCapacityLimits;
exports.getVendorQualityScore = getVendorQualityScore;
// (You can also export admin functions here if needed)