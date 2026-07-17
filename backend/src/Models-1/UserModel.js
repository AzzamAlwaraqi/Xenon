const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        min: 8,
        max: 30,
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: ["male", "female"]
    },

    mobileNumber: {
        type: String,
        min: 10,
        max: 10,
        required: true,
        unique: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    oldEmail: {
        type: String,
        default: ""
    },
    emailChangeDate: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        required: true,
        enum: ["admin", "user", "vendor"],
        default: "user"
    },
    DateOfBirth:{
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
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
module.exports = mongoose.model("User", UserSchema);