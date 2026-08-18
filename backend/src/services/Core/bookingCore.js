const mongoose = require("mongoose");
const AppError = require("../../utils/AppError");
const BookingModel = require("../../Models/BookingModel");
const PackageModel = require("../../Models/PackageModel");
const checkRole = require("../../utils/checkRole");
const checkStatus = require("../../utils/checkStatus"); 

function checkAuthorization(userOrVendor, booking) {
    if (checkRole(userOrVendor.role, ["admin"])) return true;

    if (checkRole(userOrVendor.role, ["user"])) {
        const bUserId = booking.user_id && booking.user_id._id ? booking.user_id._id.toString() : (booking.user_id ? booking.user_id.toString() : null);
        if (bUserId !== userOrVendor._id.toString()) {
            throw new AppError("You are not authorized to perform this action on this booking", 403);
        }
    } else if (checkRole(userOrVendor.role, ["vendor"])) {
        const bVendorId = booking.vendor_id && booking.vendor_id._id ? booking.vendor_id._id.toString() : (booking.vendor_id ? booking.vendor_id.toString() : null);
        if (bVendorId !== userOrVendor._id.toString()) {
            throw new AppError("You are not authorized to perform this action on this booking", 403);
        }
    } else {
        throw new AppError("Invalid role", 403);
    }
}

function checkVendorAdminAuth(userOrVendor, booking) {
    if (checkRole(userOrVendor.role, ["admin"])) return true;

    if (checkRole(userOrVendor.role, ["vendor"])) {
        const bVendorId = booking.vendor_id && booking.vendor_id._id ? booking.vendor_id._id.toString() : (booking.vendor_id ? booking.vendor_id.toString() : null);
        if (bVendorId !== userOrVendor._id.toString()) {
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
        // 🚀 Fix 1:  user_id to avoid deletion by Joi Validation
        if (!bookingData.user_id) {
            throw new AppError('you must specify the client (user_id) when creating a booking as a vendor/admin', 400);
        }
        finalUserId = bookingData.user_id;
    } else {
        throw new AppError('not authorized to perform this action', 403);
    }

    const requestedSeats = parseInt(bookingData.number_of_people, 10) || 1;

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
            booking_date: bookingData.booking_date,
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
        // 🚀 Fix 3: couldn't hide my custome errors
        throw  new AppError(error.message || "Internal Server Error",error.statusCode||500);
    }
};

exports.updateBookingCore = async function (userOrVendor, bookingId, updateData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const booking = await BookingModel.findById(bookingId).session(session);
        if (!booking || booking.isDeleted) {
            throw new AppError("Booking not found", 404);
        }
        
        checkAuthorization(userOrVendor, booking);

        // 🚀 Fix 2: can't update booking status from this route
        if (updateData.status) {
            throw new AppError("Cannot update booking status from this route. Please use the dedicated update-status endpoint.", 400);
        }

        const allowedUpdates = {};

        if (checkRole(userOrVendor.role, ["vendor"])) {
            if (updateData.booking_date) {
                allowedUpdates.booking_date = updateData.booking_date;
            }

            let oldPackage = null;
            let newPackage = null;
            
            // If package_id changed
            if (updateData.package_id && updateData.package_id !== booking.package_id.toString()) {
                oldPackage = await PackageModel.findById(booking.package_id).session(session);
                newPackage = await PackageModel.findById(updateData.package_id).session(session);
                
                if (!newPackage || newPackage.isDeleted || newPackage.package_status !== 'active') {
                    throw new AppError("The new package is not available.", 404);
                }

                const newSeatsRequired = parseInt(updateData.number_of_people, 10) || booking.number_of_people;
                
                if (newPackage.available_seats < newSeatsRequired) {
                    throw new AppError("Not enough available seats in the new package.", 400);
                }

                // Restore seats to old package
                if (oldPackage) {
                    oldPackage.available_seats += booking.number_of_people;
                    await oldPackage.save({ session });
                }

                // Deduct seats from new package
                newPackage.available_seats -= newSeatsRequired;
                await newPackage.save({ session });

                allowedUpdates.package_id = updateData.package_id;
                allowedUpdates.number_of_people = newSeatsRequired;
                allowedUpdates.total_price = newPackage.package_price * newSeatsRequired;
                
            } 
            // If only number_of_people changed
            else if (updateData.number_of_people && updateData.number_of_people !== booking.number_of_people) {
                const currentPackage = await PackageModel.findById(booking.package_id).session(session);
                if (!currentPackage) throw new AppError("Package not found.", 404);

                const seatDifference = parseInt(updateData.number_of_people, 10) - booking.number_of_people;

                // If asking for more seats, check availability
                if (seatDifference > 0 && currentPackage.available_seats < seatDifference) {
                    throw new AppError("Not enough available seats in the package to add more people.", 400);
                }

                currentPackage.available_seats -= seatDifference;
                await currentPackage.save({ session });

                allowedUpdates.number_of_people = updateData.number_of_people;
                allowedUpdates.total_price = currentPackage.package_price * updateData.number_of_people;
            }
        } 
        else if (checkRole(userOrVendor.role, ["user"])) {
            if (updateData.booking_date) {
                allowedUpdates.booking_date = updateData.booking_date;
            }

            if (updateData.number_of_people && updateData.number_of_people !== booking.number_of_people) {
                throw new AppError("Customers cannot change the number of people. Please go to the vendor, they will change it if they have free space.", 403);
            }
            
            // Allow changing package_id
            if (updateData.package_id && updateData.package_id !== booking.package_id.toString()) {
                const oldPackage = await PackageModel.findById(booking.package_id).session(session);
                const newPackage = await PackageModel.findById(updateData.package_id).session(session);
                
                if (!newPackage || newPackage.isDeleted || newPackage.package_status !== 'active') {
                    throw new AppError("The new package is not available.", 404);
                }

                if (newPackage.available_seats < booking.number_of_people) {
                    throw new AppError("Not enough available seats in the new package.", 400);
                }

                if (oldPackage) {
                    oldPackage.available_seats += booking.number_of_people;
                    await oldPackage.save({ session });
                }

                newPackage.available_seats -= booking.number_of_people;
                await newPackage.save({ session });

                allowedUpdates.package_id = updateData.package_id;
                allowedUpdates.total_price = newPackage.package_price * booking.number_of_people;
                allowedUpdates.status = "pending"; // Reset status to pending when changing package
            }
        }

        if (Object.keys(allowedUpdates).length === 0) {
            throw new AppError("No valid data found for update, or you do not have permission to update these fields.", 400);
        }

        const updatedBooking = await BookingModel.findByIdAndUpdate(
            bookingId, 
            allowedUpdates, 
            { new: true, runValidators: true, session }
        );
        
        await session.commitTransaction();
        session.endSession();

        return {
            status: "success",
            message: "The update process is completed successfully",
            data: updatedBooking
        };
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        // 🚀 Fix 3: couldn't hide my custome errors


        throw  new AppError(error.message || "Internal Server Error",error.statusCode||500);
    }
};
//get booking by id
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
        throw  new AppError(error.message || "Internal Server Error",error.statusCode||500);
    }
};
// delete booking with restore seats if pending or accepted
exports.deleteBookingCore = async function (userOrVendor, bookingId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const booking = await BookingModel.findById(bookingId).session(session);
        if (!booking || booking.isDeleted) {
            throw new AppError("Booking not found", 404);
        }
        
        checkAuthorization(userOrVendor, booking);

        const shouldRestoreSeats = ['pending', 'accepted'].includes(booking.status);

        booking.isDeleted = true; 
        booking.deletionRequestedAt = new Date();
        booking.status = "cancelled"; 
        
        await booking.save({ session });

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
        throw  new AppError(error.message || "Internal Server Error",error.statusCode||500);
    }
};
// get all bookings for a user or vendor or admin
exports.getAllBookingCore = async function (userOrVendor) {
    try {
        let query = { isDeleted: false }; 
        
        if (checkRole(userOrVendor.role, ["user"])) {
            query.user_id = userOrVendor._id;
        } else if (checkRole(userOrVendor.role, ["vendor"])) {
            query.vendor_id = userOrVendor._id;
        } else if (!checkRole(userOrVendor.role, ["admin"])) {
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
        throw  new AppError(error.message || "Internal Server Error",error.statusCode||500);
    }
};

exports.getAllRequestsCore = async function (userOrVendor, packageId) {
    try {
        const query = {
            status: 'pending',
            isDeleted: false
        };
        
        if (checkRole(userOrVendor.role, ["vendor"])) {
            query.vendor_id = userOrVendor._id; // The vendor sees only his requests
        } else if (!checkRole(userOrVendor.role, ["admin"])) {
            throw new AppError("Only admins and vendors can view requests", 403); // prohibit the normal user
        }
        // The admin will bypass the above conditions and will not set vendor_id to the  query, which brings all requests

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
        throw  new AppError(error.message || "Internal Server Error",error.statusCode||500);
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
        throw  new AppError(error.message || "Internal Server Error",error.statusCode||500);
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
        throw  new AppError(error.message || "Internal Server Error",error.statusCode||500);
    }
};

exports.acceptBookingCore = async function (vendorOrAdmin, bookingId) {
    try {
        const booking = await BookingModel.findById(bookingId);
        if (!booking || booking.isDeleted) throw new AppError("The booking does not exist", 404);

        checkVendorAdminAuth(vendorOrAdmin, booking);

        if (!checkStatus(booking.status, ['pending'])) {
            throw new AppError("Can't accept this booking, status should be pending. Current status: " + booking.status, 400);
        }

        booking.status = 'accepted';
        await booking.save();

        return {
            status: "success",
            message: "Your booking has been accepted successfully",
            data: booking
        };
    } catch (error) {
        throw  new AppError(error.message || "Internal Server Error",error.statusCode||500);
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
        throw new AppError(error.message || "Internal Server Error",error.statusCode || 500);
    }
};

exports.completeBookingCore = async function (vendorOrAdmin, bookingId) {
    try {
        const booking = await BookingModel.findById(bookingId);
        if (!booking || booking.isDeleted) throw new AppError("The booking does not exist", 404);

        checkVendorAdminAuth(vendorOrAdmin, booking);

        if (!checkStatus(booking.status, ['accepted'])) {
            throw new AppError("Can't complete this booking, status should be accepted. Current status: " + booking.status, 400);
        }

        booking.status = 'completed';
        await booking.save();

        return {
            status: "success",
            message: `Your booking has been completed successfully`,
            data: booking
        };
    } catch (error) {
        throw new AppError(error.message || "Internal Server Error",error.statusCode||500);
    }
};

exports.updateStatusCore = async function (userOrVendor, bookingId, newStatus) {
    try {
        const validStatuses = ['accepted', 'rejected', 'completed'];
        if (!validStatuses.includes(newStatus)) {
            throw new AppError("Invalid status update requested: " + newStatus, 400);
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
        throw new AppError(error.message || "Internal Server Error",error.statusCode||500);
    }
};

exports.getUserPendingRequestsCore = async function (userOrVendor) {
    try {
        if (!checkRole(userOrVendor.role, ["user"])) {
            throw new AppError("Only users can view their pending requests", 403);
        }

        const requests = await BookingModel.find({
            user_id: userOrVendor._id,
            status: 'pending',
            isDeleted: false
        })
        .populate('package_id', 'package_name package_price')
        .populate('vendor_id', 'name vendor_email vendor_mobile')
        .sort({ createdAt: -1 });

        return {
            status: "success",
            count: requests.length,
            data: requests
        };
    } catch (error) {
        throw new AppError(error.message || "Internal Server Error",error.statusCode||500);
    }
};

exports.getPendingRequestsCountCore = async function (userOrVendor) {
    try {
        if (!checkRole(userOrVendor.role, ["vendor", "admin"])) {
            throw new AppError("Only vendors or admins can view requests count", 403);
        }

        const query = { status: 'pending', isDeleted: false };
        if (checkRole(userOrVendor.role, ["vendor"])) {
            query.vendor_id = userOrVendor._id;
        }

        const count = await BookingModel.countDocuments(query);

        return {
            status: "success",
            data: { pendingRequestsCount: count }
        };
    } catch (error) {
        throw new AppError(error.message || "Internal Server Error",error.statusCode||500);
    }
};