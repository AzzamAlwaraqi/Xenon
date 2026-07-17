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

    }
    catch (error) {
        next(new AppError(error.message, 400));
    }
};

exports.changePassword = async (req, res, next) => {
    try {

    }
    catch (error) {
        next(new AppError(error.message, 400));
    }
};

exports.deleteprofile = async (req, res, next) => {
    try {

    }
    catch (error) {
        next(new AppError(error.message, 400));
    }
};

exports.getMyReviews = async (req, res, next) => {
    res.status(200).json({ status: "success", data: "getMyReviews not yet implemented" });
};