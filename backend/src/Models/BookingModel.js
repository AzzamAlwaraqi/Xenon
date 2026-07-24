const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");
const BookingSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7
    },
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
    package_id: {
        type: String,
        required: true,
        ref: "package"
    },
    booking_date: {
        type: Date,
        required: true

    },
    booking_time: {
        type: String,
        required: true
    },
    number_of_people: {
        type: Number,
        min: [1,"Number of people must be at least 1"],
        max: [5,"Number of people must be at most 5"],
        required: true
    },
    is_active: {
        type: Boolean,
        default: true
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