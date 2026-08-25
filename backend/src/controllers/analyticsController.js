const analyticsCore = require('../services/Core/analyticsCore');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

exports.getAdminAnalytics = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return next(new AppError('Access denied. Admin privileges required.', 403));
        }

        const { metric, startDate, endDate } = req.query;
        let analyticsData;

        switch (metric) {
            case 'traffic':
                analyticsData = await analyticsCore.getTrafficVolume(startDate, endDate);
                break;
            case 'demographics':
                analyticsData = await analyticsCore.getDemographics(startDate, endDate);
                break;
            case 'moderation':
                analyticsData = await analyticsCore.getModerationEfficiency(startDate, endDate);
                break;
            case 'destinations':
                analyticsData = await analyticsCore.getActiveDestinations(startDate, endDate);
                break;
            case 'revenue_gross':
                analyticsData = await analyticsCore.getAdminRevenue(startDate, endDate);
                break;
            case 'revenue_net':
                analyticsData = await analyticsCore.getAdminActualRevenueCore(startDate, endDate);
                break;
            case 'payment_methods':
                analyticsData = await analyticsCore.getPaymentMethodsShareCore(null, startDate, endDate);
                break;
            case 'leaderboard':
                analyticsData = await analyticsCore.getVendorsLeaderboardCore();
                break;
            case 'trends':
                analyticsData = await analyticsCore.getRevenueTrendsCore(null);
                break;
            case 'all':
            default:
                analyticsData = await analyticsCore.getAdminDashboardCore(startDate, endDate);
                break;
        }

        res.status(200).json({
            status: 'success',
            requested_metric: metric || 'all',
            data: analyticsData
        });
    } catch (error) {
        next(error);
    }
};

exports.getVendorAnalytics = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'vendor') {
            return next(new AppError('Access denied. Vendor privileges required.', 403));
        }

        const vendorId = req.user._id; 
        const { metric, startDate, endDate } = req.query;
        let analyticsData;

        switch (metric) {
            case 'bookings':
                analyticsData = await analyticsCore.getVendorBookingsStatus(vendorId, startDate, endDate);
                break;
            case 'capacity':
                analyticsData = await analyticsCore.getVendorCapacityLimits(vendorId, startDate, endDate);
                break;
            case 'quality':
                analyticsData = await analyticsCore.getVendorQualityScore(vendorId, startDate, endDate);
                break;
            case 'revenue_gross':
                analyticsData = await analyticsCore.getVendorRevenue(vendorId, startDate, endDate);
                break;
            case 'financial_breakdown':
                analyticsData = await analyticsCore.getVendorFinancialBreakdownCore(vendorId, startDate, endDate);
                break;
            case 'payment_methods':
                analyticsData = await analyticsCore.getPaymentMethodsShareCore(vendorId, startDate, endDate);
                break;
            case 'retention':
                analyticsData = await analyticsCore.getCustomerRetentionCore(vendorId);
                break;
            case 'trends':
                analyticsData = await analyticsCore.getRevenueTrendsCore(vendorId);
                break;
            case 'all':
            default:
                analyticsData = await analyticsCore.getVendorDashboardCore(vendorId, startDate, endDate);
                break;
        }

        res.status(200).json({
            status: 'success',
            requested_metric: metric || 'all',
            data: analyticsData
        });
    } catch (error) {
        next(error);
    }
};

exports.getPackageAnalytics = async (req, res, next) => {
    try {
        const { packageId } = req.params;
        const { startDate, endDate } = req.query;

        if (!packageId) {
            return next(new AppError('Package ID is required to fetch analytics.', 400));
        }

        const analysisData = await analyticsCore.getPackageFinancialAnalysisCore(packageId, startDate, endDate);

        res.status(200).json({
            status: 'success',
            data: analysisData
        });
    } catch (error) {
        next(error);
    }
};