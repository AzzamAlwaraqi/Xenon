const vendorAuthCore = require("../../services/Core/Vendor/vendorAuthCore");
const authValidation = require("../../validations/authValidation");
const AppError = require("../../utils/AppError");

exports.getVendor = async (req, res, next) => {
    try {
        const vendorId = req.params.id || (req.user && req.user._id) || req.body.vendorId;
        if (!vendorId) {
            return res.AppError("Vendor ID is required", 400);
        }

        const vendor = await vendorAuthCore.getVendorCore(vendorId);
        res.status(200).json({
            status: "success",
            data: {
                vendor,
            }
        });
    } catch (error) {
        return res.AppError(error.message, error.statusCode || 500);
    }
};

exports.resetPasswordVendor = async (req, res, next) => {
    try {
        const validation = authValidation.resetPasswordVendorValidation(req.body);
        if (validation.error) {
            return res.AppError(validation.error.details.map(d => d.message).join(", "), 400);
        }

        const result = await vendorAuthCore.resetPasswordVendorCore(req.body);
        res.status(200).json({
            status: "success",
            message: result.message
        });
    } catch (error) {
        return res.AppError(error.message, error.statusCode || 500);
    }
};

exports.updateProfileVendor = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.AppError("User not authenticated");
        }

        const updatedUser = await vendorAuthCore.updateProfileVendorCore(user, req.body);
        res.status(200).json({
            status: "success",
            message: "Profile updated successfully",
            data: {
                user: updatedUser
            }
        });
    } catch (error) {
        return res.AppError(error.message, error.statusCode || 500);
    }
};

exports.changePasswordVendor = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.AppError("User not authenticated");
        }

        const result = await vendorAuthCore.changePasswordCore(user, req.body);
        res.status(200).json({
            status: "success",
            message: result.message
        });
    } catch (error) {
        return res.AppError(error.message, error.statusCode || 500);
    }
};

exports.deleteProfileVendor = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.AppError("User not authenticated");
        }

        const result = await vendorAuthCore.deleteMyAccountCore(user);
        res.status(200).json({
            status: "success",
            message: result.message
        });
    } catch (error) {
        return res.AppError(error.message, error.statusCode || 500);
    }
};