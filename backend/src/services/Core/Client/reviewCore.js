const AppError = require("../../../utils/AppError");
const Booking = require("../../../Models/BookingModel");
const Review = require("../../../Models/ReviewModel");
const Vendor = require("../../../Models/VendorModel");
const mongoose = require("mongoose");
const { reviewValidation } = require("../../../validations/Client/reviewValidation");
const checkRole = require("../../../utils/checkRole");

exports.createReviewCore = async function (user, booking_id, reviewData) {
    try {
        if (!checkRole(user.role, ["user"])) {
            throw new AppError("Only users can create reviews", 403);
        }

        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();
        
        try {
            const validationResult = reviewValidation.createReviewValidation(reviewData);
            if (validationResult.error) {
                throw new AppError(validationResult.error.details[0].message, 400);
            }
            
            if (user.role !== 'user') {
                throw new AppError('Only clients can create reviews', 403);
            }
            
            const booking = await Booking.findById(booking_id).session(dbSession);
            
            if (!booking) {
                throw new AppError('Booking not found', 404);
            }
            
            if (booking.user_id.toString() !== user._id.toString()) {
                throw new AppError('You can only review your own bookings', 403);
            }
            
            const existingReview = await Review.findOne({
                booking_id: booking_id,
                client_id: user._id
            }).session(dbSession);
            
            if (existingReview) {
                throw new AppError('Review already exists for this booking', 409);
            }
            
            if (booking.status !== 'completed') {
                throw new AppError('Can only review completed bookings', 400);
            }
            
            // 6. Create review
            const review = new Review({
                client_id: user._id,
                vendor_id: booking.vendor_id,
                package_id: booking.package_id,
                booking_id: booking_id,
                rating: reviewData.rating,
                review_text: reviewData.review_text,
                is_anonymous: reviewData.is_anonymous || false
            });
            
            const savedReview = await review.save({ session: dbSession });
            
            // 7. Update vendor's average rating
            await Vendor.findByIdAndUpdate(
                booking.vendor_id,
                { $inc: { total_ratings: 1, total_rating_value: reviewData.rating } },
                { session: dbSession }
            );
            
            await dbSession.commitTransaction();
            dbSession.endSession();
            
            return savedReview;
            
        } catch (error) {
            await dbSession.abortTransaction();
            dbSession.endSession();
            throw error;
        }
    }
    catch (error) {
        throw new AppError(error.message, 400);
    }
}
exports.getReviewsCore = async function (user) {
    try {
        return "getReviews not yet implemented";
    }
    catch (error) {
        throw new AppError(error.message, 400);
    }
}
exports.updateReviewCore = async function (user) {
    try {
        return "updateReview not yet implemented";
    }
    catch (error) {
        throw new AppError(error.message, 400);
    }
}
