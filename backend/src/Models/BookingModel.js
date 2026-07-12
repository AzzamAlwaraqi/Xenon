const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
        ref: "user"
    },
    vendor_id: {
        type: String,
        required: true,
        ref: "vendor"
    },
    service_id: {
        type: String,
        required: true,
        ref: "service"
    },
    service_name: {
        type: String,
        required: true

    },
    booking_date: {
        type: Date,
        required: true
    },
    booking_time: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
        default: "pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }

});
module.exports = mongoose.model("Booking", BookingSchema);