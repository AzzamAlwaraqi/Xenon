const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");
const { MongooseStandardDate } = require("../utils/dateFormatter");

const ReviewSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7
    },
    user_id: {
        type: mongoose.Schema.Types.UUID,
        required: true,
        ref: "User"
    },
    review_text: {
        type: String,
        required: true,
        trim: true
    },
    review_rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    vendor_id: {
        type: mongoose.Schema.Types.UUID,
        required: true,
        ref: "Vendor"
    },
    vendor_name: {
        type: String,
        required: true
    },
    package_id: {
        type: mongoose.Schema.Types.UUID,
        required: true,
        ref: "Package"
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

module.exports = mongoose.model("Review", ReviewSchema);