const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { v7: uuidv7 } = require("uuid");
const { MongooseStandardDate } = require("../utils/dateFormatter");

const UserSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7,
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        minlength: [8, 'the password must be 8 characters long'],
        required: true
    },
    mobileNumber: {
        type: String,
        minlength: [10, 'the phone number must be 10 digits'],
        maxlength: [10, 'the phone number must be 10 digits'],
        match: [/^[0-9]{10}$/, 'Phone number must contain exactly 10 digits'],
        required: true,
        unique: true
    },
    role: {
        type: String,
        required: true,
        enum: ["admin", "user", "vendor", "employee"],
        default: "user"
    },
    gender: {
        type: String,
        enum: ["male", "female"],
        required: true
    },
    DateOfBirth: {
        ...MongooseStandardDate,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isDelete: {
        type: Boolean,
        default: false
    },
    deletionRequestedAt: {
        ...MongooseStandardDate,
        default: null
    },
    fcm_token: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    strict: 'throw',
    versionKey: false,
    toJSON: {
        getters: true,
        virtuals: true,
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.isDelete;
            delete ret.deletionRequestedAt;
            return ret;
        }
    }
});

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.getJwtToken = function () {
    const jwt = require("jsonwebtoken");
    return jwt.sign(
        { id: this._id, role: this.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "90d" }
    );
};

module.exports = mongoose.model("User", UserSchema);