const mongoose = require("mongoose");
const Report = require("../../../Models/ReportModel");
const User = require("../../../Models/UserModel");
const checkstatusReport = require("../../../utils/checkstatusReport");
const APIFeatures = require("../../../utils/APIFeatures");
const AppError = require("../../../utils/appError");
const checkTerminalStatus = require("../../../utils/TERMINAL_STATUSES"); 

exports.getAllReports = async function (queryString) {
    if(queryString.status && !checkstatusReport(queryString.status)) {
        throw new AppError("Invalid status parameter", 400);
    }

    const features = new APIFeatures(Report.find()
        .populate('reporter', 'name email') 
        .populate('reported_user', 'name email role'), 
        queryString
    )
    .filter()
    .sort() 
    .paginate();

    return await features.query;
};

exports.resolveReport = async function (reportId, action, adminNotes, adminId) {
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
                break;

            case 'warn_user':
                await User.findByIdAndUpdate(
                    report.reported_user, 
                    { $inc: { warnings_count: 1 } }, 
                    { session }
                );
                break;

            case 'suspend_user':
                await User.findByIdAndUpdate(
                    report.reported_user, 
                    { is_active: false }, 
                    { session }
                );
                break;

            case 'delete_content':
                if(!report.content_type || !report.content_id) {
                    throw new AppError("Cannot delete content: Target content details are missing in the report", 400);
                }
                const ContentModel = mongoose.model(report.content_type);
                await ContentModel.findByIdAndDelete(report.content_id).session(session);
                break;

            default:
                throw new AppError("Invalid action type", 400);
        }

        await report.save({ session });

        await session.commitTransaction();
        session.endSession();

        return report;

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};

exports.getUserModerationHistory = async function (userId) {
    const user = await User.findById(userId).select('name email warnings_count is_active');
    if (!user) {
        throw new AppError("No user found with that ID", 404);
    }

    const history = await Report.find({ 
        reported_user: userId, 
        status: { $in: ['resolved', 'closed'] }, 
        action_taken: { $ne: 'dismiss' } 
    }).sort({ createdAt: -1 });

    return {
        user_info: user,
        past_violations: history
    };
};

exports.escalateReport = async function (reportId, escalationNotes, adminId) {
    const report = await Report.findById(reportId);
    if (!report) throw new AppError("Report not found", 404);
    if (checkTerminalStatus(report.status)) throw new AppError("Cannot escalate a closed report", 400);
    report.status = 'escalated';
    report.escalation_notes = escalationNotes;
    report.escalation_by = adminId;
    await report.save();

    return report;
};