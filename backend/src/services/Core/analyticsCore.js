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
    return await Booking.countDocuments(buildDateFilter(startDate, endDate));
};

const getDemographics = async (startDate, endDate) => {
    return await User.aggregate([
        { $match: buildDateFilter(startDate, endDate) },
        { $group: { _id: "$role", count: { $sum: 1 } } },
        { $project: { role: "$_id", count: 1, _id: 0 } }
    ]);
};

const getModerationEfficiency = async (startDate, endDate) => {
    const stats = await Report.aggregate([
        { $match: buildDateFilter(startDate, endDate) },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { status: "$_id", count: 1, _id: 0 } }
    ]);
    return {
        total_reports: stats.reduce((acc, curr) => acc + curr.count, 0),
        breakdown: stats
    };
};

const getActiveDestinations = async (startDate, endDate) => {
    return await Booking.aggregate([
        { $match: buildDateFilter(startDate, endDate) },
        { $group: { _id: "$package_id", totalBookings: { $sum: 1 } } },
        { $sort: { totalBookings: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'packages', localField: '_id', foreignField: '_id', as: 'package_info' }},
        { $unwind: { path: "$package_info", preserveNullAndEmptyArrays: true } },
        { $project: { package_id: "$_id", total_bookings: "$totalBookings", package_name: "$package_info.title", _id: 0 } }
    ]);
};

const getAdminActualRevenueCore = async (startDate, endDate) => {
    const COMMISSION_RATE = 0.10; 
    const revenueStats = await Booking.aggregate([
        { 
            $match: { 
                status: { $in: ["completed", "accepted"] },
                payment_status: "paid",
                ...buildDateFilter(startDate, endDate)
            } 
        },
        { $group: { _id: null, totalPlatformSales: { $sum: "$total_price" }, totalSuccessfulBookings: { $sum: 1 } } },
        { $project: { _id: 0, totalSuccessfulBookings: 1, totalPlatformSales: 1, adminActualRevenue: { $multiply: ["$totalPlatformSales", COMMISSION_RATE] } } }
    ]);
    return revenueStats.length > 0 ? revenueStats[0] : { totalSuccessfulBookings: 0, totalPlatformSales: 0, adminActualRevenue: 0 };
};

const getAdminRevenue = async (startDate, endDate) => {
    const matchStage = { status: { $in: ['completed', 'accepted'] }, ...buildDateFilter(startDate, endDate) };
    const revenue = await Booking.aggregate([
        { $match: matchStage },
        { $group: { _id: null, total_revenue: { $sum: "$total_price" } } } 
    ]);
    return revenue.length > 0 ? revenue[0].total_revenue : 0;
};

const getVendorBookingsStatus = async (vendorId, startDate, endDate) => {
    return await Booking.aggregate([
        { $match: { vendor_id: vendorId, ...buildDateFilter(startDate, endDate) } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { status: "$_id", count: 1, _id: 0 } }
    ]);
};

const getVendorCapacityLimits = async (vendorId, startDate, endDate) => {
    return await Package.aggregate([
        { $match: { vendor_id: vendorId, isDeleted: { $ne: true }, ...buildDateFilter(startDate, endDate) } },
        { $lookup: { 
            from: 'bookings', let: { pkgId: '$_id' },
            pipeline: [
                { $match: { $expr: { $eq: ['$package_id', '$$pkgId'] }, status: { $in: ['accepted', 'completed'] } } },
                { $group: { _id: null, total_pax: { $sum: '$number_of_people' } } } 
            ], as: 'booking_data'
        }},
        { $unwind: { path: "$booking_data", preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, package_name: "$title", max_capacity: "$max_people", booked_seats: { $ifNull: ["$booking_data.total_pax", 0] },
            occupancy_percentage: {
                $cond: [ { $gt: ["$max_people", 0] }, { $round: [ { $multiply: [ { $divide: [ { $ifNull: ["$booking_data.total_pax", 0] }, "$max_people" ] }, 100 ] }, 1 ] }, 0 ]
            }
        }}
    ]);
};

const getVendorQualityScore = async (vendorId, startDate, endDate) => {
    const matchStage = { vendor_id: vendorId, ...buildDateFilter(startDate, endDate) };
    const [complaintsCount, ratingStats] = await Promise.all([
        Complaint.countDocuments(matchStage),
        Review.aggregate([
            { $match: { vendor_id: vendorId, review_status: "accepted", ...buildDateFilter(startDate, endDate) } },
            { $group: { _id: null, avg_rating: { $avg: "$review_rating" } } }
        ])
    ]);
    return { total_complaints_received: complaintsCount, average_rating: ratingStats.length > 0 ? parseFloat(ratingStats[0].avg_rating.toFixed(1)) : 0 };
};

const getVendorFinancialBreakdownCore = async (vendorId, startDate, endDate) => {
    const breakdown = await Booking.aggregate([
        { $match: { vendor_id: vendorId, ...buildDateFilter(startDate, endDate) } },
        { $group: { _id: "$status", count: { $sum: 1 }, totalAmount: { $sum: "$total_price" } } }
    ]);

    let financialSummary = { earned_revenue: 0, pending_revenue: 0, lost_revenue: 0, total_bookings: 0 };
    breakdown.forEach(item => {
        financialSummary.total_bookings += item.count;
        if (item._id === 'completed' || item._id === 'accepted') financialSummary.earned_revenue += item.totalAmount;
        else if (item._id === 'pending') financialSummary.pending_revenue += item.totalAmount;
        else if (item._id === 'cancelled' || item._id === 'rejected') financialSummary.lost_revenue += item.totalAmount;
    });
    return financialSummary;
};

const getVendorRevenue = async (vendorId, startDate, endDate) => {
    const matchStage = { vendor_id: vendorId, status: { $in: ['completed', 'accepted'] }, ...buildDateFilter(startDate, endDate) };
    const revenue = await Booking.aggregate([
        { $match: matchStage },
        { $group: { _id: null, total_revenue: { $sum: "$total_price" } } }
    ]);
    return revenue.length > 0 ? revenue[0].total_revenue : 0;
};

const getRevenueTrendsCore = async (vendorId = null, year = new Date().getFullYear()) => {
    let matchQuery = { 
        status: { $in: ["completed", "accepted"] },
        payment_status: "paid",
        createdAt: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) }
    };
    if (vendorId) matchQuery.vendor_id = vendorId;

    const trends = await Booking.aggregate([
        { $match: matchQuery },
        { $group: { _id: { $month: "$createdAt" }, monthlyRevenue: { $sum: "$total_price" }, bookingsCount: { $sum: 1 } } },
        { $sort: { "_id": 1 } }
    ]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.map((month, index) => {
        const found = trends.find(t => t._id === index + 1);
        return { month: month, revenue: found ? found.monthlyRevenue : 0, bookings: found ? found.bookingsCount : 0 };
    });
};

const getCustomerRetentionCore = async (vendorId) => {
    const userBookingsCount = await Booking.aggregate([
        { $match: { vendor_id: vendorId, status: { $in: ["completed", "accepted"] } } },
        { $group: { _id: "$user_id", totalBookings: { $sum: 1 } } }
    ]);

    let analytics = { total_unique_customers: userBookingsCount.length, one_time_customers: 0, repeat_customers: 0, retention_rate: 0 };
    userBookingsCount.forEach(user => {
        if (user.totalBookings === 1) analytics.one_time_customers++;
        else analytics.repeat_customers++;
    });

    if (analytics.total_unique_customers > 0) {
        analytics.retention_rate = parseFloat(((analytics.repeat_customers / analytics.total_unique_customers) * 100).toFixed(2));
    }
    return analytics;
};

const getVendorsLeaderboardCore = async () => {
    return await Booking.aggregate([
        { $match: { status: { $in: ["completed", "accepted", "cancelled"] } } },
        { $group: {
            _id: "$vendor_id",
            totalRevenue: { $sum: { $cond: [{ $in: ["$status", ["completed", "accepted"]] }, "$total_price", 0] } },
            successfulBookings: { $sum: { $cond: [{ $in: ["$status", ["completed", "accepted"]] }, 1, 0] } },
            cancelledBookings: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } }
        }},
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'vendor_info' } },
        { $unwind: { path: "$vendor_info", preserveNullAndEmptyArrays: true } },
        { $project: { vendor_id: "$_id", vendor_name: "$vendor_info.name", totalRevenue: 1, successfulBookings: 1, cancelledBookings: 1, _id: 0 } }
    ]);
};

const getPaymentMethodsShareCore = async (vendorId = null, startDate, endDate) => {
    let matchQuery = { payment_status: "paid", ...buildDateFilter(startDate, endDate) };
    if (vendorId) matchQuery.vendor_id = vendorId;

    const paymentShare = await Booking.aggregate([
        { $match: matchQuery },
        { $group: { _id: "$payment_method", totalAmount: { $sum: "$total_price" }, usageCount: { $sum: 1 } } },
        { $project: { method: "$_id", totalAmount: 1, usageCount: 1, _id: 0 } },
        { $sort: { usageCount: -1 } }
    ]);

    const totalTransactions = paymentShare.reduce((acc, curr) => acc + curr.usageCount, 0);
    return paymentShare.map(item => ({
        ...item,
        percentage: totalTransactions === 0 ? 0 : parseFloat(((item.usageCount / totalTransactions) * 100).toFixed(2))
    }));
};

const getPackageFinancialAnalysisCore = async (packageId, startDate, endDate) => {
    const packageStats = await Booking.aggregate([
        { $match: { package_id: packageId, ...buildDateFilter(startDate, endDate) } },
        { $group: { _id: "$status", bookingsCount: { $sum: 1 }, totalMoney: { $sum: "$total_price" } } }
    ]);

    let analysis = { package_id: packageId, success_rate: 0, total_earned: 0, total_lost_to_cancellations: 0, total_requests: 0, active_pending: 0 };
    let successfulBookings = 0;

    packageStats.forEach(stat => {
        analysis.total_requests += stat.bookingsCount;
        if (stat._id === 'completed' || stat._id === 'accepted') {
            analysis.total_earned += stat.totalMoney;
            successfulBookings += stat.bookingsCount;
        } else if (stat._id === 'cancelled' || stat._id === 'rejected') {
            analysis.total_lost_to_cancellations += stat.totalMoney;
        } else if (stat._id === 'pending') {
            analysis.active_pending += stat.totalMoney;
        }
    });

    if (analysis.total_requests > 0) analysis.success_rate = parseFloat(((successfulBookings / analysis.total_requests) * 100).toFixed(2));
    return analysis;
};

exports.getAdminDashboardCore = async function (startDate, endDate) { 
    const [traffic, demographics, moderation, destinations, grossRevenue, actualRevenue, paymentShare, leaderboard, revenueTrends] = await Promise.all([
        getTrafficVolume(startDate, endDate),
        getDemographics(startDate, endDate),
        getModerationEfficiency(startDate, endDate),
        getActiveDestinations(startDate, endDate),
        getAdminRevenue(startDate, endDate),
        getAdminActualRevenueCore(startDate, endDate),
        getPaymentMethodsShareCore(null, startDate, endDate),
        getVendorsLeaderboardCore(),
        getRevenueTrendsCore(null)   
    ]);

    return {
        financials: { gross_revenue: grossRevenue, net_profit_summary: actualRevenue, payment_methods: paymentShare },
        platform_performance: { top_destinations: destinations, vendors_leaderboard: leaderboard, revenue_trends_this_year: revenueTrends },
        platform_traffic: { total_bookings: traffic },
        demographics_overview: demographics,
        moderation_efficiency: moderation
    };
};

exports.getVendorDashboardCore = async function (vendorId, startDate, endDate) {
    if (!vendorId) throw new AppError("Vendor ID is required", 400);
    
    const [bookingsStatus, capacity, qualityScore, grossRevenue, financialBreakdown, paymentShare, customerRetention, revenueTrends] = await Promise.all([
        getVendorBookingsStatus(vendorId, startDate, endDate),
        getVendorCapacityLimits(vendorId, startDate, endDate),
        getVendorQualityScore(vendorId, startDate, endDate),
        getVendorRevenue(vendorId, startDate, endDate),
        getVendorFinancialBreakdownCore(vendorId, startDate, endDate),
        getPaymentMethodsShareCore(vendorId, startDate, endDate),
        getCustomerRetentionCore(vendorId),    
        getRevenueTrendsCore(vendorId)         
    ]);

    return {
        financials: { total_revenue: grossRevenue, breakdown: financialBreakdown, payment_methods: paymentShare, revenue_trends_this_year: revenueTrends },
        customer_insights: { retention_metrics: customerRetention },
        bookings_overview: bookingsStatus,
        capacity_management: capacity,
        quality_score: qualityScore
    };
};

exports.getTrafficVolume = getTrafficVolume;
exports.getDemographics = getDemographics;
exports.getModerationEfficiency = getModerationEfficiency;
exports.getActiveDestinations = getActiveDestinations;
exports.getAdminRevenue = getAdminRevenue;
exports.getAdminActualRevenueCore = getAdminActualRevenueCore;

exports.getVendorBookingsStatus = getVendorBookingsStatus;
exports.getVendorCapacityLimits = getVendorCapacityLimits;
exports.getVendorQualityScore = getVendorQualityScore;
exports.getVendorRevenue = getVendorRevenue;
exports.getVendorFinancialBreakdownCore = getVendorFinancialBreakdownCore;

exports.getRevenueTrendsCore = getRevenueTrendsCore;
exports.getCustomerRetentionCore = getCustomerRetentionCore;
exports.getVendorsLeaderboardCore = getVendorsLeaderboardCore;

exports.getPackageFinancialAnalysisCore = getPackageFinancialAnalysisCore;
exports.getPaymentMethodsShareCore = getPaymentMethodsShareCore;