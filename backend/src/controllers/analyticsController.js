const analyticsCore = require('../core/analyticsCore');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

// ==========================================
// 👑 Admin Analytics Controller
// ==========================================
// exports.getAdminAnalytics = async (req, res, next) => {
//     const { metric, startDate, endDate } = req.query;
//     let analyticsData;

//     // توجيه طلبات الآدمن
//     switch (metric) {
//         // إذا أردت مستقبلاً جلب إحصائية واحدة للآدمن، يمكنك مناداة دوال Core الفردية هنا
//         case 'all':
//         default:
//             // جلب لوحة تحكم الآدمن بالكامل
//             analyticsData = await analyticsCore.getAdminDashboard(startDate, endDate);
//             break;
//     }

//     res.status(200).json({
//         status: 'success',
//         requested_metric: metric || 'all',
//         data: analyticsData
//     });
// };

exports.getAdminAnalytics = async (req, res, next) => {
    // 🛡️ Security Check: Double verify the role inside the controller
    if (!req.user || req.user.role !== 'admin') {
        return next(new AppError('Access denied. Admin privileges required.', 403));
    }

    const { metric, startDate, endDate } = req.query;
    let analyticsData;

    // 💡 Dynamic Routing based on requested admin metric
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

        case 'all':
        default:
            // Fetch entire admin dashboard in parallel
            analyticsData = await analyticsCore.getAdminDashboard(startDate, endDate);
            break;
    }

    res.status(200).json({
        status: 'success',
        requested_metric: metric || 'all',
        data: analyticsData
    });
};
// ==========================================
// 🏪 Vendor Analytics Controller
// ==========================================
exports.getVendorAnalytics = async (req, res, next) => {
    const vendorId = req.user.id; 
    const vendorObjectId = new mongoose.Types.ObjectId(vendorId);
    
    const { metric, startDate, endDate } = req.query;
    let analyticsData;

    // توجيه طلبات الفيندور
    switch (metric) {
        case 'bookings':
            analyticsData = await analyticsCore.getVendorBookingsStatus(vendorObjectId, startDate, endDate);
            break;
            
        case 'capacity':
            analyticsData = await analyticsCore.getVendorCapacityLimits(vendorObjectId, startDate, endDate);
            break;
            
        case 'quality':
            analyticsData = await analyticsCore.getVendorQualityScore(vendorObjectId, startDate, endDate);
            break;

        case 'all':
        default:
            analyticsData = await analyticsCore.getVendorDashboard(vendorId, startDate, endDate);
            break;
    }

    res.status(200).json({
        status: 'success',
        requested_metric: metric || 'all',
        data: analyticsData
    });
};