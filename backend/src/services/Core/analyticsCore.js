const mongoose = require("mongoose");
const User = require("../../Models/UserModel");
const Booking = require("../../Models/BookingModel"); 
const Report = require("../../Models/ReportsModels");
const Complaint = require("../../Models/ComplaintModel");
const Package = require("../../Models/PackageModel");
const Review = require("../../Models/ReviewModel"); 
const AppError = require("../../utils/AppError");


const buildDateFilter = (startDate, endDate) => {
    const dateQuery = {};
    if (startDate || endDate) {
        dateQuery.createdAt = {};
        if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
        if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }
    return dateQuery;
};


const getTrafficVolume = async (startDate, endDate) => {
    const matchStage = buildDateFilter(startDate, endDate);
    return await Booking.countDocuments(matchStage);
};

const getDemographics = async (startDate, endDate) => {
    const matchStage = buildDateFilter(startDate, endDate);
    return await User.aggregate([
        { $match: matchStage },
        { $group: { _id: "$role", count: { $sum: 1 } } },
        { $project: { role: "$_id", count: 1, _id: 0 } }
    ]);
};

const getModerationEfficiency = async (startDate, endDate) => {
    const matchStage = buildDateFilter(startDate, endDate);
    const stats = await Report.aggregate([
        { $match: matchStage },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { status: "$_id", count: 1, _id: 0 } }
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
        { $project: { package_id: "$_id", total_bookings: "$totalBookings", package_name: "$package_info.package_name", _id: 0 } }
    ]);
};

const getAdminRevenue = async (startDate, endDate) => {
    const matchStage = {
        status: { $in: ['completed', 'accepted'] },
        ...buildDateFilter(startDate, endDate)
    };
    const revenue = await Booking.aggregate([
        { $match: matchStage },
        { $group: { _id: null, total_revenue: { $sum: "$total_price" } } } 
    ]);
    return revenue.length > 0 ? revenue[0].total_revenue : 0;
};



const getVendorBookingsStatus = async (vendorId, startDate, endDate) => {
    const matchStage = { 
        vendor_id: vendorId, 
        ...buildDateFilter(startDate, endDate) 
    };
    return await Booking.aggregate([
        { $match: matchStage },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { status: "$_id", count: 1, _id: 0 } }
    ]);
};

const getVendorCapacityLimits = async (vendorId, startDate, endDate) => {
    const matchStage = { 
        vendor_id: vendorId, 
        isDeleted: { $ne: true },
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
            _id: 0,
            package_name: "$package_name",
            max_capacity: "$max_people", 
            booked_seats: { $ifNull: ["$booking_data.total_pax", 0] },
            occupancy_percentage: {
                $cond: [
                    { $gt: ["$max_people", 0] },
                    { $round: [ { $multiply: [ { $divide: [ { $ifNull: ["$booking_data.total_pax", 0] }, "$max_people" ] }, 100 ] }, 1 ] },
                    0
                ]
            }
        }}
    ]);
};

const getVendorQualityScore = async (vendorId, startDate, endDate) => {
    const matchStage = { 
        vendor_id: vendorId,
        ...buildDateFilter(startDate, endDate)
    };
    
    const [complaintsCount, ratingStats] = await Promise.all([
        Complaint.countDocuments(matchStage),
        Review.aggregate([
            { $match: { vendor_id: vendorId, review_status: "accepted", ...buildDateFilter(startDate, endDate) } },
            { $group: { _id: null, avg_rating: { $avg: "$review_rating" } } }
        ])
    ]);
    
    return {
        total_complaints_received: complaintsCount,
        average_rating: ratingStats.length > 0 ? parseFloat(ratingStats[0].avg_rating.toFixed(1)) : 0
    };
};

const getVendorRevenue = async (vendorId, startDate, endDate) => {
    const matchStage = {
        vendor_id: vendorId,
        status: { $in: ['completed', 'accepted'] },
        ...buildDateFilter(startDate, endDate)
    };
    const revenue = await Booking.aggregate([
        { $match: matchStage },
        { $group: { _id: null, total_revenue: { $sum: "$total_price" } } }
    ]);
    return revenue.length > 0 ? revenue[0].total_revenue : 0;
};


exports.getAdminDashboardCore = async function (startDate, endDate) { 
    const [traffic, demographics, moderation, destinations, revenue] = await Promise.all([
        getTrafficVolume(startDate, endDate),
        getDemographics(startDate, endDate),
        getModerationEfficiency(startDate, endDate),
        getActiveDestinations(startDate, endDate),
        getAdminRevenue(startDate, endDate) // 🌟
    ]);

    return {
        financials: { total_revenue: revenue },
        platform_traffic: { total_bookings: traffic },
        demographics_overview: demographics,
        moderation_efficiency: moderation,
        top_destinations: destinations
    };
};

exports.getVendorDashboardCore = async function (vendorId, startDate, endDate) {
    if (!vendorId) throw new AppError("Vendor ID is required", 400);
    
    const [bookingsStatus, capacity, qualityScore, revenue] = await Promise.all([
        getVendorBookingsStatus(vendorId, startDate, endDate),
        getVendorCapacityLimits(vendorId, startDate, endDate),
        getVendorQualityScore(vendorId, startDate, endDate),
        getVendorRevenue(vendorId, startDate, endDate) // 🌟
    ]);

    return {
        financials: { total_revenue: revenue },
        bookings_overview: bookingsStatus,
        capacity_management: capacity,
        quality_score: qualityScore
    };
};

exports.getVendorBookingsStatus = getVendorBookingsStatus;
exports.getVendorCapacityLimits = getVendorCapacityLimits;
exports.getVendorQualityScore = getVendorQualityScore;