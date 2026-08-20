const vendorApprovalCore = require("../../services/Core/Admin/vendorApprovalCore");

exports.getAllVendors = async (req, res, next) => {
    try {
        const result = await vendorApprovalCore.getAllVendorsCore(req.query, req.user);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.updateApprovalStatus = async (req, res, next) => {
    try {
        const { status, rejectionReason } = req.body;
        const result = await vendorApprovalCore.updateApprovalStatusCore(req.params.vendorId, status, rejectionReason, req.user);
        return res.status(200).json({
            status: "success",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

exports.getVendorDetails = async (req, res, next) => {
    try {
        const result = await vendorApprovalCore.getVendorDetailsCore(req.params.vendorId, req.user);
        return res.status(200).json({
            status: "success",
            data: result
        });
    } catch (error) {
        next(error);
    }
};
