const mongoose = require("mongoose");
const AppError = require("../../utils/AppError");
const BookingModel = require("../../Models/BookingModel");
const PackageModel = require("../../Models/PackageModel");
const VendorModel = require("../../Models/VendorModel");
const { checkRole, checkStatus } = require("../../utils/checkvalidete");

// ==========================================
// 🛡️ HELPERS: Role, Auth & History
// ==========================================
function checkAuthorization(userOrVendor, booking) {
    if (checkRole(userOrVendor.role, ["admin"])) return true;

    if (checkRole(userOrVendor.role, ["user"])) {
        const bUserId = booking.user_id && booking.user_id._id ? booking.user_id._id.toString() : (booking.user_id ? booking.user_id.toString() : null);
        if (bUserId !== userOrVendor._id.toString()) throw new AppError("You are not authorized to perform this action on this booking", 403);
    } else if (checkRole(userOrVendor.role, ["vendor"])) {
        const bVendorId = booking.vendor_id && booking.vendor_id._id ? booking.vendor_id._id.toString() : (booking.vendor_id ? booking.vendor_id.toString() : null);
        if (bVendorId !== userOrVendor._id.toString()) throw new AppError("You are not authorized to perform this action on this booking", 403);
    } else {
        throw new AppError("Invalid role", 403);
    }
}

function checkVendorAdminAuth(userOrVendor, booking) {
    if (checkRole(userOrVendor.role, ["admin"])) return true;
    
    if (checkRole(userOrVendor.role, ["vendor"])) {
        const bVendorId = booking.vendor_id && booking.vendor_id._id ? booking.vendor_id._id.toString() : (booking.vendor_id ? booking.vendor_id.toString() : null);
        if (bVendorId !== userOrVendor._id.toString()) throw new AppError("You do not have permission to manage this booking", 403);
    } else {
        throw new AppError("Only vendors or admins can perform this action", 403);
    }
}

// ==========================================
// 1. CORE: Create Booking (Hold System)
// ==========================================
exports.createBookingCore = async function (userOrVendor, bookingData) {
    const creatorId = userOrVendor._id;
    const creatorRole = userOrVendor.role;
    
    let finalUserId;
    let bookingSource = 'CustomerApp';
    let bookedByEmployee = null; 

    if (checkRole(creatorRole, ['user'])) {
        finalUserId = creatorId;
    } else if (checkRole(creatorRole, ['vendor'])) {
        bookedByEmployee = creatorId; 
        bookingSource = checkRole(creatorRole, ['vendor']) ? 'VendorDashboard' : 'AdminPanel';
    } else {
        throw new AppError('Not authorized to perform this action', 403);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        if (checkRole(creatorRole, ['vendor'])) {
            if (bookingData.user_id) {
                finalUserId = bookingData.user_id;
            } else if (bookingData.customer_phone && bookingData.customer_name) {
                const UserModel = require("../../Models/UserModel");
                let existingUser = await UserModel.findOne({ mobileNumber: bookingData.customer_phone }).session(session);
                if (existingUser) {
                    finalUserId = existingUser._id;
                } else {
                    const crypto = require('crypto');
                    const randomPassword = crypto.randomBytes(8).toString('hex');
                    const newUser = new UserModel({
                        name: bookingData.customer_name,
                        email: `walkin_${bookingData.customer_phone}@xenon.local`,
                        mobileNumber: bookingData.customer_phone,
                        role: 'user',
                        password: randomPassword
                    });
                    await newUser.save({ session });
                    finalUserId = newUser._id;
                }
            } else {
                throw new AppError('You must specify the client (user_id) OR provide customer_phone and customer_name for walk-in customers', 400);
            }
        }

        const vendor = await VendorModel.findById(bookingData.vendor_id).session(session);
        if (!vendor) throw new AppError(`Vendor not found with ID: ${bookingData.vendor_id}`, 404);

        const requestedSeats = parseInt(bookingData.guests, 10) || 1;

        const packageDoc = await PackageModel.findOne({
            package_name: bookingData.package_Name,
            vendor_id: vendor._id,
            isDeleted: false
        }).session(session);

        if (!packageDoc) throw new AppError('The requested package was not found.', 404);

        if (new Date(packageDoc.startDate) <= new Date()) {
            if (packageDoc.package_status !== 'inactive') {
                packageDoc.package_status = 'inactive';
                await packageDoc.save({ session });
            }
            throw new AppError('This package has already started and is no longer accepting new bookings.', 400);
        }

        if (packageDoc.package_status !== 'active') throw new AppError('This package is not currently active.', 400);

        if (packageDoc.available_seats < requestedSeats) {
            throw new AppError('There are not enough available seats in this package right now.', 400);
        }

        const calculatedTotalPrice = packageDoc.package_price * requestedSeats;
        
        const initialStatus = 'pending_payment';

        const finalBookingPayload = {
            package_id: packageDoc._id,
            booking_date: bookingData.date,
            user_id: finalUserId,
            vendor_id: vendor._id, 
            booked_by: bookedByEmployee, 
            booking_source: bookingSource,
            creator_role: creatorRole,
            number_of_people: requestedSeats,
            total_price: calculatedTotalPrice,
            status: initialStatus,
            status_history: [{ status: initialStatus, changed_by: creatorId, changed_at: Date.now() }]
            // الـ payment_deadline سيتم إضافته تلقائياً بواسطة Schema (48 ساعة)
        };

        const newBooking = await BookingModel.create([finalBookingPayload], { session });

        packageDoc.available_seats -= requestedSeats;
        await packageDoc.save({ session });

        await session.commitTransaction();
        session.endSession();

        return newBooking[0];
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        if (error.statusCode) throw error; 
        throw new AppError(error.message || "Internal Server Error", 500);
    }
};

// ==========================================
// 2. CORE: Update Booking (Financial Protection)
// ==========================================
exports.updateBookingCore = async function (userOrVendor, bookingId, updateData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const booking = await BookingModel.findById(bookingId).session(session);
        if (!booking) throw new AppError("Booking not found", 404);
        
        checkAuthorization(userOrVendor, booking);

        if (updateData.status) {
            throw new AppError("Cannot update booking status from this route.", 400);
        }

        if (booking.status !== 'pending_payment' && (updateData.number_of_people || updateData.package_id)) {
            throw new AppError(`Cannot change seats or package because the booking status is '${booking.status}'. Please cancel and re-book.`, 400);
        }

        const allowedUpdates = {};
        if (updateData.booking_date) allowedUpdates.booking_date = updateData.booking_date;

        if (updateData.package_id || updateData.number_of_people) {
            const targetPackageId = updateData.package_id || booking.package_id;
            const targetSeats = parseInt(updateData.number_of_people, 10) || booking.number_of_people;

            const targetPackage = await PackageModel.findById(targetPackageId).session(session);
            if (!targetPackage || targetPackage.package_status !== 'active') {
                throw new AppError("The requested package is not available.", 404);
            }

            if (targetPackage.available_seats < targetSeats) {
                throw new AppError("Not enough available seats in the package.", 400);
            }

            allowedUpdates.package_id = targetPackage._id;
            allowedUpdates.number_of_people = targetSeats;
            allowedUpdates.total_price = targetPackage.package_price * targetSeats;

            // Handle seat adjustment logic
            if (updateData.package_id && updateData.package_id !== booking.package_id.toString()) {
                // Restore seats to old package
                const oldPackage = await PackageModel.findById(booking.package_id).session(session);
                if (oldPackage) {
                    oldPackage.available_seats += booking.number_of_people;
                    await oldPackage.save({ session });
                }
                // Deduct seats from new package
                targetPackage.available_seats -= targetSeats;
                await targetPackage.save({ session });
            } else if (updateData.number_of_people) {
                // Same package, adjust seats based on difference
                const seatDifference = targetSeats - booking.number_of_people;
                targetPackage.available_seats -= seatDifference;
                await targetPackage.save({ session });
            }
        }

        if (Object.keys(allowedUpdates).length === 0) {
            throw new AppError("No valid data provided for update.", 400);
        }

        const updatedBooking = await BookingModel.findByIdAndUpdate(
            bookingId, 
            allowedUpdates, 
            { new: true, runValidators: true, session }
        );
        
        await session.commitTransaction();
        session.endSession();

        return { status: "success", message: "Booking updated successfully", data: updatedBooking };
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        if (error.statusCode) throw error; 
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 3. CORE: Delete/Cancel Booking (Safe Seat Restore)
// ==========================================
exports.deleteBookingCore = async function (userOrVendor, bookingId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const booking = await BookingModel.findById(bookingId).session(session);
        if (!booking) throw new AppError("Booking not found", 404);
        
        checkAuthorization(userOrVendor, booking);

        if (booking.status === 'cancelled') {
            throw new AppError("This booking is already cancelled.", 400);
        }

        const packageDoc = await PackageModel.findById(booking.package_id).session(session);
        if (!packageDoc) throw new AppError("Package not found", 404);

        const shouldRestoreSeats = ['accepted', 'completed', 'pending_payment', 'pending'].includes(booking.status);

        let refundNote = "Cancelled successfully";
        if (['pending', 'accepted'].includes(booking.status)) {
            const timeDiff = new Date(packageDoc.startDate).getTime() - Date.now();
            const daysBeforeTrip = timeDiff / (1000 * 3600 * 24);
            if (daysBeforeTrip >= 7) {
                refundNote = "Cancelled - 50% refund applied (cancelled 7 or more days before trip)";
            } else {
                refundNote = "Cancelled - 0% refund (cancelled less than 7 days before trip)";
            }
        }

        booking.status = "cancelled";
        booking.cancelled_by = userOrVendor._id;
        booking.deletionRequestedAt = new Date();
        booking.status_history.push({
            status: "cancelled",
            changed_by: userOrVendor._id,
            changed_at: Date.now(),
            note: refundNote
        });
        
        await booking.save({ session });

        if (shouldRestoreSeats) {
            await PackageModel.findByIdAndUpdate(
                booking.package_id,
                { $inc: { available_seats: booking.number_of_people } },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();

        return { status: "success", message: "Booking cancelled successfully", data: { bookingId } };
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        if (error.statusCode) throw error; 
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 4. CORE: Get Booking By ID
// ==========================================
exports.getBookingCore = async function (userOrVendor, bookingId) {
    try {
        const booking = await BookingModel.findById(bookingId)
            .populate('package_id', 'package_name package_price package_type -_id')
            .populate({
                path: 'vendor_id',
                select: 'vendor_company_name owner_user_id -_id',
                populate: { path: 'owner_user_id', select: 'email -_id'}
            })
            .populate('user_id', 'name email mobileNumber -_id');

        if (!booking) throw new AppError("Booking not found", 404);

        checkAuthorization(userOrVendor, booking);

        return { status: "success", data: booking };
    }
    catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 5. CORE: Get All Bookings
// ==========================================
exports.getAllBookingCore = async function (userOrVendor) {
    try {
        let query = {}; 
        
        if (checkRole(userOrVendor.role, ["user"])) {
            query.user_id = userOrVendor._id;
        } else if (checkRole(userOrVendor.role, ["vendor"])) {
            query.vendor_id = userOrVendor._id;
        } else if (!checkRole(userOrVendor.role, ["admin"])) {
            throw new AppError("Invalid role", 403);
        }

        const bookings = await BookingModel.find(query)
            .populate('package_id', 'package_name package_price package_type -_id')
            .populate({
                path: 'vendor_id',
                select: 'vendor_company_name owner_user_id -_id',
                populate: { path: 'owner_user_id', select: 'email -_id'}
            })
            .populate('user_id', 'name email mobileNumber -_id')
            .sort({ createdAt: -1 });

        return { status: "success", count: bookings.length, data: bookings };
    }
    catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 6. CORE: Get All Pending Requests
// ==========================================
exports.getAllRequestsCore = async function (userOrVendor, packageId) {
    try {
        // تشمل اللي بيستنوا الدفع أو بيستنوا موافقة الموظف
        const query = { status: { $in: ['pending_payment', 'pending'] }, isDeleted: false };
        
        if (checkRole(userOrVendor.role, ["vendor"])) {
            query.vendor_id = userOrVendor._id; 
        } else if (!checkRole(userOrVendor.role, ["admin"])) {
            throw new AppError("Only admins and vendors can view requests", 403); 
        }

        if (packageId) query.package_id = packageId;

        const requests = await BookingModel.find(query)
            .populate('package_id', 'package_name package_price max_people -_id')
            .populate('user_id', 'name email mobileNumber -_id')
            .sort({ createdAt: -1 });

        return { status: "success", count: requests.length, data: requests };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 7. CORE: Get All My Active Bookings
// ==========================================
exports.getAllMyBookingsCore = async function (userOrVendor) {
    try {
        let query = { 
            status: { $in: ['pending_payment', 'pending', 'accepted'] } 
        }; 
        
        if (checkRole(userOrVendor.role, ["user"])) {
            query.user_id = userOrVendor._id;
        } else if (checkRole(userOrVendor.role, ["vendor"])) {
            query.vendor_id = userOrVendor._id;
        } else if (!checkRole(userOrVendor.role, ["admin"])) {
            throw new AppError("Invalid role", 403);
        }

        const activeBookings = await BookingModel.find(query)
            .populate('package_id', 'package_name package_price package_type startDate endDate -_id')
            .populate({
                path: 'vendor_id',
                select: 'vendor_company_name owner_user_id -_id',
                populate: { path: 'owner_user_id', select: 'email -_id' }
            })
            .populate('user_id', 'name email mobileNumber -_id')
            .sort({ createdAt: -1 }); 

        return {
            status: "success",
            count: activeBookings.length,
            message: "Active bookings retrieved successfully",
            data: activeBookings
        };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 8. CORE: Get Booking History
// ==========================================
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
            .populate('package_id', 'package_name package_price package_type startDate endDate -_id')
            .populate({
                path: 'vendor_id',
                select: 'vendor_company_name owner_user_id -_id',
                populate: { path: 'owner_user_id', select: 'email -_id' }
            })
            .populate('user_id', 'name email mobileNumber -_id')
            .sort({ createdAt: -1 });

        return {
            status: "success",
            count: bookingHistory.length,
            message: "Booking history retrieved successfully",
            data: bookingHistory
        };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 9. CORE: Status Management Methods
// ==========================================
exports.acceptBookingCore = async function (vendorOrAdmin, bookingId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const booking = await BookingModel.findById(bookingId).session(session);
        if (!booking || booking.isDeleted) throw new AppError("The booking does not exist", 404);

        checkVendorAdminAuth(vendorOrAdmin, booking);

        if (booking.status === 'accepted') throw new AppError("Booking is already accepted.", 400);
/**
 *  const packageDoc = await PackageModel.findById(booking.package_id).session(session);
        if (packageDoc.available_seats < booking.number_of_people) {
            throw new AppError("Cannot accept! Seats have been taken by others.", 400);
        }

        packageDoc.available_seats -= booking.number_of_people;
        await packageDoc.save({ session });
 */
        // 🌟 Seats were already deducted during booking creation.
        // We do not deduct them again to prevent double-deduction.


        booking.status = 'accepted';
        booking.status_history.push({
            status: 'accepted',
            changed_by: vendorOrAdmin._id,
            changed_at: Date.now()
        });
        await booking.save({ session });

        await session.commitTransaction();
        session.endSession();

        return { status: "success", message: "Booking accepted and seats reserved successfully", data: booking };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.rejectBookingCore = async function (vendorOrAdmin, bookingId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const booking = await BookingModel.findById(bookingId).session(session);
        if (!booking || booking.isDeleted) throw new AppError("The booking does not exist", 404);

        checkVendorAdminAuth(vendorOrAdmin, booking);

        if (['rejected', 'cancelled'].includes(booking.status)) {
            throw new AppError("Booking is already rejected or cancelled.", 400);
        }

        const shouldRestoreSeats = ['accepted', 'completed', 'pending_payment', 'pending'].includes(booking.status);

        booking.status = 'rejected';
        booking.status_history.push({
            status: 'rejected',
            changed_by: vendorOrAdmin._id,
            changed_at: Date.now()
        });
        await booking.save({ session });

        if (shouldRestoreSeats) {
            await PackageModel.findByIdAndUpdate(
                booking.package_id,
                { $inc: { available_seats: booking.number_of_people } },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();

        return { status: "success", message: "Booking has been rejected", data: booking };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.completeBookingCore = async function (vendorOrAdmin, bookingId) {
    try {
        const booking = await BookingModel.findById(bookingId);
        if (!booking || booking.isDeleted) throw new AppError("The booking does not exist", 404);

        checkVendorAdminAuth(vendorOrAdmin, booking);

        if (booking.status !== 'accepted') {
            throw new AppError("Can't complete this booking. Status must be 'accepted'.", 400);
        }

        booking.status = 'completed';
        booking.status_history.push({
            status: 'completed',
            changed_by: vendorOrAdmin._id,
            changed_at: Date.now()
        });
        await booking.save();

        return { status: "success", message: "Booking completed successfully", data: booking };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

exports.updateStatusCore = async function (userOrVendor, bookingId, newStatus) {
    try {
        const validStatuses = ['accepted', 'rejected', 'completed'];
        if (!validStatuses.includes(newStatus)) {
            throw new AppError("Invalid status update requested: " + newStatus, 400);
        }

        switch (newStatus) {
            case 'accepted': return await exports.acceptBookingCore(userOrVendor, bookingId);
            case 'rejected': return await exports.rejectBookingCore(userOrVendor, bookingId);
            case 'completed': return await exports.completeBookingCore(userOrVendor, bookingId);
        }
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 10. CORE: Get User Pending Requests
// ==========================================
exports.getUserPendingRequestsCore = async function (userOrVendor) {
    try {
        if (!checkRole(userOrVendor.role, ["user"])) {
            throw new AppError("Only users can view their pending requests", 403);
        }

        const requests = await BookingModel.find({
            user_id: userOrVendor._id,
            status: { $in: ['pending_payment', 'pending'] },
            isDeleted: false
        })
        .populate('package_id', 'package_name package_price -_id')
        .populate({
            path: 'vendor_id',
            select: 'vendor_company_name owner_user_id -_id',
            populate: { path: 'owner_user_id', select: 'email -_id' }
        })
        .sort({ createdAt: -1 });

        return { status: "success", count: requests.length, data: requests };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};

// ==========================================
// 11. CORE: Get Pending Requests Count
// ==========================================
exports.getPendingRequestsCountCore = async function (userOrVendor) {
    try {
        if (!checkRole(userOrVendor.role, ["vendor", "admin"])) {
            throw new AppError("Only vendors or admins can view requests count", 403);
        }

        const query = { status: { $in: ['pending_payment', 'pending'] }, isDeleted: false };
        if (checkRole(userOrVendor.role, ["vendor"])) {
            query.vendor_id = userOrVendor._id;
        }

        const count = await BookingModel.countDocuments(query);

        return { status: "success", data: { pendingRequestsCount: count } };
    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message, 500);
    }
};