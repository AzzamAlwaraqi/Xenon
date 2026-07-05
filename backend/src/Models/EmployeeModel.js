const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
    employee_id: {
        type: String,
        required: true
    },
    user_id: {
        type: String,
        required: true
    },
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
    },
    oldPassword: {
        type: String,
        default: ""
    },
    passwordChangeDate: {
        type: Date,
        default: Date.now
    }

});
module.exports = mongoose.model("User", UserSchema);