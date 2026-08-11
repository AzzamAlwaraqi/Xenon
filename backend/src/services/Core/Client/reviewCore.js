const AppError = require("../../../utils/AppError");
const Booking = require("../../../Models/BookingModel");
const Review = require("../../../Models/ReviewModel");
const Vendor = require("../../../Models/VendorModel");
const mongoose = require("mongoose");
const { reviewValidation } = require("../../../validations/Client/reviewValidation");
const checkRole = require("../../../utils/checkRole");

exports.createReviewCore = async function (user, booking_id, reviewData) {
  const booking = await Booking.findById(booking_id);
  
  if (!booking) {
    throw new Error('Booking not found.'); 
  }

  if (booking.user.toString() !== user._id.toString()) {
    throw new Error('Not authorized to review this booking.');
  }

  if (booking.status !== 'Completed') {
    throw new Error('Cannot review booking before completion.');
  }
  if (booking.isReviewed) {
    throw new Error('You have already reviewed this booking.');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const newReview = await Review.create([{
      user: user._id,
      targetId: booking.targetId, 
      bookingReference: booking._id, 
      rating: reviewData.rating,
      comment: reviewData.comment
    }], { session });

    booking.isReviewed = true;
    await booking.save({ session });
    await session.commitTransaction();
    session.endSession();

    return newReview[0]; 

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    throw error; 
  }
};
exports.getReviewsCore = async function (user) {
  
}
exports.updateReviewCore = async function (user) {
   
}
