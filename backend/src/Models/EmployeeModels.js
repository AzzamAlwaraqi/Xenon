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
        required: function() { return ['full-time', 'contract'].includes(this.workSystem); }
    },
    workSystem: {
        type: String,
        enum: ["contract", "full-time", "freelance", "part-time"],
        required: true
    },
    hourOfWork: {
        type: Number,
        required: function() { return ['part-time', 'freelance'].includes(this.workSystem); }
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
module.exports = mongoose.model('Employee', employeeSchema);
