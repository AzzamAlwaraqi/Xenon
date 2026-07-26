const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");
const { MongooseStandardDate } = require("../utils/dateFormatter");
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
        ...MongooseStandardDate,
        default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
        index: { expires: 0 } // TTL index based on the value in expiresAt
    },
    verifiedAt: {
        ...MongooseStandardDate,
        default: null
    }
}, {
    timestamps: true , 
    toJSON: { getters: true, virtuals: true }, 
    toObject: { getters: true, virtuals: true } 
});

OTPSchema.pre("save", function (next) {
    if (!this.email && !this.phone) {
        return next(new Error("Either email or phone must be provided for OTP"));
    }
    next();
});

module.exports = mongoose.model("OTP", OTPSchema);