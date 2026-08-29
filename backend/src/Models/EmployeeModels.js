const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");

const EmployeeSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7,
    },
    user_id: {
        type: mongoose.Schema.Types.UUID,
        ref: "User",
        required: true,
    },
    vendor_id: {
        type: mongoose.Schema.Types.UUID,
        ref: "Vendor",
        default: null 
    },
    position: {
        type: String,
        required: true,
        trim: true,
        minlength: [2, 'Position title is too short']
    },
    workSystem: {
        type: String,
        enum: ["contract", "full-time", "freelance", "part-time"],
        required: true
    },
    salary: {
        type: Number,
        min: [0, 'Salary cannot be negative'],
        required: function() { return ['full-time', 'contract'].includes(this.workSystem); }
    },
    hourOfWork: {
        type: Number,
        min: [0, 'Working hours cannot be negative'],
        max: [24, 'Working hours cannot exceed 24 per day'],
        required: function() { return ['part-time', 'freelance'].includes(this.workSystem); }
    },
    job_active: {
        type: Boolean,
        default: true
    }
}, { 
    timestamps: true,
    strict: 'throw',
    versionKey: false 
});

module.exports = mongoose.model('Employee', EmployeeSchema);