const mongoose = require("mongoose");
const softDeletePlugin = require("../utils/softDeletePlugin");
const { v7: uuidv7 } = require("uuid");

const OTPSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7,
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
        required: true,
        default: "registration"
    },
    attempts: {
        type: Number,
        default: 0
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    },
    verifiedAt: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    deletionRequestedAt: {
        type: Date,
        default: null
    },
    isBlocked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    strict: 'throw', 
    versionKey: false,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true }
});

// TTL index — removed per request to keep OTPs in database forever
// OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes for fast lookup by email or phone + purpose
OTPSchema.index({ email: 1, purpose: 1 });
OTPSchema.index({ phone: 1, purpose: 1 }); 

// ✅ Validate at least one contact method
OTPSchema.pre("validate", function () {
    if (!this.email && !this.phone) {
        throw new Error("Either email or phone must be provided for OTP");
    }
});

OTPSchema.plugin(softDeletePlugin);
module.exports = mongoose.model("OTP", OTPSchema);