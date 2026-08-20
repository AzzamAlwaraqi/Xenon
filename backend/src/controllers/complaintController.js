const complaintCore = require("../services/Core/complaintCore");
const AppError = require("../utils/AppError");


exports.createComplaintController = async (req, res, next) => {
    try {
        const complaint = await complaintCore.createComplaintCore(req.user, req.body, req.files);
        return res.status(201).json({
            status: "success",
            data: complaint
        });
    } catch (error) {
        next(error);
    }
};

exports.getMyComplaintsController = async (req, res, next) => {
    try {
        const result = await complaintCore.getMyComplaintsCore(req.user, req.query);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getComplaintByIdController = async (req, res, next) => {
    try {
        const result = await complaintCore.getComplaintByIdCore(req.user, req.params.complaintId);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.cancelComplaintController = async (req, res, next) => {
    try {
        const result = await complaintCore.cancelComplaintCore(req.user, req.params.complaintId);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getComplaintsAgainstMeController = async (req, res, next) => {
    try {
        const result = await complaintCore.getComplaintsAgainstMeCore(req.user, req.query);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};


exports.getAllComplaintsController = async (req, res, next) => {
    try {
        const result = await complaintCore.getAllComplaintsCore(req.user, req.query);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.respondToComplaintController = async (req, res, next) => {
    try {
        const result = await complaintCore.respondToComplaintCore(req.user, req.params.complaintId, req.body);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};