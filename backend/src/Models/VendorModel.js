const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { MongooseStandardDate } = require("../utils/dateFormatter");
const { v7: uuidv7 } = require("uuid");

const VendorSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7,
    },
    vendor_company:{
        type:String,
        unique:true,
        required:true
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
        enum: ["active", "inactive", "pending_deletion"],
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
    versionKey: false, 
    strict: 'throw',
    toJSON: { getters: true, virtuals: true }, 
    toObject: { getters: true, virtuals: true }
});



module.exports = mongoose.model("Vendor", VendorSchema);