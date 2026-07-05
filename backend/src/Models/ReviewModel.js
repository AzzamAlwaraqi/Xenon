const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
    review_id: {
        type: String,
        required: true
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
module.exports = mongoose.model("Review", ReviewSchema);