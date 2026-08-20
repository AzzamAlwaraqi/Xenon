const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");
const { MongooseStandardDate } = require("../utils/dateFormatter");

const ComplaintSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7,
    },
    complaint_id: {
        type: String,
        unique: true,
        trim: true
    },
    user_id: {
        type: mongoose.Schema.Types.UUID,
        required: true,
        ref: "User" 
    },
    vendor_id: {
        type: mongoose.Schema.Types.UUID,
        ref: "Vendor",
        default: null
    },
    booking_id: {
        type: mongoose.Schema.Types.UUID,
        ref: "Booking",
        default: null
    },
    complaint_type: {
        type: String,
        required: true,
        trim: true
    },
    complaint_title: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, "Title cannot exceed 100 characters"]
    },
    complaint_message: {
        type: String,
        required: true,
        trim: true,
        maxlength: [1000, "Message cannot exceed 1000 characters"]
    },
    // 🌟 تحسين 2: المرفقات (حد أقصى 3 صور لإثبات الشكوى)
    attachments: {
        type: [{
            url: { type: String, required: true },
            public_id: { type: String, required: true }
        }],
        validate: [
            {
                validator: function(val) { return val.length <= 3; },
                message: 'Maximum is 3 attachments'
            }
        ],
        default: []
    },
    complaint_priority: {
        type: String,
        required: true,
        enum: ["low", "medium", "high", "critical"],
        default: "low"
    },
    complaint_status: {
        type: String,
        required: true,
        enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
        default: "pending"
    },
    admin_response: {
        type: String,
        trim: true,
        maxlength: [1000, "Admin response cannot exceed 1000 characters"],
        default: null
    },
    reply: {
        type: String,
        trim: true,
        maxlength: [1000, "Reply cannot exceed 1000 characters"],
        default: null
    },
    isDeleted: { 
        type: Boolean,
        default: false
    },
    deletionRequestedAt: {
        ...MongooseStandardDate,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true }
});


ComplaintSchema.pre('validate', function () {
    if (this.isNew && !this.complaint_id) {
        const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.complaint_id = `CMP-${randomString}`;
    }
});

ComplaintSchema.index({ user_id: 1 });
ComplaintSchema.index({ complaint_status: 1 });
ComplaintSchema.index({ complaint_id: 1 });

module.exports = mongoose.model("Complaint", ComplaintSchema);