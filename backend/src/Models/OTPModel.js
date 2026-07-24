const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");
const OTPSchema = new mongoose.Schema({
    _id: {
    type: mongoose.Schema.Types.UUID,
    default: uuidv7 
  },
    email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: false,
        trim: true
    },
    otp: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        default: "verification"
    },
    attempts: {
        type: Number,
        default: 0
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        index: { expires: 0 } // TTL index based on the value in expiresAt
    },
    verifiedAt: {
        type: Date,
        default: null
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

// Enforce that at least email or phone must be provided
OTPSchema.pre("save", function (next) {
    if (!this.email && !this.phone) {
        return next(new Error("Either email or phone must be provided for OTP"));
    }
    next();
});

module.exports = mongoose.model("OTP", OTPSchema);