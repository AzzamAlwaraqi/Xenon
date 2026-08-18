const mongoose = require("mongoose");
const { MongooseStandardDate } = require("../utils/dateFormatter");

const employeeSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    salary: {
        type: Number,
        required: true
    },
    workSystem: {
        type: String,
        enum: ["contract","full-time","freelance","part-time"],
        required: true
    },
    hourOfWork: {
        type: Number,
        required: true
    },
    allowances: {
        type: Number,
        default: 0
    },
    position: {
        type: String,
        required: true
    },
    job_active: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });