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
        required: true
    },
    user_id: {
        type: String,
        required: true
    },
    complaint_type: {
        type: String,
        required: true
    },
    complaint_message: {
        type: String,
        required: true
    },
    complaint_title: {
        type: String,
        required: true
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
    }, isDelete: {
        type: Boolean,
        default: false
    },
    deletionRequestedAt: {
        type: MongooseStandardDate,
        default: null
    },
    complaint_date: {
        type: MongooseStandardDate,
        default: Date.now()
    },
    complaint_time: {
        type: String,
        default: function() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        }
    }
}, {
    timestamps: true,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true }
});
module.exports = mongoose.model("Complaint", ComplaintSchema);