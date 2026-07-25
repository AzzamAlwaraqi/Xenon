const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");
const { MongooseStandardDate } = require("../utils/dateFormatter");
const ReviewSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7
    },
    user_id: {
        type: String,
        required: true
    },
    review_text: {
        type: String,
        required: true
    },
    review_rating: {
        type: Number,
        required: true
    },
    review_date: {
        type: MongooseStandardDate,
        required: true,
        default: Date.now()
    },
    review_time: {
        type: String,
        required: true,
        default: function() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        }
    },
    vendor_id: {
        type: String,
        required: true
    },
    vendor_name: {
        type: String,
        required: true
    },
    package_id: {
        type: String,
        required: true
    },
    package_name: {
        type: String,
        required: true
    },
    review_status: {
        type: String,
        required: true,
        enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
        default: "pending"
    }
}, {
    timestamps: true,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true }
});
module.exports = mongoose.model("Review", ReviewSchema);