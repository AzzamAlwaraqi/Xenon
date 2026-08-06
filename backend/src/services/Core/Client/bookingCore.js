const AppError = require("../../../utils/AppError");
const BookingModel = require("../../../Models/BookingModel");
const PackageModel = require("../../../Models/PackageModel");
const mongoose = require("mongoose");

exports.createBookingCore = async function (bookingData) {
    try {
        const session = await mongoose.startSession();
        session.startTransaction();

        if (user.role !== "user") {
            throw new AppError("You are not authorized to create a booking", 403);
        }
        const { package_id, user_id, vendor_id, number_of_people, booking_date, status } = bookingData;

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
        await session.abortTransaction();
        session.endSession();

        if (error.statusCode) throw error;
        throw new AppError(error.message || "Internal Server Error", 500);
    }
};
exports.updateBookingCore = async function (vendor) {
    //U can update just Date and update to time but the time dynimic updated in he make update for booking just  it 
    try {
        if (vendor.role !== "user") {
            throw new AppError("You are not authorized to update this booking", 403);
        }
        const { bookingId, booking_date } = vendor;
        const booking = await BookingModel.findById(bookingId);
        if (!booking) {
            throw new AppError("Booking not found", 404);
        }
        if (booking.vendor_id != vendorId) {
            throw new AppError("You are not authorized to update this booking", 401);
        }
        const updatedBooking = await BookingModel.findByIdAndUpdate(bookingId, {
            booking_date, booking_time: function () {
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
}
exports.getBookingCore = async function (vendor) {
    try {
        if (vendor.role !== "user") {
            throw new AppError("You are not authorized to get this booking", 403);
        }
        const bookings = await BookingModel.find({ vendor_id: vendorId })
            .populate('package_id', 'title price location')
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
}


exports.deleteBookingCore = async function (vendor) {
    try {
        if (vendor.role !== "user") {
            throw new AppError("You are not authorized to delete this booking", 403);
        }
        const booking = await BookingModel.findById(vendorId);
        if (!booking) {
            throw new AppError("Booking not found", 404);
        }
        if (booking.vendor_id != vendorId) {
            throw new AppError("You are not authorized to delete this booking", 401);
        }
        await BookingModel.findByIdAndDelete(vendorId);
        return {
            status: "success",
            message: "Booking deleted successfully"
        };
    }
    catch (error) {
        throw AppError(error.message, 400);
    }
}

exports.getAllBookingCore = async function (vendor) {
    try {
        if (vendor.role !== "user") {
            throw new AppError("You are not authorized to get this booking", 403);
        }
        const bookings = await BookingModel.find({ vendor_id: vendorId })
            .populate('package_id', 'title price location')
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
}