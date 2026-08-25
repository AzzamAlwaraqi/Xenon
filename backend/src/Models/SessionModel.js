const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");
const { MongooseStandardDate } = require("../utils/dateFormatter");

const SessionSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7, 
    },
    token_id: {
        type: String,
        required: true,
        unique: true
    },
    accessToken: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.UUID,
        ref: "User",
        required: true
    },
    expires_at: {
        ...MongooseStandardDate, 
        required: true
    },
    ip_address: {
        type: String,
        required: true
    },
    device_type: {
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
    session_status: {
        type: String,
        default: "active"
    },
    role: {
        type: String,
        required: true

    },
    family_id: {
        type: String,
        required: true
    }
}, { 
    timestamps: true, 
    toJSON: { getters: true, virtuals: true }, 
    toObject: { getters: true, virtuals: true }
});

SessionSchema.virtual('session_id').get(function() {
    return this._id;
});

module.exports = mongoose.model("Session", SessionSchema);