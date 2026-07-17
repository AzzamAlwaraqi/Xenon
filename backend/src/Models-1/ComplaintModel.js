const mongoose = require("mongoose");

const ComplaintSchema = new mongoose.Schema({
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
module.exports = mongoose.model("Complaint", ComplaintSchema);