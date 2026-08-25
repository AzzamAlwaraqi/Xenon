const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");
const softDeletePlugin = require("../utils/softDeletePlugin");
const { MongooseStandardDate } = require("../utils/dateFormatter");

const NotificationSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7,
    },
    user_id: {
        type: mongoose.Schema.Types.UUID,
        ref: "User",
        required: true
    },
    vendor_id: {
        type: mongoose.Schema.Types.UUID,
        ref: "Vendor",
        required: false 
    },
    admin_id: {
        type: mongoose.Schema.Types.UUID,
        ref: "User",
        required: false
    },
    title: {
        type: String,
        required: true 
    },
    notification_type: {
        type: String,
        required: true,
        enum: [
            "booking", 
            "complaint", 
            "feedback", 
            "broadcast", 
            "update", 
            "system_alert", 
            "direct_message", 
            "marketing"
        ]
    },
    notification_message: {
        type: String,
        required: true
    },
    is_read: {
        type: Boolean,
        default: false
    },
    notification_date: {
        ...MongooseStandardDate,
        default: Date.now 
    },
    notification_time: {
        type: String,
        required: true,
        default: function() {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        }
    },
    
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true, 
    toJSON: { getters: true, virtuals: true }, 
    toObject: { getters: true, virtuals: true } 
});

NotificationSchema.pre(/^find/, function(next) {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    this.find({ 
        isDeleted: { $ne: true },
        createdAt: { $gte: sixtyDaysAgo } 
    });
    next();
});

NotificationSchema.plugin(softDeletePlugin);
module.exports = mongoose.model("Notification", NotificationSchema);