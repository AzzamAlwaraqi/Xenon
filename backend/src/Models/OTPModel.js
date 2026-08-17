const mongoose = require("mongoose");
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
    }
}, {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true }
});

// TTL index — MongoDB auto-removes documents when expiresAt passes
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for fast lookup by email + purpose
OTPSchema.index({ email: 1, purpose: 1 });

// Validate at least one contact method — using async style (Mongoose 9 / Express 5 compatible)
OTPSchema.pre("save", async function () {
    if (!this.email && !this.phone) {
        throw new Error("Either email or phone must be provided for OTP");
    }
});

module.exports = mongoose.model("OTP", OTPSchema);