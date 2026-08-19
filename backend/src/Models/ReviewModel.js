const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");

const ReviewSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7,
    },
    user_id: {
        type: mongoose.Schema.Types.UUID,
        required: true,
        ref: "User"
    },
    vendor_id: {
        type: mongoose.Schema.Types.UUID,
        required: true,
        ref: "Vendor"
    },
    package_id: {
        type: mongoose.Schema.Types.UUID,
        required: true,
        ref: "Package"
    },
    booking_id: { 
        type: mongoose.Schema.Types.UUID,
        required: true,
        ref: "Booking"
    },
    review_text: {
        type: String,
        required: true,
        trim: true
    },
    review_rating: {
        type: Number,
        required: true,
        min: [1, "التقييم يجب أن يكون 1 كحد أدنى"],
        max: [5, "التقييم يجب أن يكون 5 كحد أقصى"]
    },
    review_status: {
        type: String,
        required: true,
        enum: ["accepted", "rejected", "in-progress"],
        default: "in-progress"
    },
    vendor_reply: {
        type: String,
        trim: true,
        default: null
    },
    vendor_replied_at: {
        type: Date,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletionRequestedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true }
});

// 🚀 Database Indexes 
ReviewSchema.index({ package_id: 1, review_status: 1, isDeleted: 1 }); 
ReviewSchema.index({ booking_id: 1 }, { unique: true });


ReviewSchema.virtual('review_time_formatted').get(function() {
    if (!this.createdAt) return null;
    const date = new Date(this.createdAt);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
});

ReviewSchema.virtual('review_date_formatted').get(function() {
    if (!this.createdAt) return null;
    const date = new Date(this.createdAt);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
});

module.exports = mongoose.model("Review", ReviewSchema);