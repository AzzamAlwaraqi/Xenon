const reviewCore = require("../../services/Core/Client/reviewCore");
const AppError = require("../../utils/AppError");

exports.createReview = async (req, res, next) => {
    try {
        const review = await reviewCore.createReviewCore(req.user, req.body);
        return res.status(201).json({
            status: "success",
            data: review
        });
    } catch (error) {
        next(error);
    }
};

exports.getMyReviews = async (req, res, next) => {
    try {
        const result = await reviewCore.getMyReviewsCore(req.user, req.query);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getReviewById = async (req, res, next) => {
    try {
        const review = await reviewCore.getReviewByIdCore(req.user, req.params.id);
        return res.status(200).json({
            status: "success",
            data: review
        });
    } catch (error) {
        next(error);
    }
};

exports.updateReview = async (req, res, next) => {
    try {
        const updatedReview = await reviewCore.updateReviewCore(req.user, req.params.id, req.body);
        return res.status(200).json({
            status: "success",
            data: updatedReview
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteReview = async (req, res, next) => {
    try {
        const result = await reviewCore.deleteReviewCore(req.user, req.params.id);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getPackageReviews = async (req, res, next) => {
    try {
        const result = await reviewCore.getPackageReviewsCore(req.params.packageId, req.query);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.getAllReviews = async (req, res, next) => {
    try {
        const result = await reviewCore.getAllReviewsCore(req.user, req.query);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

exports.updateReviewStatus = async (req, res, next) => {
    try {
        const updatedReview = await reviewCore.updateReviewStatusCore(req.user, req.params.id, req.body.status);
        return res.status(200).json({
            status: "success",
            data: updatedReview
        });
    } catch (error) {
        next(error);
    }
};