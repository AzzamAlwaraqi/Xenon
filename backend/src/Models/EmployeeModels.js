const mongoose = require("mongoose");
const { MongooseStandardDate } = require("../utils/dateFormatter");

const employeeSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.UUID,
        ref: "User",
        required: true
    },
    vendor_id: {
        type: mongoose.Schema.Types.UUID,
        ref: "Vendor",
        required: false
    },
    salary: {
        type: Number,
        min: [0, 'Salary cannot be negative'],
        required: function() { return ['full-time', 'contract'].includes(this.workSystem); }
    },
    workSystem: {
        type: String,
        enum: ["contract", "full-time", "freelance", "part-time"],
        required: true
    },
    hourOfWork: {
        type: Number,
        min: [0, 'Working hours cannot be negative'],
        max: [24, 'Working hours cannot exceed 24 per day'],
        required: function() { return ['part-time', 'freelance'].includes(this.workSystem); }
    },
    allowances: {
        type: Number,
        min: [0, 'Allowances cannot be negative'],
        default: 0
    },
    position: {
        type: String,
        required: true,
        trim: true,
        minlength: [2, 'Position title is too short'],
        maxlength: [100, 'Position title is too long']
    },
    job_active: {
        type: Boolean,
        default: false
    },
}, { timestamps: true,
    strict: 'throw',
    versionKey: false,});
module.exports = mongoose.model('Employee', employeeSchema);
