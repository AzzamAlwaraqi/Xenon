const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { checkRole } = require("../utils/checkvalidete");
const { MongooseStandardDate } = require("../utils/dateFormatter");
const { v7: uuidv7 } = require("uuid");

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
        trim: true
    },
    password: {
        type: String,
        minlength: [8, 'the password must be 8 characters long'],
        required: true
    },
    gender: {
        type: String,
        required: function () { return this.role === 'user'; },
        enum: ["male", "female"]
    },
    mobileNumber: {
        type: String,
        minlength: [10, 'the phone number must be 10 digits'],
        maxlength: [10, 'the phone number must be 10 digits'],
        required: true,
        unique: true
    },
    isDelete: {
        type: Boolean,
        default: false
    },
    deletionRequestedAt: {
        ...MongooseStandardDate,
        default: null
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    recoveryEmail: {
        type: String,
        default: "",
        lowercase: true,
        trim: true
    },
    emailChangeDate: {
        ...MongooseStandardDate,
        default: Date.now
    },
    recoveryMobileNumber: {
        type: String,
        default: ""
    },
    mobileNumberChangeDate: {
        ...MongooseStandardDate,
        default: Date.now
    },
    role: {
        type: String,
        required: true,
        enum: ["admin", "user", "vendor"],
        default: "user"
    },
    DateOfBirth: {
        ...MongooseStandardDate,
        required: [function () { return checkRole(this.role, ['user']); }, 'Date of Birth is required']
    },
    fcm_token: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
    },
    { timestamps: true,
    strict: 'throw', 
    versionKey: false,
    toJSON: {
        getters: true,
        virtuals: true,
        transform: function (doc, ret) {
            delete ret.isEmailVerified;
            delete ret.password; // It's good practice to ensure password is not sent too
            delete ret.isDelete;
            delete ret.deletionRequestedAt;
            delete ret.recoveryEmail;
            delete ret.emailChangeDate;
            delete ret.recoveryMobileNumber;
            delete ret.mobileNumberChangeDate;
            delete ret.role;
            delete ret.isActive;
            return ret;
        }
    },
    toObject: { getters: true, virtuals: true }
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