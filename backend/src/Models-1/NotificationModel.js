const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
    notification_id: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        default: ""
    },
    vendor_id: {
        type: String,
        default: ""
    },
    admin_id: {
        type: String,
        default: ""
    },
    notification_type: {
        type: String,
        required: true,
        enum: ["booking", "complaint", "feedback"]
    },
    notification_message: {
        type: String,
        required: true
    },
    is_read: {
        type: Boolean,
        default: false
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
module.exports = mongoose.model("Notification", NotificationSchema);