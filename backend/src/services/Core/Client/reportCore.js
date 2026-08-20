const Report = require("../../../Models/ReportsModels");
const AppError = require("../../../utils/AppError");

exports.createReportCore = async function (reportData, userId) {
    try {
        const { reported_user, content_type, content_id, reason, description } = reportData;

        // Basic validation
        if (!reported_user || !content_type || !content_id || !reason || !description) {
            throw new AppError("All fields are required to submit a report.", 400);
        }

        // Check for exact duplicate active reports to prevent spam
        const duplicate = await Report.findOne({
            reporter: userId,
            reported_user,
            content_id,
            status: { $in: ["pending", "escalated", "assigned"] }
        });

        if (duplicate) {
            throw new AppError("You already have an active report for this content.", 400);
        }

        const newReport = await Report.create({
            reporter: userId,
            reported_user,
            content_type,
            content_id,
            reason,
            description
        });

        return {
            status: "success",
            message: "Report submitted successfully. Our moderation team will review it shortly.",
            data: newReport
        };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};
