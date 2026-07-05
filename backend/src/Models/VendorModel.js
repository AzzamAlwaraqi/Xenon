const mongoose = require("mongoose");

const VendorSchema = new mongoose.Schema({
    vendor_id: {
        type: String,
        required: true
    },
    vendor_name: {
        type: String,
        required: true
    },
    vendor_email: {
        type: String,
        required: true,
        ref: "user"
    },
    vendor_password: {
        type: String,
        required: true
    },
    vendor_mobile: {
        type: String,
        required: true,
        ref: "user"
    },
    vendor_address: {
        type: String,
        required: true
    },
    vendor_city: {
        type: String,
        required: true
    },
    vendor_state: {
        type: String,
        required: true,
        ref: "user"
    },
    vendor_pincode: {
        type: String,
        required: true
    },
    vendor_country: {
        type: String,
        required: true
    },
    vendor_status: {
        type: String,
        required: true,
        enum: ["active", "inactive"],
        default: "active"
    },
    user_id: {
        type: String,
        required: true,
        ref: "user"
    },
    vendor_type: {
        type: String,
        required: true,
        enum: ["individual", "company"],
        default: "individual"
    },
    vendor_owner_name: {
        type: String,
        required: true,
        ref: "user"
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
module.exports = mongoose.model("Vendor", VendorSchema);