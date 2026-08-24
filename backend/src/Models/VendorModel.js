const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { MongooseStandardDate } = require("../utils/dateFormatter");
const { v7: uuidv7 } = require("uuid");

const VendorSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7,
    },
    vendor_email: {
        type: String,
        required: true,
        unique: true 
    },
    vendor_password: {
        type: String,
        required: true
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
    vendor_type: {
        type: String,
        required: true
    },
    vendor_owner_id: {
        type: mongoose.Schema.Types.UUID,
        required: true,
        ref: "User"
    },
    isDelete: {
        type: Boolean,
        default: false
    },
    deletionRequestedAt: {
        ...MongooseStandardDate, 
        default: null
    }
}, {
    timestamps: true, 
    toJSON: { getters: true, virtuals: true }, 
    toObject: { getters: true, virtuals: true }
});

    
VendorSchema.pre('save', async function() {
    if (!this.isModified('vendor_password')) return;
    this.vendor_password = await bcrypt.hash(this.vendor_password, 12);
});

module.exports = mongoose.model("Vendor", VendorSchema);