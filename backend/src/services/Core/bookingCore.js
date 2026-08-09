const AppError = require("../../utils/AppError");
const BookingModel = require("../../Models/BookingModel");
const PackageModel = require("../../Models/PackageModel");
const mongoose = require("mongoose");
const checkRole = require("../../utils/checkRole");

function checkAuthorization(userOrVendor, booking) {
    if (checkRole(userOrVendor.role, ["user"])) {
        if (booking.user_id.toString() !== userOrVendor._id.toString()) {
            throw new AppError("You are not authorized to perform this action on this booking", 401);
        }
    } else if (checkRole(userOrVendor.role, ["vendor"])) {
        if (booking.vendor_id.toString() !== userOrVendor._id.toString()) {
            throw new AppError("You are not authorized to perform this action on this booking", 401);
        }
    } else {
        throw new AppError("Invalid role", 403);
    }
}

exports.createBookingCore = async function (userOrVendor, bookingData) {
    try {
        if (checkRole(userOrVendor.role, ["vendor"])) {
            // Simplified creation for vendors
            bookingData.vendor_id = userOrVendor._id;
            const newBooking = await BookingModel.create(bookingData);
            return {
                status: "success",
                message: "Booking created successfully",
                data: newBooking
            };
        }
        
        // Complex creation for users with capacity checks
        if (!checkRole(userOrVendor.role, ["user"])) {
            throw new AppError("Unauthorized role for booking creation", 403);
        }

        const session = await mongoose.startSession();
        session.startTransaction();

        const { package_id, vendor_id, number_of_people, booking_date, status } = bookingData;
        const user_id = userOrVendor._id;

        const packageItem = await PackageModel.findOne({
            _id: package_id,
            vendor_id: vendor_id
        }).session(session);

        if (!packageItem)
            throw new AppError("Package not found or does not belong to this vendor", 404);

        const existingBookings = await BookingModel.find({
            package_id: packageItem._id,
            booking_date: new Date(booking_date),
            status: { $ne: 'cancelled' }
        }).session(session);

        const currentBookedCount = existingBookings.reduce((total, booking) => {
            return total + booking.number_of_people;
        }, 0);

        const newTotalBooked = currentBookedCount + number_of_people;
        if (newTotalBooked > packageItem.max_people) {
            const availableSeats = packageItem.max_people - currentBookedCount;
            throw new AppError(`Sorry, capacity is full for this date. Only ${availableSeats > 0 ? availableSeats : 0} seats remaining out of ${packageItem.max_people}.`, 400);
        }

        const totalPrice = packageItem.price * number_of_people;

        const newBooking = await BookingModel.create([{
            package_id,
            user_id,
            vendor_id,
            number_of_people,
            booking_date,
            total_price: totalPrice,
            status: status || "pending"
        }], { session });

        if (newTotalBooked === packageItem.max_people) {
            await PackageModel.updateOne(
                { _id: packageItem._id },
                { $set: { status: 'inactive' } },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();

        return {
            status: "success",
            message: "Booking created successfully",
            data: newBooking[0]
        };

    } catch (error) {
        if (error.statusCode) throw error;
        throw new AppError(error.message || "Internal Server Error", 500);
    }
};

exports.updateBookingCore = async function (userOrVendor, bookingId, booking_date) {
    try {
        const booking = await BookingModel.findById(bookingId);
        if (!booking) {
            throw new AppError("Booking not found", 404);
        }
        
        checkAuthorization(userOrVendor, booking);

        const updatedBooking = await BookingModel.findByIdAndUpdate(bookingId, {
            booking_date, 
            booking_time: function () {
                const now = new Date();
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                return `${hours}:${minutes}`;
            }
        }, { new: true });
        
        return {
            status: "success",
            message: "Booking updated successfully",
            data: updatedBooking
        };
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
};

exports.getBookingCore = async function (userOrVendor, bookingId) {
    try {
        const booking = await BookingModel.findById(bookingId)
            .populate('package_id', 'title price location')
            .populate('vendor_id', 'name email phone')
            .populate('user_id', 'name email phone');

        if (!booking) {
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
    try {
        const booking = await BookingModel.findById(bookingId);
        if (!booking) {
            throw new AppError("Booking not found", 404);
        }
        
        checkAuthorization(userOrVendor, booking);

        // We use soft delete for both roles to preserve data
        await BookingModel.updateOne({ _id: bookingId }, { isDelete: true, deletionRequestedAt: new Date() });
        
        return {
            status: "success",
            message: "Booking deleted successfully",
            data: {
                bookingId,
                deletionRequestedAt: new Date()
            }
        };
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
};

exports.getAllBookingCore = async function (userOrVendor) {
    try {
        let query = {};
        if (checkRole(userOrVendor.role, ["user"])) {
            query.user_id = userOrVendor._id;
        } else if (checkRole(userOrVendor.role, ["vendor"])) {
            query.vendor_id = userOrVendor._id;
        } else {
            throw new AppError("Invalid role", 403);
        }

        const bookings = await BookingModel.find(query)
            .populate('package_id', 'title price location')
            .populate('vendor_id', 'name email phone')
            .populate('user_id', 'name email phone');

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
    // Specific to vendors handling pending requests
    try {
        const query = {
            vendor_id: vendorId,
            status: 'pending'
        };
        if (packageId) {
            query.package_id = packageId;
        }

        const requests = await BookingModel.find(query)
            .populate('package_id', 'title price location max_people')
            .populate('user_id', 'name email phone')
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
