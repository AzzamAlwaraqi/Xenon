const mongoose = require("mongoose");
const AppError = require("../../../utils/AppError");
const Booking = require("../../../Models/BookingModel");
const Review = require("../../../Models/ReviewModel");
const Package = require("../../../Models/PackageModel"); // 🌟 تأكد من استيراد موديل الباقات
const { checkRole } = require("../../../utils/checkvalidete");

// ==========================================
// 🛡️ HELPER: Calculate Average Rating
// ==========================================
const updatePackageAverageRating = async (packageId, session = null) => {
    const targetId = typeof packageId === 'string' 
        ? new mongoose.Types.UUID(packageId) 
        : packageId;

    // نجلب كل التقييمات المقبولة وغير المحذوفة لهذه الباقة
    const stats = await Review.aggregate([
        { 
            $match: { 
                package_id: targetId, 
                review_status: 'accepted', 
                isDeleted: { $ne: true } 
            } 
        },
        { 
            $group: { 
                _id: '$package_id', 
                nRating: { $sum: 1 }, 
                avgRating: { $avg: '$review_rating' } 
            } 
        }
    ]);

    // تحديث الباقة بالمتوسط الجديد أو تصفيرها إذا لم يتبقَ تقييمات
    if (stats.length > 0) {
        await Package.findByIdAndUpdate(packageId, {
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: Math.round(stats[0].avgRating * 10) / 10 
        }, { session });
    } else {
        await Package.findByIdAndUpdate(packageId, {
            ratingsQuantity: 0,
            ratingsAverage: 0 
        }, { session });
    }
};

// ==========================================
// 1. Client Functions (العميل)
// ==========================================

exports.createReviewCore = async function (user, reviewData) {
    try {
        const { PACKAGE_Name, vendor_id, rating, comment } = reviewData;

        // 1. Find Vendor by name
        const Vendor = mongoose.model('Vendor');
        const vendor = await Vendor.findOne({ _id: vendor_id, isDelete: { $ne: true } });
        if (!vendor) throw new AppError(`Vendor not found`, 404);

        // 2. Find Package by name
        const PackageModel = mongoose.model('Package');
        const packageDoc = await PackageModel.findOne({ 
            package_name: PACKAGE_Name, 
            vendor_id: vendor._id,
            isDeleted: { $ne: true }
        });
        if (!packageDoc) throw new AppError(`Package '${PACKAGE_Name}' not found for the specified vendor`, 404);

        // 3. Find completed or accepted booking for this user and package
        const booking = await Booking.findOne({
            user_id: user._id,
            package_id: packageDoc._id,
            status: { $in: ['Completed', 'completed', 'accepted', 'Accepted'] },
            isDeleted: { $ne: true }
        }).sort({ updatedAt: -1 }); // Get the most recent booking

        if (!booking) {
            throw new AppError(`You cannot review this package because you do not have an accepted or completed booking for it.`, 400);
        }

        // 🌟 نافذة التقييم الزمنية (30 يوماً من تاريخ تحديث الحجز للاكتمال)
        const thirtyDaysInMillis = 30 * 24 * 60 * 60 * 1000;
        const timeSinceCompletion = Date.now() - new Date(booking.updatedAt).getTime();
        if (timeSinceCompletion > thirtyDaysInMillis) {
            throw new AppError('The time window (30 days) to review this trip has expired.', 400);
        }

        // 🌟 منع التكرار (Anti-Spam)
        const existingReview = await Review.findOne({ booking_id: booking._id, isDeleted: { $ne: true } });
        if (existingReview) {
            throw new AppError('You have already submitted a review for this booking.', 409);
        }

        const newReview = await Review.create({
            user_id: user._id,
            vendor_id: vendor._id,
            package_id: packageDoc._id,
            booking_id: booking._id, // حفظ رقم الحجز
            review_text: comment || reviewData.review_text || "",
            review_rating: rating || reviewData.review_rating,
            review_status: "in-progress"
        });

        return {
            status: "success",
            message: "Review submitted successfully and is pending admin approval.",
            data: newReview
        };
    } catch (error) {
        throw error; 
    }
};

exports.updateReviewCore = async function (user, reviewId, reviewData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const review = await Review.findOne({ _id: reviewId, isDeleted: { $ne: true } }).session(session);

        if (!review) throw new AppError("Review not found.", 404);

        if (review.user_id.toString() !== user._id.toString()) {
            throw new AppError("Not authorized to update this review.", 403);
        }

        let isModified = false;

        if (reviewData.rating || reviewData.review_rating) {
            review.review_rating = reviewData.rating || reviewData.review_rating;
            isModified = true;
        }
        
        if (reviewData.comment || reviewData.review_text) {
            review.review_text = reviewData.comment || reviewData.review_text;
            isModified = true;
        }

        // 🌟 حماية التعديل: إعادته للمراجعة وإعادة الحساب لو كان مقبولاً سابقاً
        if (isModified) {
            const wasAccepted = review.review_status === 'accepted';
            review.review_status = "in-progress";
            await review.save({ session });

            if (wasAccepted) {
                // إذا كان مقبولاً وتم تعديله، سيعود قيد المراجعة، ويجب خصمه من تقييم الباقة العام فوراً!
                await updatePackageAverageRating(review.package_id, session);
            }
        }

        await session.commitTransaction();
        session.endSession();

        return {
            status: "success",
            message: "Review updated and sent for re-approval.",
            data: review
        };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.deleteReviewCore = async function (user, reviewId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const review = await Review.findOne({ _id: reviewId, isDeleted: { $ne: true } }).session(session);
        
        if (!review) throw new AppError("Review not found.", 404);

        if (review.user_id.toString() !== user._id.toString() && !checkRole(user.role, ['admin'])) {
            throw new AppError("Not authorized to delete this review.", 403);
        }

        // 🌟 Soft Delete
        await Review.updateOne(
            { _id: review._id },
            { $set: { isDeleted: true, deletionRequestedAt: new Date() } },
            { session }
        );

        // 🌟 إعادة حساب تقييم الباقة (لأن التقييم تم حذفه)
        if (review.review_status === 'accepted') {
            await updatePackageAverageRating(review.package_id, session);
        }

        await session.commitTransaction();
        session.endSession();

        return { status: "success", message: "Review deleted successfully" };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
}; 

exports.getMyReviewsCore = async function (user, queryParams = {}) {
    try {
        const page = parseInt(queryParams.page, 10) || 1;
        const limit = parseInt(queryParams.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const query = { user_id: user._id, isDeleted: { $ne: true } };

        const [reviews, total] = await Promise.all([
            Review.find(query)
                .populate('vendor_id', 'vendor_company vendor_email -_id')
                .populate('package_id', 'package_name package_price -_id')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Review.countDocuments(query)
        ]);

        return {
            status: "success",
            results: reviews.length,
            pagination: {
                total, currentPage: page, limit, totalPages: Math.ceil(total / limit)
            },
            data: reviews
        };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.getReviewByIdCore = async function (user, reviewId) {
    try {
        const rawReview = await Review.findOne({ _id: reviewId, isDeleted: { $ne: true } });

        if (!rawReview) throw new AppError("Review not found.", 404);

        const isOwner = rawReview.user_id.toString() === user._id.toString();
        const isAdmin = checkRole(user.role, ['admin']);
        const isTargetVendor = rawReview.vendor_id && rawReview.vendor_id.toString() === user._id.toString();

        if (!isOwner && !isAdmin && !isTargetVendor && rawReview.review_status !== 'accepted') {
            throw new AppError("You do not have permission to view this review.", 403);
        }

        const review = await Review.populate(rawReview, [
            { path: 'user_id', select: 'name email -_id' },
            { path: 'vendor_id', select: 'vendor_company vendor_email -_id' },
            { path: 'package_id', select: 'package_name package_price -_id' }
        ]);

        return { status: "success", data: review };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
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

        // للعامة، نعرض التقييمات المقبولة وغير المحذوفة فقط
        const query = { package_id: packageId, review_status: "accepted", isDeleted: { $ne: true } };

        const [reviews, total] = await Promise.all([
            Review.find(query)
                .populate('user_id', 'name profileImage -_id')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Review.countDocuments(query)
        ]);

        return {
            status: "success",
            results: reviews.length,
            pagination: {
                total, currentPage: page, limit, totalPages: Math.ceil(total / limit)
            },
            data: reviews
        };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
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

        let query = { isDeleted: { $ne: true } };
        if (queryParams.rating) query.review_rating = queryParams.rating;
        if (queryParams.status) query.review_status = queryParams.status;
        if (queryParams.package_id) query.package_id = queryParams.package_id;

        const page = parseInt(queryParams.page, 10) || 1;
        const limit = parseInt(queryParams.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            Review.find(query)
                .populate('user_id', 'name email -_id')
                .populate('vendor_id', 'vendor_company vendor_email -_id')
                .populate('package_id', 'package_name -_id')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Review.countDocuments(query)
        ]);

        return {
            status: "success",
            results: reviews.length,
            pagination: {
                total, currentPage: page, limit, totalPages: Math.ceil(total / limit)
            },
            data: reviews
        };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.updateReviewStatusCore = async function (user, reviewId, status) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (!checkRole(user.role, ['admin'])) {
            throw new AppError("Unauthorized access. Admin role required.", 403);
        }

        const validStatuses = ['in-progress', 'accepted', 'rejected'];
        if (!validStatuses.includes(status)) {
            throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
        }

        const review = await Review.findOne({ _id: reviewId, isDeleted: { $ne: true } }).session(session);
        if (!review) throw new AppError("Review not found.", 404);

        review.review_status = status;
        await review.save({ session });

        // 🌟 إعادة حساب تقييم الباقة العام فوراً!
        await updatePackageAverageRating(review.package_id, session);

        await session.commitTransaction();
        session.endSession();

        return {
            status: "success",
            message: `Review status successfully updated to ${status}`,
            data: review
        };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 4. Vendor Functions (التاجر)
// ==========================================

exports.replyToReviewCore = async function (user, reviewId, replyText) {
    try {
        if (!checkRole(user.role, ['vendor'])) {
            throw new AppError("Unauthorized access. Vendor role required.", 403);
        }

        if (!replyText || replyText.trim() === "") {
            throw new AppError("Reply text cannot be empty.", 400);
        }

        const review = await Review.findOne({ _id: reviewId, isDeleted: { $ne: true } });
        if (!review) throw new AppError("Review not found.", 404);

        // التأكد أن الفيندور يمتلك هذه الباقة
        if (review.vendor_id.toString() !== user._id.toString()) {
            throw new AppError("You can only reply to reviews on your own packages.", 403);
        }

        review.vendor_reply = replyText;
        review.vendor_replied_at = new Date();
        await review.save();

        return {
            status: "success",
            message: "Your reply has been added to the review successfully.",
            data: review
        };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};