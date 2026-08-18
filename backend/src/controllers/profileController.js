const profileCore = require("../services/Core/profileCore");
const AppError = require("../utils/AppError");
const authValidation = require("../validations/authValidation");

exports.getProfile = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) return next(new AppError("User not authenticated", 401));

        const profile = await profileCore.getProfileCore(user);
        res.status(200).json({
            status: "success",
            message: "Profile fetched successfully",
            data: profile
        });
    } catch (error) {
        next(new AppError(error.message, error.statusCode || 500));
    }
};


exports.updateProfile = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) return next(new AppError("User not authenticated", 401));

        const role = user.role === "vendor" ? "vendor" : "user";
        const validationFunction = role === "vendor" ? authValidation.updatevendorValidation : authValidation.updateProfileValidation;
        
        const { error, value } = validationFunction(req.body);
        if (error) return next(new AppError(error.details.map(d => d.message).join(", "), 400));
        req.body = value;

        const updatedProfile = await profileCore.updateProfileCore(user, req.body);
        res.status(200).json({
            status: "success",
            message: "Profile updated successfully",
            data: updatedProfile
        });
    } catch (error) {
        next(new AppError(error.message, error.statusCode || 500));
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) return next(new AppError("User not authenticated", 401));

        const { error, value } = authValidation.changePasswordValidation(req.body);
        if (error) return next(new AppError(error.details.map(d => d.message).join(", "), 400));
        req.body = value;

        const { old_password, new_password, oldPassword, newPassword } = req.body;
        
        const oldP = old_password || oldPassword;
        const newP = new_password || newPassword;

        if (!oldP || !newP) {
            return next(new AppError("Old password and new password are required", 400));
        }

        const result = await profileCore.updatePasswordCore(user, oldP, newP);
        res.status(200).json({
            status: "success",
            message: result.message
        });
    } catch (error) {
        next(new AppError(error.message, error.statusCode || 500));
    }
};

exports.deleteProfile = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) return next(new AppError("User not authenticated", 401));

        const { error, value } = authValidation.deleteAccountValidation(req.body);
        if (error) return next(new AppError(error.details.map(d => d.message).join(", "), 400));
        req.body = value;

        const result = await profileCore.deleteAccountCore(user);
        res.status(200).json({
            status: "success",
            message: result.message
        });
    } catch (error) {
        next(new AppError(error.message, error.statusCode || 500));
    }
};

// Client specific endpoint
exports.getMyReviews = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) return next(new AppError("User not authenticated", 401));

        const reviews = await profileCore.getAllReviewsCore(user);
        res.status(200).json({
            status: "success",
            message: "Reviews fetched successfully",
            data: reviews
        });
    } catch (error) {
        next(new AppError(error.message, error.statusCode || 500));
    }
};
