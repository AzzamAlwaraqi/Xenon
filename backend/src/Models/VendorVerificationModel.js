const mongoose = require("mongoose");
const { v7: uuidv7 } = require("uuid");

const ImageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    public_id: { type: String, required: true }
}, { _id: false });

const VendorVerificationSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.UUID,
        default: uuidv7,
    },
    vendor_id: {
        type: mongoose.Schema.Types.UUID,
        required: true,
        ref: "Vendor"
    },
    
    commercial_register_image: { type: ImageSchema, required: true },
    vocational_license_image: { type: ImageSchema, required: true },
    tourism_license_image: { type: ImageSchema, default: null },
    owner_id_image: { type: ImageSchema, required: true },
    
    iban_letter_image: { type: ImageSchema, required: true },
    iban_number: { type: String, required: true },
    
    admin_notes: {
        type: String,
        default: null
    },
    reviewed_by: {
        type: mongoose.Schema.Types.UUID,
        ref: "User",
        default: null
    }
}, {
    timestamps: true,
    strict: 'throw',
    versionKey: false,
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true }
});

module.exports = mongoose.model("VendorVerification", VendorVerificationSchema);
