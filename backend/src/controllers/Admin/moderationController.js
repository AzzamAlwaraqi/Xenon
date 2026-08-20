const moderationCore = require("../../services/Core/Admin/moderationCore");

exports.getAllReports = async (req, res, next) => {
    try {
        const result = await moderationCore.getAllReportsCore(req.query);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.resolveReport = async (req, res, next) => {
    try {
        const { action, adminNotes } = req.body;
        const result = await moderationCore.resolveReportCore(req.params.reportId, action, adminNotes, req.user.id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getUserModerationHistory = async (req, res, next) => {
    try {
        const result = await moderationCore.getUserModerationHistoryCore(req.params.userId);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.escalateReport = async (req, res, next) => {
    try {
        const { escalationNotes } = req.body;
        const result = await moderationCore.escalateReportCore(req.params.reportId, escalationNotes, req.user.id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
