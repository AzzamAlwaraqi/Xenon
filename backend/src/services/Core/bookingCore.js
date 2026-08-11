const mongoose = require("mongoose");
const AppError = require("../../utils/AppError");
const BookingModel = require("../../Models/BookingModel");
const PackageModel = require("../../Models/PackageModel");
const checkRole = require("../../utils/checkRole");
const checkStatus = require("../../utils/checkStatus"); 

function checkAuthorization(userOrVendor, booking) {
    if (checkRole(userOrVendor.role, ["admin"])) return true;

    if (checkRole(userOrVendor.role, ["user"])) {
        if (booking.user_id.toString() !== userOrVendor._id.toString()) {
            throw new AppError("You are not authorized to perform this action on this booking", 403);
        }
    } else if (checkRole(userOrVendor.role, ["vendor"])) {
        if (booking.vendor_id.toString() !== userOrVendor._id.toString()) {
            throw new AppError("You are not authorized to perform this action on this booking", 403);
        }
    } else {
        throw new AppError("Invalid role", 403);
    }
}

function checkVendorAdminAuth(userOrVendor, booking) {
    if (checkRole(userOrVendor.role, ["admin"])) return true;

    if (checkRole(userOrVendor.role, ["vendor"])) {
        if (booking.vendor_id.toString() !== userOrVendor._id.toString()) {
            throw new AppError("You do not have permission to manage this booking", 403);
        }
    } else {
        throw new AppError("Only vendors or admins can perform this action", 403);
    }
}

exports.createBookingCore = async function (userOrVendor, bookingData) {
    const creatorId = userOrVendor._id;
    const creatorRole = userOrVendor.role;
    let finalUserId;

    if (checkRole(creatorRole, ['user'])) {
        finalUserId = creatorId;
    } else if (checkRole(creatorRole, ['vendor', 'admin'])) {
        if (!bookingData.targetUserId) {
            throw new AppError('you must specify the client (targetUserId) when creating a booking as a vendor/admin', 400);
        }
        finalUserId = bookingData.targetUserId;
    } else {
        throw new AppError('not authorized to perform this action', 403);
    }

    const requestedSeats = parseInt(bookingData.number_of_people,10) || 1;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const updatedPackage = await PackageModel.findOneAndUpdate(
            { 
                _id: bookingData.package_id, 
                available_seats: { $gte: requestedSeats },
                package_status: 'active',
                isDeleted: false
            },
            { 
                $inc: { available_seats: -requestedSeats }
            },
            { new: true, session }
        );

        if (!updatedPackage) {
            throw new AppError('The requested seats are not available or the package is currently unavailable.', 400);
        }

        const calculatedTotalPrice = updatedPackage.package_price * requestedSeats;

        const finalBookingPayload = {
            package_id: bookingData.package_id,
            user_id: finalUserId,
            vendor_id: updatedPackage.vendor_id, 
            creator_role: creatorRole,
            number_of_people: requestedSeats,
            total_price: calculatedTotalPrice,
            status: 'pending' 
        };

        const newBooking = await BookingModel.create([finalBookingPayload], { session });

        await session.commitTransaction();
        session.endSession();

        return newBooking[0];

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};

exports.updateBookingCore = async function (userOrVendor, bookingId, updateData) {
    try {
        const booking = await BookingModel.findById(bookingId);
        if (!booking || booking.isDeleted) {
            throw new AppError("Booking not found", 404);
        }
        
        checkAuthorization(userOrVendor, booking);

        const allowedUpdates = {};

        if (checkRole(userOrVendor.role, ["vendor", "admin"])) {
            if (updateData.status) {
                const validVendorStatuses = ["accepted", "rejected", "completed"];
                if (validVendorStatuses.includes(updateData.status)) {
                    allowedUpdates.status = updateData.status;
                } else {
                    throw new AppError("Invalid booking status.", 400);
                }
            }
        } 
        else if (checkRole(userOrVendor.role, ["user"])) {
            throw new AppError("Customers cannot edit booking details. Please cancel the booking and create a new one.", 403);
        }

        if (Object.keys(allowedUpdates).length === 0) {
            throw new AppError("No valid data found for update, or you do not have permission to update these fields.", 400);
        }

        const updatedBooking = await BookingModel.findByIdAndUpdate(
            bookingId, 
            allowedUpdates, 
            { new: true, runValidators: true }
        );
        
        return {
            status: "success",
            message: "The update process is completed successfully",
            data: updatedBooking
        };
    }
    catch (error) {
        throw error instanceof AppError ? error : new AppError(error.message, 400);
    }
};

exports.getBookingCore = async function (userOrVendor, bookingId) {
    try {
        const booking = await BookingModel.findById(bookingId)
            .populate('package_id', 'package_name package_price package_type')
            .populate('vendor_id', 'name vendor_email vendor_mobile')
            .populate('user_id', 'name email mobileNumber');

        if (!booking || booking.isDeleted) {
            throw new AppError("Booking not found", 404);
        }

        checkAuthorization(userOrVendor, booking);

        return {
            status: "success",
            data: booking
        };
    }
    catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message || "Internal Server Error", 500);
    }
};

exports.deleteBookingCore = async function (userOrVendor, bookingId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const booking = await BookingModel.findById(bookingId).session(session);
        if (!booking || booking.isDeleted) {
            throw new AppError("Booking not found", 404);
        }
        
        checkAuthorization(userOrVendor, booking);

        // تعديل مهم جداً: التحقق مما إذا كان الحجز يشغل مقاعد فعلاً قبل استرجاعها
        const shouldRestoreSeats = ['pending', 'accepted'].includes(booking.status);

        booking.isDeleted = true; 
        booking.deletionRequestedAt = new Date();
        booking.status = "cancelled"; // استبدال rejected بـ cancelled ليعرف التاجر أن العميل هو من ألغى
        
        await booking.save({ session });

        // لا نسترجع المقاعد إذا كان الحجز مرفوضاً أو مكتمل مسبقاً
        if (shouldRestoreSeats) {
            await PackageModel.findByIdAndUpdate(
                booking.package_id,
                { 
                    $inc: { available_seats: booking.number_of_people } 
                },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();

        return {
            status: "success",
            message: "Booking cancelled and seats recovered successfully",
            data: {
                bookingId,
                deletionRequestedAt: booking.deletionRequestedAt
            }
        };
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error instanceof AppError ? error : new AppError(error.message, 400);
    }
};

exports.getAllBookingCore = async function (userOrVendor) {
    try {
        let query = { isDeleted: false }; 
        
        if (checkRole(userOrVendor.role, ["user"])) {
            query.user_id = userOrVendor._id;
        } else if (checkRole(userOrVendor.role, ["vendor"])) {
            query.vendor_id = userOrVendor._id;
        } else if (!checkRole(userOrVendor.role, ["admin"])) {
            // الأدمن يتجاوز الشروط أعلاه لجلب كافة الحجوزات
            throw new AppError("Invalid role", 403);
        }

        const bookings = await BookingModel.find(query)
            .populate('package_id', 'package_name package_price package_type')
            .populate('vendor_id', 'name vendor_email vendor_mobile')
            .populate('user_id', 'name email mobileNumber')
            .sort({ createdAt: -1 });

        return {
            status: "success",
            count: bookings.length,
            data: bookings
        };

    }
    catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message || "Internal Server Error", 500);
    }
};

exports.getAllRequestsCore = async function (vendorId, packageId) {
    try {
        const query = {
            vendor_id: vendorId,
            status: 'pending',
            isDeleted: false
        };
        
        if (packageId) {
            query.package_id = packageId;
        }

        const requests = await BookingModel.find(query)
            .populate('package_id', 'package_name package_price max_people')
            .populate('user_id', 'name email mobileNumber')
            .sort({ createdAt: -1 });

        return {
            status: "success",
            count: requests.length,
            data: requests
        };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message || "Internal Server Error", 500);
    }
};

exports.getAllMyBookingsCore = async function (userOrVendor) {
    try {
        let query = { 
            isDeleted: false,
            status: { $in: ['pending', 'accepted'] } 
        }; 
        
        if (checkRole(userOrVendor.role, ["user"])) {
            query.user_id = userOrVendor._id;
        } else if (checkRole(userOrVendor.role, ["vendor"])) {
            query.vendor_id = userOrVendor._id;
        } else if (!checkRole(userOrVendor.role, ["admin"])) {
            throw new AppError("Invalid role", 403);
        }

        const activeBookings = await BookingModel.find(query)
            .populate('package_id', 'package_name package_price package_type startDate endDate')
            .populate('vendor_id', 'name vendor_email vendor_mobile')
            .populate('user_id', 'name email mobileNumber')
            .sort({ createdAt: -1 }); 

        return {
            status: "success",
            count: activeBookings.length,
            message: "Active bookings retrieved successfully",
            data: activeBookings
        };

    } catch (error) {
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};

exports.getBookingHistoryCore = async function (userOrVendor) {
    try {
        let userQuery = {};
        if (checkRole(userOrVendor.role, ["user"])) {
            userQuery.user_id = userOrVendor._id;
        } else if (checkRole(userOrVendor.role, ["vendor"])) {
            userQuery.vendor_id = userOrVendor._id;
        } else if (!checkRole(userOrVendor.role, ["admin"])) {
            throw new AppError("Invalid role", 403);
        }

        const historyQuery = {
            ...userQuery,
            $or: [
                { status: { $in: ['completed', 'rejected', 'cancelled'] } },
                { isDeleted: true }
            ]
        };

        const bookingHistory = await BookingModel.find(historyQuery)
            .populate('package_id', 'package_name package_price package_type startDate endDate')
            .populate('vendor_id', 'name vendor_email vendor_mobile')
            .populate('user_id', 'name email mobileNumber')
            .sort({ createdAt: -1 });

        return {
            status: "success",
            count: bookingHistory.length,
            message: "Booking history retrieved successfully",
            data: bookingHistory
        };

    } catch (error) {
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};

exports.acceptBookingCore = async function (vendorOrAdmin, bookingId) {
    try {
        const booking = await BookingModel.findById(bookingId);
        if (!booking || booking.isDeleted) throw new AppError("The booking does not exist", 404);

        checkVendorAdminAuth(vendorOrAdmin, booking);

        if (!checkStatus(booking.status, ['pending'])) {
            throw new AppError(`Can't accept this booking, status should be pending. Current status: ${booking.status}`, 400);
        }

        booking.status = 'accepted';
        await booking.save();

        return {
            status: "success",
            message: "Your booking has been accepted successfully",
            data: booking
        };
    } catch (error) {
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};

exports.rejectBookingCore = async function (vendorOrAdmin, bookingId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const booking = await BookingModel.findById(bookingId).session(session);
        if (!booking || booking.isDeleted) throw new AppError("The booking does not exist", 404);

        checkVendorAdminAuth(vendorOrAdmin, booking);

        if (!checkStatus(booking.status, ['pending', 'accepted'])) {
            throw new AppError("Can't reject this booking, status should be pending or accepted. Current status: " + booking.status, 400);
        }

        booking.status = 'rejected';
        await booking.save({ session });

        await PackageModel.findByIdAndUpdate(
            booking.package_id,
            { $inc: { available_seats: booking.number_of_people } },
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        return {
            status: "success",
            message: "Your booking has been rejected successfully",
            data: booking
        };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};

exports.completeBookingCore = async function (vendorOrAdmin, bookingId) {
    try {
        const booking = await BookingModel.findById(bookingId);
        if (!booking || booking.isDeleted) throw new AppError("The booking does not exist", 404);

        checkVendorAdminAuth(vendorOrAdmin, booking);

        if (!checkStatus(booking.status, ['accepted'])) {
            throw new AppError(`Can't complete this booking, status should be accepted. Current status: ${booking.status}`, 400);
        }

        booking.status = 'completed';
        await booking.save();

        return {
            status: "success",
            message: `Your booking has been completed successfully`,
            data: booking
        };
    } catch (error) {
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};

exports.updateStatusCore = async function (userOrVendor, bookingId, newStatus) {
    try {
        const validStatuses = ['accepted', 'rejected', 'completed'];
        if (!validStatuses.includes(newStatus)) {
            throw new AppError(`Invalid status update requested: ${newStatus}`, 400);
        }

        switch (newStatus) {
            case 'accepted':
                return await exports.acceptBookingCore(userOrVendor, bookingId);
            
            case 'rejected':
                return await exports.rejectBookingCore(userOrVendor, bookingId);
            
            case 'completed':
                return await exports.completeBookingCore(userOrVendor, bookingId);
                
            default:
                throw new AppError("Unexpected status encountered", 500);
        }
    } catch (error) {
        throw error instanceof AppError ? error : new AppError(error.message, 500);
    }
};