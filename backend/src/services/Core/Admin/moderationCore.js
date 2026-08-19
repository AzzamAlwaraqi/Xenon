const mongoose = require("mongoose");
const Report = require("../../../Models/ReportsModels");
const User = require("../../../Models/UserModel");
const { checkReportStatus: checkstatusReport, checkTerminalStatus } = require("../../../utils/checkvalidete");
const APIFeatures = require("../../../utils/apiFeatures");
const AppError = require("../../../utils/AppError");

// ==========================================
// 1. Get All Reports
// ==========================================
exports.getAllReportsCore = async function (queryString) {
    if (queryString.status && !checkstatusReport(queryString.status)) {
        throw new AppError("Invalid status parameter", 400);
    }

    const features = new APIFeatures(
        Report.find()
            // 🌟 إخفاء الـ _id للحفاظ على نظافة الـ API للـ Frontend
            .populate('reporter', 'name email -_id')
            .populate('reported_user', 'name email role -_id'),
        queryString
    )
        .filter()
        .sort()
        .paginate();

    const reports = await features.query;

    // توحيد شكل الاستجابة
    return {
        status: "success",
        count: reports.length,
        data: reports
    };
};

// ==========================================
// 2. Resolve Report (The Core Engine)
// ==========================================
exports.resolveReportCore = async function (reportId, action, adminNotes, adminId) {
    if (['suspend_user', 'delete_content'].includes(action) && !adminNotes) {
        throw new AppError(`Admin notes are strictly required when performing: ${action}`, 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const report = await Report.findById(reportId).session(session);
        if (!report) throw new AppError("Report not found", 404);
        if (checkTerminalStatus(report.status)) {
            throw new AppError(`Cannot modify a report that is already ${report.status}`, 400);
        }

        report.status = action === 'dismiss' ? 'dismissed' : 'resolved';
        report.resolved_by = adminId;
        report.admin_notes = adminNotes;
        report.action_taken = action;

        switch (action) {
            case 'dismiss':
                // لا يوجد إجراء إضافي
                break;

            case 'warn_user':
                // 🌟 التحسين الذكي: الإيقاف التلقائي عند الوصول لـ 3 إنذارات
                const userToWarn = await User.findById(report.reported_user).session(session);
                if (userToWarn) {
                    userToWarn.warnings_count = (userToWarn.warnings_count || 0) + 1;
                    
                    if (userToWarn.warnings_count >= 3) {
                        userToWarn.isActive = false; // Auto-suspend
                        report.admin_notes += " | [SYSTEM: User automatically suspended due to reaching 3 warnings]";
                    }
                    await userToWarn.save({ session });
                }
                break;

            case 'suspend_user':
                // 🌟 تصحيح اسم الحقل ليطابق الموديل (isActive)
                await User.findByIdAndUpdate(
                    report.reported_user,
                    { isActive: false },
                    { session }
                );
                // ملاحظة: إذا كان هناك SessionModel، يجب أن نضيف كود لتدمير جلساته هنا!
                break;

            case 'delete_content':
                if (!report.content_type || !report.content_id) {
                    throw new AppError("Cannot delete content: Target content details are missing in the report", 400);
                }

                // 🌟 حماية ضد الـ Dynamic Injection (حدد فقط الموديلات المسموح حذفها)
                const allowedModels = ['ReviewModel', 'CommentModel', 'PackageModel']; // عدلها حسب الموديلات الحقيقية في مشروعك
                if (!allowedModels.includes(report.content_type)) {
                    throw new AppError(`Security Error: Modifying ${report.content_type} is not allowed via reporting.`, 403);
                }

                const ContentModel = mongoose.model(report.content_type);
                
                // 🌟 Soft Delete بدلاً من Hard Delete
                await ContentModel.findByIdAndUpdate(
                    report.content_id, 
                    { isDeleted: true }, // تأكد أن الموديل المستهدف يحتوي على حقل isDeleted
                    { session }
                );
                break;

            default:
                throw new AppError("Invalid action type", 400);
        }

        await report.save({ session });

        await session.commitTransaction();
        session.endSession();

        return {
            status: "success",
            message: `Report resolved with action: ${action}`,
            data: report
        };

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        // 🌟 توحيد إدارة الأخطاء
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 3. Get User Moderation History
// ==========================================
exports.getUserModerationHistoryCore = async function (userId) {
    try {
        // 🌟 تصحيح الحقل لـ isActive
        const user = await User.findById(userId).select('name email warnings_count isActive');
        if (!user) {
            throw new AppError("No user found with that ID", 404);
        }

        const history = await Report.find({
            reported_user: userId,
            status: { $in: ['resolved', 'closed'] },
            action_taken: { $ne: 'dismiss' }
        }).sort({ createdAt: -1 });

        return {
            status: "success",
            data: {
                user_info: user,
                past_violations: history
            }
        };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 4. Escalate Report
// ==========================================
exports.escalateReportCore = async function (reportId, escalationNotes, adminId) {
    try {
        const report = await Report.findById(reportId);
        if (!report) throw new AppError("Report not found", 404);
        if (checkTerminalStatus(report.status)) throw new AppError("Cannot escalate a closed report", 400);
        
        report.status = 'escalated';
        report.escalation_notes = escalationNotes;
        report.escalation_by = adminId;
        
        await report.save();

        return {
            status: "success",
            message: "Report successfully escalated to higher administration.",
            data: report
        };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};