const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");
const { MongooseStandardDate } = require("../utils/dateFormatter");

const VendorSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7,
    },
    owner_user_id: {
        type: mongoose.Schema.Types.UUID,
        ref: "User",
        required: true,
        unique: true 
    },
    vendor_company_name: {
        type: String,
        required: true,
        trim: true
    },
    vendor_address: {
        type: String,
        required: true
    },
    vendor_city: {
        type: String,
        required: true
    },
    vendor_status: {
        type: String,
        required: true,
        enum: ["active", "inactive", "pending_approval", "rejected"],
        default: "pending_approval"
    }
}, {
    timestamps: true, 
    strict: 'throw',
    versionKey: false
});

module.exports = mongoose.model("Vendor", VendorSchema);