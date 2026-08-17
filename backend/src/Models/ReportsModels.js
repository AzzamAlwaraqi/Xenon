const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");

const ReportSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7,
    },
        report_id: {
        type: String,
        unique: true,
        trim: true
    },
    reporter: {
        type: mongoose.Schema.Types.UUID,
        required: true,
        ref: "User"
    },
    reported_user: {
        type: mongoose.Schema.Types.UUID,
        required: true,
        ref: "User"
    },
    content_type: {
        type: String,
        required: true,
        enum: ["Package", "Review", "Vendor", "Tour"] 
    },
    content_id: {
        type: mongoose.Schema.Types.UUID,
        required: true,
        refPath: "content_type" 
    },
    reason: {
        type: String,
        required: true,
        enum: ["spam", "inappropriate_content", "harassment", "other"]
    },
    description: {
        type: String,
        required: true,
        maxlength: [1000, "Description cannot exceed 1000 characters"]
    },
    status: {
        type: String,
        enum: ["pending", "resolved", "dismissed", "escalated", "rejected", "closed", "assigned", "reopened"],
        default: "pending"
    },
    action_taken: {
        type: String,
        enum: ["dismiss", "warn_user", "suspend_user", "delete_content", "escalate"],
        default: null
    },
    resolved_by: {
        type: mongoose.Schema.Types.UUID,
        ref: "User",
        default: null
    },
    admin_notes: {
        type: String,
        default: null
    },
    escalation_by: {
        type: mongoose.Schema.Types.UUID,
        ref: "User",
        default: null
    },
    escalation_notes: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true }
});


ReportSchema.pre('validate', function (next) {
    if (this.isNew && !this.report_id) {
        const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.report_id = `REP-${randomString}`;
    }
    next();
});


ReportSchema.index({ status: 1 }); 
ReportSchema.index({ reported_user: 1 }); 
ReportSchema.index({ report_id: 1 }); 

module.exports = mongoose.model("Report", ReportSchema);