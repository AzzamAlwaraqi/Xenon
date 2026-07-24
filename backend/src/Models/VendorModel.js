const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { v7: uuidv7 } = require("uuid");
const VendorSchema = new mongoose.Schema({
    _id: {
    type: mongoose.Schema.Types.UUID,
    default: uuidv7 
  },
    vendor_name: {
        type: String,
        required: true
    },
    vendor_email: {
        type: String,
        required: true,
    },
    vendor_password: {
        type: String,
        required: true
    },
    vendor_old_password:{
        type: String,
        default: ""
    },
    vendor_mobile: {
        type: String,
        required: true,
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
    vendor_owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "user"
    },
    vendor_owner_name: {
        type: String,
        required: true,
        ref: "user"
    },
    is_Active:{
        type: Boolean,
        default: true
    },
    deletionRequestedAt: {
        type: Date,
        default: null
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