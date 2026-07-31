const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");
const { MongooseStandardDate } = require("../utils/dateFormatter");
const BookingSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7,
        unique: true,
        index: true``
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
        required: true,
        default: function() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        }
    },
    number_of_people: {
        type: Number,
        min: [1, "Number of people must be at least 1"],
        max: [5, "Number of people must be at most 5"],
        required: true
    },
    is_active: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        required: true,
        enum: ["pending", "accepted", "rejected", "completed"],
        default: "pending"
    },
    total_price: {
        type: Number,
        required: true
    },
    isDelete: {
        type: Boolean,
        default: false
    },
    deletionRequestedAt: {
        type: MongooseStandardDate,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true }
});
module.exports = mongoose.model("Booking", BookingSchema);