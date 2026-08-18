const AppError = require("../../../utils/AppError");
const Booking = require("../../../Models/BookingModel");
const Review = require("../../../Models/ReviewModel");
const checkRole = require("../../../utils/checkRole");

// ==========================================
// 1. Client Functions (العميل)
// ==========================================

exports.createReviewCore = async function (user, booking_id, reviewData) {
    try {
        const booking = await Booking.findById(booking_id);
        
        if (!booking) {
            throw new AppError('Booking not found.', 404); 
        }

        if (booking.user_id.toString() !== user._id.toString()) {
            throw new AppError('Not authorized to review this booking.', 403);
        }

        if (booking.status && booking.status !== 'Completed' && booking.status !== 'completed') {
            throw new AppError('Cannot review a booking before its completion.', 400);
        }

        const newReview = await Review.create({
            user_id: user._id,
            vendor_id: booking.vendor_id,
            package_id: booking.package_id,
            review_text: reviewData.comment || reviewData.review_text || "",
            review_rating: reviewData.rating || reviewData.review_rating,
            review_status: "in-progress"
        });

        return newReview;
    } catch (error) {
        throw error instanceof AppError ? error : new AppError(error.message, 500); 
    }
};

exports.updateReviewCore = async function (user, reviewId, reviewData) {
    try {
        const review = await Review.findById(reviewId);

        if (!review) {
            throw new AppError("Review not found.", 404);
        }

        if (review.user_id.toString() !== user._id.toString()) {
            throw new AppError("Not authorized to update this review.", 403);
        }

        if (reviewData.rating || reviewData.review_rating) {
            review.review_rating = reviewData.rating || reviewData.review_rating;
        }
        if (reviewData.comment || reviewData.review_text) {
            review.review_text = reviewData.comment || reviewData.review_text;
        }

        await review.save();

        return review;
    } catch (error) {
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};

exports.deleteReviewCore = async function (user, reviewId) {
    try {
        const review = await Review.findById(reviewId);
        
        if (!review) {
            throw new AppError("Review not found.", 404);
        }

        if (review.user_id.toString() !== user._id.toString() && !checkRole(user.role, ['admin'])) {
            throw new AppError("Not authorized to delete this review.", 403);
        }

        await Review.findByIdAndDelete(reviewId);

        return { message: "Review deleted successfully" };
    } catch (error) {
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
}; 

exports.getMyReviewsCore = async function (user, queryParams = {}) {
    try {
        const page = parseInt(queryParams.page, 10) || 1;
        const limit = parseInt(queryParams.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            Review.find({ user_id: user._id })
                .populate('vendor_id', 'name vendor_email')
                .populate('package_id', 'package_name package_price')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Review.countDocuments({ user_id: user._id })
        ]);

        return {
            results: reviews.length,
            pagination: {
                total, currentPage: page, limit, totalPages: Math.ceil(total / limit)
            },
            data: reviews
        };
    } catch (error) {
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};

exports.getReviewByIdCore = async function (user, reviewId) {
    try {
        const review = await Review.findById(reviewId)
            .populate('user_id', 'name email')
            .populate('vendor_id', 'name vendor_email')
            .populate('package_id', 'package_name package_price');

        if (!review) {
            throw new AppError("Review not found.", 404);
        }

        return review;
    } catch (error) {
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};

// ==========================================
// 2. Public Functions (العملاء والزوار)
// ==========================================

exports.getPackageReviewsCore = async function (packageId, queryParams = {}) {
    try {
        const page = parseInt(queryParams.page, 10) || 1;
        const limit = parseInt(queryParams.limit, 10) || 15;
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            Review.find({ package_id: packageId, review_status: "accepted" })
                .populate('user_id', 'name profileImage')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Review.countDocuments({ package_id: packageId, review_status: "accepted" })
        ]);

        return {
            results: reviews.length,
            pagination: {
                total, currentPage: page, limit, totalPages: Math.ceil(total / limit)
            },
            data: reviews
        };
    } catch (error) {
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};

// ==========================================
// 3. Admin Functions (الإدارة)
// ==========================================

exports.getAllReviewsCore = async function (user, queryParams = {}) {
    try {
        if (!checkRole(user.role, ['admin'])) {
            throw new AppError("Unauthorized access. Admin role required.", 403);
        }

        let query = {};
        if (queryParams.rating) query.review_rating = queryParams.rating;
        if (queryParams.status) query.review_status = queryParams.status;
        if (queryParams.package_id) query.package_id = queryParams.package_id;

        const page = parseInt(queryParams.page, 10) || 1;
        const limit = parseInt(queryParams.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            Review.find(query)
                .populate('user_id', 'name email')
                .populate('vendor_id', 'name vendor_email')
                .populate('package_id', 'package_name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Review.countDocuments(query)
        ]);

        return {
            results: reviews.length,
            pagination: {
                total, currentPage: page, limit, totalPages: Math.ceil(total / limit)
            },
            data: reviews
        };
    } catch (error) {
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};

exports.updateReviewStatusCore = async function (user, reviewId, status) {
    try {
        if (!checkRole(user.role, ['admin'])) {
            throw new AppError("Unauthorized access. Admin role required.", 403);
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            throw new AppError("Review not found.", 404);
        }

        review.review_status = status;
        await review.save();

        return review;
    } catch (error) {
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};