const reportCore = require("../../services/Core/Client/reportCore");

exports.submitReport = async (req, res, next) => {
    try {
        const result = await reportCore.createReportCore(req.body, req.user.id);
        return res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};
