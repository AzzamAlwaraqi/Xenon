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

        const UserModel = require("../../../Models/UserModel");
        const existingUser = await UserModel.findById(reported_user);
        if (!existingUser) throw new AppError("Reported user does not exist", 404);
        
        let contentExists = false;
        if (content_type === "package") {
            const PackageModel = require("../../../Models/PackageModel");
            contentExists = await PackageModel.findById(content_id);
        } else if (content_type === "review") {
            const ReviewModel = require("../../../Models/ReviewModel");
            contentExists = await ReviewModel.findById(content_id);
        } else {
            contentExists = true; // Fallback for other content types
        }
        if (!contentExists) throw new AppError(`${content_type} does not exist`, 404);

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
        throw error;
    }
};
