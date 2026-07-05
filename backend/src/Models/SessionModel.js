const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema({
    session_id: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true,
        unique: true,
        select: false
    },
    expires_at: {
        type: Date,
        required: true
    },
    ip_address: {
        type: String,
        required: true
    },
    user_agent: {
        type: String,
        required: true
    },
    device_type: {
        type: String,
        required: true
    },
    os_name: {
        type: String,
        required: true
    },
    browser_name: {
        type: String,
        required: true
    },
    device_id: {
        type: String,
        required: true
    },
    is_active: {
        type: Boolean,
        required: true,
        default: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});
module.exports = mongoose.model("Session", SessionSchema);