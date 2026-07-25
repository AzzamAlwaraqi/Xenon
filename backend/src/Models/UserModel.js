const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { MongooseStandardDate } = require("../utils/dateFormatter");
const { v7: uuidv7 } = require("uuid");

const UserSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7
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
        required: true,
        enum: ["male", "female"]
    },
    mobileNumber: {
        type: String,
        minlength: [10,'the phone number must be 10 digits'],
        maxlength: [10,'the phone number must be 10 digits'],
        required: true,
        unique: true
    },
    isDelete: {
        type: Boolean,
        default: false
    },
    deletionRequestedAt: {
        type: MongooseStandardDate,
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
        type: MongooseStandardDate,
        default: Date.now
    },
    recoveryMobileNumber: {
        type: String,
        default: ""
    },
    mobileNumberChangeDate: {
        type: MongooseStandardDate,
        default: Date.now
    },
    role: {
        type: String,
        required: true,
        enum: ["admin", "user", "vendor"],
        default: "user"
    },
    DateOfBirth: {
        type: MongooseStandardDate, 
        required: [true, 'تاريخ الميلاد مطلوب']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true, 
    toJSON: { getters: true, virtuals: true }, 
    toObject: { getters: true, virtuals: true }
});

UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

module.exports = mongoose.model("User", UserSchema);