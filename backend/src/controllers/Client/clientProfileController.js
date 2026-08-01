const AppError = require("../../utils/AppError");

exports.getprofile = async (req, res, next) => {
    try {
        res.status(200).json({ status: "success",
            token:req.token,
            message:"profile fetched successfully",
            data: req.user });
    }
    catch (error) {
        next(new AppError(error.message, 400));
    }
};

exports.updateprofile = async (req, res, next) => {
    try {
        res.status(200).json({
            status: "success",
            token: req.token,
            message: "profile updated successfully", 
            data: req.user
        });
    }
    catch (error) {
        next(new AppError(error.message, 400));
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        res.status(200).json({
            status: "success",
            token: req.token,
            message: "password changed successfully", 
            data: req.user
        });
    }
    catch (error) {
        next(new AppError(error.message, 400));
    }
};

exports.deleteprofile = async (req, res, next) => {
    try {
        res.status(200).json({
            status: "success",
            token:req.token,
            message: "profile deleted successfully",
            data: req.user
        });
    }
    catch (error) {
        next(new AppError(error.message, 400));
    }
};

exports.getMyReviews = async (req, res, next) => {
    try {
        res.status(200).json({
            status: "success",
            token: req.token,
            message: "reviews fetched successfully",
            data: "getMyReviews not yet implemented"
        });
    }
    catch (error) {
        next(new AppError(error.message, 400));
    }
};