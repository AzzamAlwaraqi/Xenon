const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    vendor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor",
        required: true
    },
    admin_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    admin_name: {
        type: String,
        ref: "User"
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