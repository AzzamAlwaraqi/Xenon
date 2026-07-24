const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");
const SessionSchema = new mongoose.Schema({_id: {
    type: mongoose.Schema.Types.UUID,
    default: uuidv7 
  },
    token_id: {
        type: String,
        required: true,
        unique: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
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
        default: true
    },
    session_id: {
        type: String,
        required: true,
        unique: true
    },
    family_id: {
        type: String,
        required: true
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

module.exports = mongoose.model("Session", SessionSchema);